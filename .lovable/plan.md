
# Fix Notifications, User Dashboard, and Mobile Attendance

## Summary
Three main issues to fix:
1. **Notifications not showing** - The NotificationBell is missing from the User Dashboard header
2. **Attendance/Fines not visible on User Dashboard** - Need to add personal attendance performance and fines sections
3. **Mobile attendance failing** - Users at office are told they're too far due to GPS inaccuracy

---

## Part 1: Add NotificationBell to User Dashboard

The User Dashboard (`/user-dashboard`) is a standalone page without a shared layout, so it doesn't inherit the `NotificationBell` that exists in other layouts.

### Changes
- Add `NotificationBell` component to the User Dashboard header
- Pass the `userId` prop from the authenticated session

---

## Part 2: Add Personal Attendance & Fines Sections to User Dashboard

Users need to see their own attendance performance and fines directly on their dashboard.

### New Sections
1. **Personal Attendance Summary Card**
   - Shows current month's attendance rate, punctuality rate
   - Present/Late/Absent day counts
   - Progress bars for visual representation

2. **Personal Fines Card** (Enhanced)
   - Shows approved/unpaid fines with amounts
   - Total pending fine amount
   - Links to pay or view details

### Technical Approach
- Reuse calculation logic from `UserAttendancePerformance` component
- Create a new lightweight `PersonalAttendanceCard` component for the dashboard
- Enhance the existing fines display on the dashboard

---

## Part 3: Fix Mobile Geofencing (Distance Too Far)

The current 1km radius for mobile is still restrictive because:
- Mobile GPS in buildings can drift 200-500m
- Office coordinates may need verification
- Urban areas have more GPS interference

### Solution
1. **Increase mobile geofence radius** from 1km to 2km for better reliability
2. **Add retry logic with location averaging** - Take multiple readings and use the median
3. **Show more helpful error messages** with the actual distance detected
4. **Add a "force check-in" option** for HR/COO to override when GPS fails

### Configuration Changes
```
Mobile devices: 1km -> 2km radius
Laptops: 10km (unchanged)
```

---

## Part 4: Extend Notifications to Other Modules

Add database triggers for notifications on:
- **Fines**: When a fine is created, approved, or rejected
- **Reminders**: When a reminder is due (within 24h) or overdue
- **Leave requests**: When leave is applied, approved, or rejected

### Database Triggers
1. `fine_notification_trigger` - AFTER INSERT/UPDATE on `fines`
2. `reminder_notification_trigger` - Scheduled job or AFTER INSERT on `reminders`
3. `leave_notification_trigger` - AFTER INSERT/UPDATE on `leave_applications`

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/UserDashboard.tsx` | Add NotificationBell to header, add attendance summary section |
| `src/hooks/useAutoAttendance.ts` | Increase mobile radius from 1000m to 2000m |
| `supabase/migrations/...` | Add notification triggers for fines, reminders, leave |
| `src/components/dashboard/PersonalAttendanceCard.tsx` | New component for personal attendance stats |

### Database Migration - New Notification Triggers

```sql
-- Fine notifications
CREATE OR REPLACE FUNCTION public.create_fine_notifications()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id uuid;
  notification_title text;
  notification_message text;
BEGIN
  -- Get user_id from profile name
  SELECT p.user_id INTO target_user_id
  FROM profiles p
  WHERE LOWER(TRIM(p.full_name)) = LOWER(TRIM(NEW.user_name));
  
  IF target_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    notification_title := 'Fine Issued';
    notification_message := 'Rs ' || NEW.amount || ' fine: ' || NEW.reason;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      IF NEW.status = 'approved' THEN
        notification_title := 'Fine Approved';
        notification_message := 'Rs ' || NEW.amount || ' fine has been approved';
      ELSIF NEW.status = 'rejected' THEN
        notification_title := 'Fine Rejected';
        notification_message := 'Your fine of Rs ' || NEW.amount || ' was rejected';
      ELSIF NEW.status = 'paid' THEN
        notification_title := 'Fine Paid';
        notification_message := 'Rs ' || NEW.amount || ' fine marked as paid';
      ELSE
        RETURN NEW;
      END IF;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (target_user_id, 'fine', notification_title, notification_message);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Leave application notifications
CREATE OR REPLACE FUNCTION public.create_leave_notifications()
RETURNS TRIGGER AS $$
-- Similar pattern for leave_applications table
-- Notify applicant when status changes
-- Notify HR when new application is submitted
```

### Geofence Update

In `useAutoAttendance.ts`:
```typescript
// Before
radiusMeters: 1000, // 1km for mobile

// After  
radiusMeters: 2000, // 2km for mobile GPS accuracy in urban areas
```

### NotificationBell Integration in UserDashboard

Add to the header section (around line 620):
```tsx
import { NotificationBell } from "@/components/notifications/NotificationBell";

// In the header, before the Logout button:
<NotificationBell userId={userId || undefined} />
```

---

## Implementation Order

1. **Quick Wins First**:
   - Add NotificationBell to UserDashboard header
   - Increase mobile geofence radius to 2km

2. **Dashboard Enhancements**:
   - Create PersonalAttendanceCard component
   - Add it to UserDashboard

3. **Database Triggers**:
   - Add fine notification trigger
   - Add leave notification trigger
   - Add reminder due-date notification trigger

---

## Expected Outcomes

After implementation:
- All users will see the notification bell on their dashboard
- Notifications will appear for task changes, fines, reminders, and leave requests
- Bell sound will play when new notifications arrive
- Users will see their personal attendance stats and fines on the dashboard
- Mobile users within 2km of office can mark attendance
- Better error messages will help diagnose remaining GPS issues
