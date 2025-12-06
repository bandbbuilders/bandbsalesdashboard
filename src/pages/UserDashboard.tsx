import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  LogOut, 
  User,
  CalendarDays,
  ArrowRight
} from "lucide-react";
import { format, isToday } from "date-fns";
import ChatWidget from "@/components/chat/ChatWidget";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  position: string | null;
  department: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      fetchData(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch tasks assigned to this user
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', profileData.full_name)
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getTaskStats = () => {
    const completed = tasks.filter(t => t.status === 'done').length;
    const pending = tasks.filter(t => t.status === 'todo').length;
    const inReview = tasks.filter(t => t.status === 'review').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    return { completed, pending, inReview, inProgress };
  };

  const getTodayTasks = () => {
    return tasks.filter(t => t.due_date && isToday(new Date(t.due_date)) && t.status !== 'done');
  };

  const getInProgressTasks = () => {
    return tasks.filter(t => t.status === 'in_progress');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500 text-white';
      case 'in_progress': return 'bg-blue-500 text-white';
      case 'review': return 'bg-purple-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const stats = getTaskStats();
  const todayTasks = getTodayTasks();
  const inProgressTasks = getInProgressTasks();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-16 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{profile?.full_name}</h1>
              <p className="text-sm text-muted-foreground">
                {profile?.position} • {profile?.department}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-green-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-10 w-10 text-yellow-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Waiting Approval</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.inReview}</p>
                </div>
                <AlertCircle className="h-10 w-10 text-purple-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
                </div>
                <ArrowRight className="h-10 w-10 text-blue-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <CardTitle>Today's Tasks</CardTitle>
            <Badge variant="secondary" className="ml-auto">{todayTasks.length} tasks</Badge>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No tasks due today</p>
            ) : (
              <div className="space-y-3">
                {todayTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      <Badge className={getStatusColor(task.status)}>{task.status.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks In Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <ArrowRight className="h-5 w-5 text-blue-500" />
            <CardTitle>Tasks In Progress</CardTitle>
            <Badge variant="secondary" className="ml-auto">{inProgressTasks.length} tasks</Badge>
          </CardHeader>
          <CardContent>
            {inProgressTasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No tasks in progress</p>
            ) : (
              <div className="space-y-3">
                {inProgressTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {task.due_date && (
                        <span className="text-sm text-muted-foreground">
                          Due: {format(new Date(task.due_date), 'MMM d')}
                        </span>
                      )}
                      <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default UserDashboard;
