import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

  const PLATFORM_COLORS: Record<string, string> = {
    instagram: 'hsl(340 75% 55%)',
    facebook: 'hsl(221 44% 41%)',
    tiktok: 'hsl(0 0% 0%)',
    youtube: 'hsl(0 100% 50%)',
    linkedin: 'hsl(201 100% 35%)'
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Scheduler</h1>
        <p className="text-muted-foreground">View and manage your scheduled social media posts</p>
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
                    <div className="text-sm text-muted-foreground">
                      {task.scheduled_date && format(new Date(task.scheduled_date), 'h:mm a')}
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
    </div>
  );
}
