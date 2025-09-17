import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, Edit, Trash2, CheckCircle } from "lucide-react";
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

interface TaskListProps {
  tasks: Task[];
  departments: Department[];
  onTaskUpdate: () => void;
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

const statusColors = {
  todo: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

export const TaskList = ({ tasks, departments, onTaskUpdate }: TaskListProps) => {
  const { toast } = useToast();

  const markTaskComplete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'done' })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task marked as complete"
      });

      onTaskUpdate();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task deleted successfully"
      });

      onTaskUpdate();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      });
    }
  };

  const getDepartmentName = (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId);
    return department?.name || 'Unknown';
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
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">No tasks found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        tasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-1 h-16 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getDepartmentColor(task.department_id) }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      {task.description && (
                        <p className="text-muted-foreground mt-1">{task.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{getDepartmentName(task.department_id)}</Badge>
                    <Badge className={statusColors[task.status]} variant="secondary">
                      {task.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={priorityColors[task.priority]} variant="secondary">
                      {task.priority}
                    </Badge>
                    
                    {task.due_date && (
                      <div className={`flex items-center gap-1 text-sm ${
                        isOverdue(task.due_date) ? 'text-red-600' : 'text-muted-foreground'
                      }`}>
                        <Calendar className="h-4 w-4" />
                        Due: {formatDate(task.due_date)}
                      </div>
                    )}

                    {task.estimated_hours && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {task.estimated_hours}h estimated
                      </div>
                    )}
                  </div>

                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm">
                      {task.assigned_to ? 'U' : '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex gap-1">
                    {task.status !== 'done' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markTaskComplete(task.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};