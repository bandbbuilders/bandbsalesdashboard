-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to generate task notifications
CREATE OR REPLACE FUNCTION public.create_task_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_type text;
  notification_title text;
  notification_message text;
  assignee_name text;
  assignee_names text[];
  old_assignee_names text[];
  dept_user RECORD;
  creator_user_id uuid;
  target_user_ids uuid[] := '{}';
  target_id uuid;
BEGIN
  -- Determine notification type and message based on operation
  IF TG_OP = 'INSERT' THEN
    notification_type := 'task_created';
    notification_title := 'New Task Created';
    notification_message := 'New task: ' || NEW.title;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check what changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      notification_type := 'task_status_changed';
      notification_title := 'Task Status Updated';
      notification_message := '"' || NEW.title || '" is now ' || REPLACE(NEW.status::text, '_', ' ');
    ELSIF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      notification_type := 'task_assignees_changed';
      notification_title := 'Task Reassigned';
      notification_message := '"' || NEW.title || '" assigned to ' || COALESCE(NEW.assigned_to, 'Unassigned');
    ELSIF OLD.priority IS DISTINCT FROM NEW.priority THEN
      notification_type := 'task_priority_changed';
      notification_title := 'Task Priority Changed';
      notification_message := '"' || NEW.title || '" priority is now ' || NEW.priority::text;
    ELSIF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
      notification_type := 'task_due_date_changed';
      notification_title := 'Task Due Date Changed';
      notification_message := '"' || NEW.title || '" due date updated';
    ELSIF OLD.description IS DISTINCT FROM NEW.description THEN
      notification_type := 'task_updated';
      notification_title := 'Task Updated';
      notification_message := '"' || NEW.title || '" description was updated';
    ELSE
      -- No significant change
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Get creator's user_id
  SELECT p.user_id INTO creator_user_id
  FROM profiles p
  WHERE LOWER(TRIM(p.full_name)) = LOWER(TRIM(NEW.created_by));

  IF creator_user_id IS NOT NULL THEN
    target_user_ids := array_append(target_user_ids, creator_user_id);
  END IF;

  -- Parse assigned_to (comma-separated names) and get their user_ids
  IF NEW.assigned_to IS NOT NULL AND TRIM(NEW.assigned_to) != '' THEN
    assignee_names := string_to_array(NEW.assigned_to, ',');
    FOREACH assignee_name IN ARRAY assignee_names
    LOOP
      SELECT p.user_id INTO target_id
      FROM profiles p
      WHERE LOWER(TRIM(p.full_name)) = LOWER(TRIM(assignee_name));
      
      IF target_id IS NOT NULL AND NOT (target_id = ANY(target_user_ids)) THEN
        target_user_ids := array_append(target_user_ids, target_id);
      END IF;
    END LOOP;
  END IF;

  -- For assignee changes, also notify old assignees
  IF TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND OLD.assigned_to IS NOT NULL THEN
    old_assignee_names := string_to_array(OLD.assigned_to, ',');
    FOREACH assignee_name IN ARRAY old_assignee_names
    LOOP
      SELECT p.user_id INTO target_id
      FROM profiles p
      WHERE LOWER(TRIM(p.full_name)) = LOWER(TRIM(assignee_name));
      
      IF target_id IS NOT NULL AND NOT (target_id = ANY(target_user_ids)) THEN
        target_user_ids := array_append(target_user_ids, target_id);
      END IF;
    END LOOP;
  END IF;

  -- Get all users in the same department
  IF NEW.department_id IS NOT NULL THEN
    FOR dept_user IN
      SELECT p.user_id
      FROM profiles p
      JOIN departments d ON LOWER(TRIM(p.department)) = LOWER(TRIM(d.name))
      WHERE d.id = NEW.department_id
        AND p.user_id IS NOT NULL
    LOOP
      IF NOT (dept_user.user_id = ANY(target_user_ids)) THEN
        target_user_ids := array_append(target_user_ids, dept_user.user_id);
      END IF;
    END LOOP;
  END IF;

  -- Create notifications for all target users
  FOREACH target_id IN ARRAY target_user_ids
  LOOP
    INSERT INTO notifications (user_id, type, title, message, task_id)
    VALUES (target_id, notification_type, notification_title, notification_message, NEW.id);
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for task changes
CREATE TRIGGER task_notification_trigger
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.create_task_notifications();