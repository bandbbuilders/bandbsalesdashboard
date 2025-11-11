import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { CreateTaskDialog } from "@/components/content/CreateTaskDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ScheduledTask {
  id: string;
  title: string;
  platform: string;
  scheduled_date: string;
  status: string;
}

export default function Scheduler() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [newDate, setNewDate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchScheduledTasks();
  }, [date]);

  const fetchScheduledTasks = async () => {
    if (!date) return;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('content_tasks')
      .select('*')
      .eq('status', 'scheduled')
      .gte('scheduled_date', startOfDay.toISOString())
      .lte('scheduled_date', endOfDay.toISOString())
      .order('scheduled_date');

    if (error) {
      console.error('Error fetching scheduled tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load scheduled posts",
        variant: "destructive",
      });
    } else {
      setScheduledTasks(data || []);
    }
  };

  const handleMoveTask = async () => {
    if (!selectedTask || !newDate) return;

    try {
      const { error } = await supabase
        .from('content_tasks')
        .update({ scheduled_date: new Date(newDate).toISOString() })
        .eq('id', selectedTask.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post moved successfully",
      });

      setShowMoveDialog(false);
      setSelectedTask(null);
      setNewDate("");
      fetchScheduledTasks();
    } catch (error) {
      console.error('Error moving task:', error);
      toast({
        title: "Error",
        description: "Failed to move post",
        variant: "destructive",
      });
    }
  };

  const PLATFORM_COLORS: Record<string, string> = {
    instagram: 'hsl(340 75% 55%)',
    facebook: 'hsl(221 44% 41%)',
    tiktok: 'hsl(0 0% 0%)',
    youtube: 'hsl(0 100% 50%)',
    linkedin: 'hsl(201 100% 35%)'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Content Scheduler</h1>
          <p className="text-muted-foreground">View and manage your scheduled social media posts</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Task
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Scheduled Posts
              {date && ` - ${format(date, 'MMMM dd, yyyy')}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scheduledTasks.length > 0 ? (
              <div className="space-y-3">
                {scheduledTasks.map((task) => (
                  <div key={task.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium">{task.title}</h4>
                      <Badge
                        variant="outline"
                        style={{ borderColor: PLATFORM_COLORS[task.platform] }}
                      >
                        {task.platform}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {task.scheduled_date && format(new Date(task.scheduled_date), 'h:mm a')}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTask(task);
                          setShowMoveDialog(true);
                        }}
                      >
                        Move
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                No scheduled posts for this date
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchScheduledTasks}
      />

      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Post to New Date</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newDate">New Scheduled Date & Time</Label>
              <Input
                id="newDate"
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleMoveTask}>
                Move Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
