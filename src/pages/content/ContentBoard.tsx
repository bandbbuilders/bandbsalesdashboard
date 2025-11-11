import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateTaskDialog } from "@/components/content/CreateTaskDialog";
import { TaskColumn } from "@/components/content/TaskColumn";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ContentTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  platform: string;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string | null;
}

const STATUSES = [
  { id: 'idea', name: 'Idea', color: 'hsl(var(--muted))' },
  { id: 'script', name: 'Script', color: 'hsl(var(--warning))' },
  { id: 'design', name: 'Design/Edit', color: 'hsl(210 100% 60%)' },
  { id: 'approval', name: 'Approval', color: 'hsl(var(--primary))' },
  { id: 'scheduled', name: 'Scheduled', color: 'hsl(var(--success))' },
  { id: 'published', name: 'Published', color: 'hsl(142 71% 35%)' }
];

export default function ContentBoard() {
  const [tasks, setTasks] = useState<ContentTask[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('content_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load content tasks",
        variant: "destructive",
      });
    } else {
      setTasks(data || []);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    // Optimistic update
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    const { error } = await supabase
      .from('content_tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
      fetchTasks(); // Revert on error
    } else {
      toast({
        title: "Success",
        description: "Task status updated",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Content Production Board</h1>
          <p className="text-muted-foreground">Manage content workflow from idea to publication</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUSES.map((status) => (
              <TaskColumn
                key={status.id}
                status={status}
                tasks={tasks.filter(task => task.status === status.id)}
                onTaskUpdate={fetchTasks}
              />
            ))}
          </div>
        </DndContext>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Assigned To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {STATUSES.find(s => s.id === task.status)?.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        task.priority === 'high' ? 'destructive' :
                        task.priority === 'medium' ? 'default' : 'secondary'
                      }>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{task.platform}</TableCell>
                    <TableCell>
                      {task.due_date ? format(new Date(task.due_date), 'MMM dd, yyyy') : '-'}
                    </TableCell>
                    <TableCell>{task.assigned_to || 'Unassigned'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchTasks}
      />
    </div>
  );
}
