-- Create a new migration to update the notification trigger
-- This replaces the existing 'create_task_notifications' function

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
  creator_user_id uuid;
  coo_user_record RECORD;
  target_user_ids uuid[] := '{}';
  target_id uuid;
  formatted_message text;
BEGIN
  -- 1. Construct the Rich Message
  -- "Task name, Created by, Assigned to"
  formatted_message := NEW.title || 
                       E'\nCreated by: ' || COALESCE(NEW.created_by, 'Unknown') || 
                       E'\nAssigned to: ' || COALESCE(NEW.assigned_to, 'Unassigned');

  -- 2. Determine Notification Type
  IF TG_OP = 'INSERT' THEN
    notification_type := 'task_created';
    notification_title := 'New Task Created';
    notification_message := formatted_message;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      notification_type := 'task_status_changed';
      notification_title := 'Task Status: ' || REPLACE(NEW.status::text, '_', ' ');
      notification_message := formatted_message; -- Keep rich details even on status change
    ELSIF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      notification_type := 'task_assignees_changed';
      notification_title := 'Task Reassigned';
      notification_message := formatted_message;
    ELSE
      -- Skip other updates to reduce spam, or just return basic update
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- 3. Identify Recipients
  
  -- A. Creator
  SELECT p.user_id INTO creator_user_id
  FROM profiles p
  WHERE LOWER(TRIM(p.full_name)) = LOWER(TRIM(NEW.created_by));

  IF creator_user_id IS NOT NULL THEN
    target_user_ids := array_append(target_user_ids, creator_user_id);
  END IF;

  -- B. Assignees (Current)
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

  -- C. COO / CEO (Always notify)
  FOR coo_user_record IN
    SELECT user_id FROM user_roles WHERE role = 'ceo_coo'
  LOOP
    IF NOT (coo_user_record.user_id = ANY(target_user_ids)) THEN
      target_user_ids := array_append(target_user_ids, coo_user_record.user_id);
    END IF;
  END LOOP;

  -- D. Old Assignees (only if re-assigned)
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

  -- 4. Insert Notifications
  FOREACH target_id IN ARRAY target_user_ids
  LOOP
    INSERT INTO notifications (user_id, type, title, message, task_id)
    VALUES (target_id, notification_type, notification_title, notification_message, NEW.id);
  END LOOP;

  RETURN NEW;
END;
$$;
