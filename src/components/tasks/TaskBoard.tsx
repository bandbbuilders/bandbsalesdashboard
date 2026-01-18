import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, MessageSquare, Paperclip, Edit, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditTaskDialog } from "./EditTaskDialog";
import { TaskFineDialog } from "./TaskFineDialog";
import { useUserRole } from "@/hooks/useUserRole";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [isDragging, setIsDragging] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [finingTask, setFiningTask] = useState<Task | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { isManager, isCeoCoo } = useUserRole(userId || undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id || null);
    });
  }, []);

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

  const deleteTask = async (taskId: string) => {
    try {
      const { error, count } = await supabase
        .from('tasks')
        .delete({ count: 'exact' })
        .eq('id', taskId);

      if (error) throw error;

      if (count === 0) {
        toast({
          title: "Permission Denied",
          description: "Only the task creator, HR, or CEO/COO can delete this task.",
          variant: "destructive"
        });
        return;
      }

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
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled') => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    
    if (draggedTask && draggedTask.id === taskId && draggedTask.status !== newStatus) {
      updateTaskStatus(taskId, newStatus);
    }
    
    setDraggedTask(null);
    setIsDragging(false);
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
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusColumns.map((column) => (
          <div
            key={column.status}
            className={`rounded-lg p-4 min-h-[600px] transition-all ${column.color} ${
              isDragging ? 'ring-2 ring-primary/50' : ''
            }`}
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
                    className={`cursor-grab hover:shadow-md transition-all bg-background ${
                      draggedTask?.id === task.id ? 'opacity-50' : ''
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium leading-tight flex-1 pr-2">
                          {task.title}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getDepartmentColor(task.department_id) }}
                          />
                          {(isManager || isCeoCoo) && task.assigned_to && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-orange-500 hover:text-orange-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFiningTask(task);
                              }}
                              title="Issue Fine"
                            >
                              <AlertTriangle className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTask(task);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingTaskId(task.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
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

                      {task.created_by && (
                        <div className="text-xs text-muted-foreground border-t pt-2">
                          Created by: <span className="font-medium">{task.created_by}</span>
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
                            {task.assigned_to ? task.assigned_to[0]?.toUpperCase() : '?'}
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

      {/* Edit Task Dialog */}
      {editingTask && (
        <EditTaskDialog
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          task={editingTask}
          departments={departments}
          onTaskUpdated={onTaskUpdate}
        />
      )}

      {/* Fine Dialog */}
      {finingTask && (
        <TaskFineDialog
          isOpen={!!finingTask}
          onClose={() => setFiningTask(null)}
          task={finingTask}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTaskId} onOpenChange={() => setDeletingTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTaskId && deleteTask(deletingTaskId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
