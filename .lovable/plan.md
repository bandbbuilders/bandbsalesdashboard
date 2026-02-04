
# Fix Task Notifications System

## Problem Summary
Users are not receiving notifications when tasks are changed in the Task Manager. After investigation, I found several issues:

1. **Race conditions**: The notification subscription activates before user department data loads
2. **No persistence**: Notifications disappear on page refresh
3. **Duplicate channels**: Both TaskBoard and NotificationBell subscribe to the same events, causing conflicts
4. **Realtime may not be enabled**: The tasks table may need realtime configuration

## Solution Overview
Create a persistent notification system with a dedicated database table and fix the realtime subscription logic.

---

## Implementation Steps

### Step 1: Create Notifications Table
Create a new `notifications` table to store notifications persistently:
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `type` (text: task_assigned, task_updated, department_task, etc.)
- `title` (text)
- `message` (text)
- `task_id` (uuid, optional reference to tasks)
- `read` (boolean, default false)
- `created_at` (timestamptz)

Add RLS policies so users can only see their own notifications.

### Step 2: Create Database Trigger for Task Changes
Create a database function and trigger that automatically creates notifications when:
- A task is created (notify assignees + department members + creator)
- A task status changes (notify same group)
- A task's assignees change (notify old and new assignees)
- A task's priority or other fields change (notify assignees + department)

This approach is more reliable than client-side subscriptions because it runs at the database level.

### Step 3: Update NotificationBell Component
Modify `NotificationBell` to:
- Fetch notifications from the database on mount
- Subscribe to the `notifications` table (not tasks) for real-time updates
- Mark notifications as read when the dropdown opens
- Play sound when new notifications arrive via realtime

### Step 4: Remove Duplicate Subscriptions
Remove the task notification subscription from `TaskBoard.tsx` since notifications will now be handled centrally through the database trigger and NotificationBell.

### Step 5: Enable Realtime for Notifications Table
Configure the notifications table for Supabase realtime so users receive instant updates.

---

## Notification Triggers (as per your requirements)

**Who gets notified:**
- Task creator
- All assigned users (comma-separated in assigned_to)
- All users in the same department as the task

**When notifications are sent:**
- New task created
- Status changed
- Assignees changed
- Priority/due date/description changed

---

## Technical Details

### Database Migration
```sql
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

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

### Database Function for Creating Notifications
A trigger function will:
1. Parse the `assigned_to` field to get all assignees
2. Query the `profiles` table to find users in the task's department
3. Include the task creator
4. Create notification records for each unique user

### NotificationBell Changes
- Query notifications table on mount
- Subscribe to `postgres_changes` on `notifications` table filtered by current user
- Remove the complex task-table subscription logic

---

## Files to be Modified

| File | Changes |
|------|---------|
| `supabase/migrations/...` | New migration for notifications table + triggers |
| `src/components/notifications/NotificationBell.tsx` | Rewrite to use notifications table |
| `src/components/tasks/TaskBoard.tsx` | Remove notification subscription (keep task UI only) |
| `src/integrations/supabase/types.ts` | Auto-updated with new table types |

---

## Benefits of This Approach

1. **Reliability**: Database triggers are more reliable than client-side subscriptions
2. **Persistence**: Notifications survive page refresh and work across devices
3. **Simplicity**: One realtime subscription (notifications table) instead of multiple
4. **Consistency**: All users receive the same notifications for the same events
5. **Performance**: Notification creation happens at database level, not in each client
