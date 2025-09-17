import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Calendar, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddReminder } from "@/components/crm/AddReminder";

interface Reminder {
  id: string;
  lead_id: string;
  user_id: string;
  title: string;
  description: string;
  due_date: string;
  completed: boolean;
  reminder_type: string;
  created_at: string;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast({
        title: "Error",
        description: "Failed to load reminders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (reminderId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ completed: !completed })
        .eq('id', reminderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: completed ? "Reminder marked as incomplete" : "Reminder completed"
      });

      fetchReminders();
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast({
        title: "Error",
        description: "Failed to update reminder",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (reminder: Reminder) => {
    if (reminder.completed) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    
    const dueDate = new Date(reminder.due_date);
    const now = new Date();
    
    if (dueDate < now) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    } else if (dueDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
    
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  const getStatusText = (reminder: Reminder) => {
    if (reminder.completed) {
      return 'Completed';
    }
    
    const dueDate = new Date(reminder.due_date);
    const now = new Date();
    
    if (dueDate < now) {
      return 'Overdue';
    } else if (dueDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return 'Due Soon';
    }
    
    return 'Pending';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Loading reminders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reminders</h1>
          <p className="text-muted-foreground">Manage all your reminders and follow-ups</p>
        </div>
        <Button onClick={() => setShowAddReminder(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Reminder
        </Button>
      </div>

      {reminders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No reminders found</p>
              <p className="text-sm text-muted-foreground">Create your first reminder to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reminders.map((reminder) => (
            <Card key={reminder.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{reminder.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(reminder)}>
                      {reminder.completed ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                      {getStatusText(reminder)}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleComplete(reminder.id, reminder.completed)}
                    >
                      {reminder.completed ? "Mark Incomplete" : "Mark Complete"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {reminder.description && (
                  <p className="text-sm mb-2">{reminder.description}</p>
                )}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Due: {new Date(reminder.due_date).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddReminder
        leadId=""
        open={showAddReminder}
        onOpenChange={(open) => {
          setShowAddReminder(open);
          if (!open) {
            fetchReminders();
          }
        }}
      />
    </div>
  );
}