import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useNotificationSound } from "@/hooks/useNotificationSound";

interface Notification {
  id: string;
  type: "task_assigned" | "task_updated" | "task_removed" | "reminder" | "fine";
  title: string;
  message: string;
  read: boolean;
  created_at: Date;
  task_id?: string;
}

interface NotificationBellProps {
  userName?: string;
  userId?: string;
}

export const NotificationBell = ({ userName, userId }: NotificationBellProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const { playNotificationSound } = useNotificationSound();
  const processedTaskIds = useState(new Set<string>())[0];

  const unreadCount = notifications.filter(n => !n.read).length;

  // Helper to check if user is assigned to a task (supports comma-separated multiple assignees)
  const isUserAssigned = useCallback((assignedTo: string | null, name: string): boolean => {
    if (!assignedTo || !name) return false;
    const assignees = assignedTo.split(',').map(a => a.trim().toLowerCase());
    return assignees.includes(name.toLowerCase());
  }, []);

  // Add notification
  const addNotification = useCallback((notification: Omit<Notification, "id" | "created_at" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      created_at: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    playNotificationSound();
  }, [playNotificationSound]);

  // Subscribe to task changes
  useEffect(() => {
    if (!userName) return;

    const channel = supabase
      .channel('notification-bell-tasks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          const newTask = payload.new as any;
          
          // Check if current user is among the assignees
          if (isUserAssigned(newTask.assigned_to, userName)) {
            if (!processedTaskIds.has(newTask.id)) {
              processedTaskIds.add(newTask.id);
              addNotification({
                type: "task_assigned",
                title: "New Task Assigned",
                message: `You've been assigned to: ${newTask.title}`,
                task_id: newTask.id,
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          const updatedTask = payload.new as any;
          const oldTask = payload.old as any;
          
          const isAssigned = isUserAssigned(updatedTask.assigned_to, userName);
          const wasAssigned = isUserAssigned(oldTask.assigned_to, userName);
          
          // User was just added to the task
          if (isAssigned && !wasAssigned) {
            addNotification({
              type: "task_assigned",
              title: "Task Assigned",
              message: `You've been added to: ${updatedTask.title}`,
              task_id: updatedTask.id,
            });
          }
          // User was removed from the task
          else if (!isAssigned && wasAssigned) {
            addNotification({
              type: "task_removed",
              title: "Task Unassigned",
              message: `You've been removed from: ${updatedTask.title}`,
              task_id: updatedTask.id,
            });
          }
          // Task was updated while user is assigned
          else if (isAssigned) {
            if (oldTask.status !== updatedTask.status) {
              addNotification({
                type: "task_updated",
                title: "Task Status Changed",
                message: `"${updatedTask.title}" is now ${updatedTask.status.replace('_', ' ')}`,
                task_id: updatedTask.id,
              });
            } else if (oldTask.priority !== updatedTask.priority) {
              addNotification({
                type: "task_updated",
                title: "Task Priority Changed",
                message: `"${updatedTask.title}" priority changed to ${updatedTask.priority}`,
                task_id: updatedTask.id,
              });
            }
          }
        }
      )
      .subscribe();

    // Subscribe to fines
    const finesChannel = supabase
      .channel('notification-bell-fines')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fines'
        },
        (payload) => {
          const fine = payload.new as any;
          if (fine.user_name?.toLowerCase() === userName?.toLowerCase()) {
            addNotification({
              type: "fine",
              title: "Fine Applied",
              message: `Rs ${fine.amount} fine: ${fine.reason}`,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to reminders
    const remindersChannel = supabase
      .channel('notification-bell-reminders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reminders'
        },
        (payload) => {
          const reminder = payload.new as any;
          if (reminder.user_id === userId) {
            addNotification({
              type: "reminder",
              title: "New Reminder",
              message: reminder.title,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(finesChannel);
      supabase.removeChannel(remindersChannel);
    };
  }, [userName, userId, isUserAssigned, addNotification, processedTaskIds]);

  // Mark all as read when opening
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "task_assigned":
        return "🎯";
      case "task_updated":
        return "📝";
      case "task_removed":
        return "❌";
      case "reminder":
        return "⏰";
      case "fine":
        return "💰";
      default:
        return "📌";
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-destructive text-destructive-foreground"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={clearAllNotifications}
            >
              Clear all
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-muted/50 transition-colors ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(notification.created_at, { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
