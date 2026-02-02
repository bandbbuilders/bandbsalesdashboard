import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, Users } from "lucide-react";

interface Department {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  department_id: string;
  assigned_to: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  due_date: string;
  estimated_hours: number;
  tags: string[];
}

interface Profile {
  id: string;
  full_name: string;
  department: string | null;
}

interface EditTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  departments: Department[];
  onTaskUpdated: () => void;
}

export const EditTaskDialog = ({ isOpen, onClose, task, departments, onTaskUpdated }: EditTaskDialogProps) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [departmentId, setDepartmentId] = useState(task.department_id || "");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(task.priority);
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'>(task.status);
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : "");
  const [dueTime, setDueTime] = useState(task.due_date ? task.due_date.split('T')[1]?.slice(0, 5) || "" : "");
  const [estimatedHours, setEstimatedHours] = useState(task.estimated_hours?.toString() || "");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setTitle(task.title);
      setDescription(task.description || "");
      setDepartmentId(task.department_id || "");
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.due_date ? task.due_date.split('T')[0] : "");
      setDueTime(task.due_date ? task.due_date.split('T')[1]?.slice(0, 5) || "" : "");
      setEstimatedHours(task.estimated_hours?.toString() || "");
      
      // Parse multiple assignees from comma-separated string
      const assignees = task.assigned_to ? task.assigned_to.split(',').map(a => a.trim()).filter(Boolean) : [];
      setSelectedAssignees(assignees);
      
      fetchUsers();
    }
  }, [isOpen, task]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, department')
      .order('full_name');
    
    if (!error && data) {
      setUsers(data);
    }
  };

  const toggleAssignee = (userName: string) => {
    setSelectedAssignees(prev => 
      prev.includes(userName)
        ? prev.filter(a => a !== userName)
        : [...prev, userName]
    );
  };

  const removeAssignee = (userName: string) => {
    setSelectedAssignees(prev => prev.filter(a => a !== userName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const previousAssignees = task.assigned_to ? task.assigned_to.split(',').map(a => a.trim()).filter(Boolean) : [];
      const newAssigneesString = selectedAssignees.join(', ');
      
      // Check what changed for notifications
      const statusChanged = task.status !== status;
      const assigneesChanged = task.assigned_to !== newAssigneesString;
      const otherChanges = task.title !== title.trim() || 
                          task.description !== description.trim() ||
                          task.priority !== priority ||
                          task.department_id !== departmentId;

      // Build due_date with time
      let fullDueDate: string | null = null;
      if (dueDate) {
        fullDueDate = dueTime 
          ? new Date(`${dueDate}T${dueTime}:00`).toISOString()
          : new Date(`${dueDate}T23:59:59`).toISOString();
      }

      const { error } = await supabase
        .from('tasks')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          department_id: departmentId || null,
          priority,
          status,
          assigned_to: newAssigneesString || null,
          due_date: fullDueDate,
          estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
        })
        .eq('id', task.id);

      if (error) throw error;

      // The real-time subscription in UserDashboard will handle notifications
      // for status changes and assignments
      
      toast({ title: "Success", description: "Task updated successfully" });
      onTaskUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(val) => setPriority(val as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(val) => setStatus(val as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estimatedHours">Est. Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="Hours"
                min="0"
                step="0.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dueTime">Due Time</Label>
              <Input
                id="dueTime"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>

          {/* Multi-user Assignment Section */}
          <div>
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assign To (Multiple)
            </Label>
            
            {/* Selected Assignees */}
            {selectedAssignees.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {selectedAssignees.map((name) => (
                  <Badge key={name} variant="secondary" className="flex items-center gap-1">
                    {name}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeAssignee(name)}
                    />
                  </Badge>
                ))}
              </div>
            )}
            
            {/* User Selection List */}
            <ScrollArea className="h-[150px] border rounded-md p-2 mt-2">
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedAssignees.includes(user.full_name)}
                      onCheckedChange={() => toggleAssignee(user.full_name)}
                    />
                    <label 
                      htmlFor={`user-${user.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {user.full_name}
                      {user.department && (
                        <span className="text-muted-foreground ml-2 text-xs">
                          ({user.department})
                        </span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
