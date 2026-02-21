import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Filter, Search, Calendar, Users, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskStats } from "@/components/tasks/TaskStats";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";

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

export default function TaskManager() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [activeView, setActiveView] = useState<"board" | "list" | "stats">("board");
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [userDeptId, setUserDeptId] = useState<string | null>(null);
  const { isCeoCoo, isLoading: roleLoading } = useUserRole(authUserId || undefined);
  const { toast } = useToast();

  const fetchDepartments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: "Error",
        description: "Failed to load departments",
        variant: "destructive"
      });
    }
  }, [toast]);

  const fetchTasks = useCallback(async () => {
    try {
      const query = supabase
        .from('tasks')
        .select(`
          *,
          department:departments(*)
        `);

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAuthUserId(user.id);

        // Fetch user's department
        const { data: profile } = await supabase
          .from('profiles')
          .select('department')
          .eq('user_id', user.id)
          .single();

        if (profile?.department) {
          // Fetch departments to find the ID
          const { data: depts } = await supabase.from('departments').select('id, name');
          const dept = depts?.find(d => d.name === profile.department);
          if (dept) {
            setUserDeptId(dept.id);
            if (selectedDepartment === "all") {
              setSelectedDepartment(dept.id);
            }
          }
        }
      }
      fetchDepartments();
      fetchTasks();
    };
    init();
  }, [fetchDepartments, fetchTasks]);

  const filteredTasks = tasks.filter(task => {
    const matchesDepartment = selectedDepartment === "all" || task.department_id === selectedDepartment;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;

    return matchesDepartment && matchesSearch && matchesStatus && matchesPriority;
  });

  const getDepartmentStats = () => {
    return departments.map(dept => {
      const deptTasks = tasks.filter(task => task.department_id === dept.id);
      return {
        ...dept,
        totalTasks: deptTasks.length,
        completedTasks: deptTasks.filter(task => task.status === 'done').length,
        inProgressTasks: deptTasks.filter(task => task.status === 'in_progress').length,
        pendingTasks: deptTasks.filter(task => task.status === 'todo').length
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Loading task manager...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Task Manager</h1>
          <p className="text-muted-foreground">Distribute and manage tasks across departments</p>
        </div>
        <Button onClick={() => setShowCreateTask(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Department Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getDepartmentStats()
          .map((dept) => (
            <Card key={dept.id} className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedDepartment(dept.id)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{dept.name}</CardTitle>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: dept.color }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dept.totalTasks}</div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Done: {dept.completedTasks}</span>
                  <span>In Progress: {dept.inProgressTasks}</span>
                  <span>Pending: {dept.pendingTasks}</span>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[120px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* View Tabs */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "board" | "list" | "stats")}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="board" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Board View
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-6">
          <TaskBoard tasks={filteredTasks} departments={departments} onTaskUpdate={fetchTasks} />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <TaskList tasks={filteredTasks} departments={departments} onTaskUpdate={fetchTasks} />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <TaskStats tasks={tasks} departments={departments} />
        </TabsContent>
      </Tabs>

      <CreateTaskDialog
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        departments={departments}
        onTaskCreated={() => {
          fetchTasks();
          setShowCreateTask(false);
        }}
      />
    </div>
  );
}