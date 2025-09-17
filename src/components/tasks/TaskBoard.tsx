import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, MessageSquare, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Department {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  department_id: string;
  assigned_to: string;
  created_by: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  due_date: string;
  estimated_hours: number;
  actual_hours: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  department?: Department;
}

interface TaskBoardProps {
  tasks: Task[];
  departments: Department[];
  onTaskUpdate: () => void;
}

const statusColumns = [
  { status: 'todo' as const, title: 'To Do', color: 'bg-gray-100 dark:bg-gray-800' },
  { status: 'in_progress' as const, title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900' },
  { status: 'review' as const, title: 'Review', color: 'bg-yellow-100 dark:bg-yellow-900' },
  { status: 'done' as const, title: 'Done', color: 'bg-green-100 dark:bg-green-900' }
];

const priorityColors = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

export const TaskBoard = ({ tasks, departments, onTaskUpdate }: TaskBoardProps) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const { toast } = useToast();

  const updateTaskStatus = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task status updated successfully"
      });

      onTaskUpdate();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive"
      });
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled') => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      updateTaskStatus(draggedTask.id, newStatus);
    }
    setDraggedTask(null);
  };

  const getDepartmentColor = (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId);
    return department?.color || '#3B82F6';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statusColumns.map((column) => (
        <div
          key={column.status}
          className={`rounded-lg p-4 min-h-[600px] ${column.color}`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.status)}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">{column.title}</h3>
            <Badge variant="secondary">
              {tasks.filter(task => task.status === column.status).length}
            </Badge>
          </div>

          <div className="space-y-3">
            {tasks
              .filter(task => task.status === column.status)
              .map((task) => (
                <Card
                  key={task.id}
                  className="cursor-move hover:shadow-md transition-shadow bg-background"
                  draggable
                  onDragStart={() => handleDragStart(task)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-medium leading-tight">
                        {task.title}
                      </CardTitle>
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 ml-2"
                        style={{ backgroundColor: getDepartmentColor(task.department_id) }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <Badge className={priorityColors[task.priority]} variant="secondary">
                        {task.priority}
                      </Badge>
                      {task.due_date && (
                        <div className={`flex items-center gap-1 text-xs ${
                          isOverdue(task.due_date) ? 'text-red-600' : 'text-muted-foreground'
                        }`}>
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.due_date)}
                        </div>
                      )}
                    </div>

                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {task.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            +{task.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        {task.estimated_hours && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {task.estimated_hours}h
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          0
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Paperclip className="h-3 w-3" />
                          0
                        </div>
                      </div>
                      
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {task.assigned_to ? 'U' : '?'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};