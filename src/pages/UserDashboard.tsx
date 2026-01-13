import { useState, useEffect, useRef } from "react";
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
  ArrowRight,
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  PenTool,
  Target,
  Coins,
  Crown,
  Shield,
  Briefcase,
  Plus,
  Bell,
  MapPin
} from "lucide-react";
import { format, isToday, formatDistanceToNow } from "date-fns";
import ChatWidget from "@/components/chat/ChatWidget";
import { getAllowedModules, ModuleAccess } from "@/lib/departmentAccess";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { useAutoAttendance } from "@/hooks/useAutoAttendance";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  position: string | null;
  department: string | null;
  salary?: number | null;
  manager_id?: string | null;
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

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  position: string | null;
  department: string | null;
  last_seen: string | null;
}

interface DepartmentData {
  id: string;
  name: string;
  description?: string | null;
  color: string;
}

// Notification sound function
const playNotificationSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const profileRef = useRef<Profile | null>(null);
  const { role, isLoading: roleLoading, isCeoCoo, isManager } = useUserRole(userId || undefined);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      fetchData(session.user.id);
      
      // Update last_seen timestamp
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('user_id', session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Auto attendance hook
  const { isChecking: isCheckingAttendance } = useAutoAttendance(profile?.full_name || null);

  // Real-time subscription for new tasks
  useEffect(() => {
    if (!profileRef.current?.full_name) return;
    
    const channel = supabase
      .channel('task-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          const newTask = payload.new as Task;
          if (newTask.assigned_to === profileRef.current?.full_name) {
            // Play notification sound
            playNotificationSound();
            
            // Show toast notification
            toast.success(`New task assigned: ${newTask.title}`, {
              icon: <Bell className="h-4 w-4" />,
              duration: 5000,
            });
            
            // Add task to list
            setTasks(prev => [newTask, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.full_name]);

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
      profileRef.current = profileData;

      // Fetch tasks assigned to this user (use exact name match)
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', profileData.full_name)
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Fetch departments for create task dialog
      const { data: deptData } = await supabase
        .from('departments')
        .select('*');
      setDepartments(deptData || []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch tasks function
  const refetchTasks = async () => {
    if (!profile?.full_name) return;
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', profile.full_name)
      .order('due_date', { ascending: true });
    setTasks(tasksData || []);
  };

  // Fetch team members for managers (same department)
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!profile?.department) return;
      
      try {
        // Get all executives in the same department as the manager
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, position, department, last_seen')
          .eq('department', profile.department)
          .eq('position', 'Executive')
          .neq('id', profile.id);

        if (error) throw error;
        setTeamMembers((data || []) as TeamMember[]);
      } catch (error: any) {
        console.error('Error fetching team members:', error);
      }
    };

    // Fetch for managers (either by role or position)
    const shouldFetchTeam = (isManager || profile?.position === 'Manager') && profile;
    
    if (!roleLoading && shouldFetchTeam) {
      fetchTeamMembers();
    }
  }, [isManager, roleLoading, profile]);

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
  const allowedModules = getAllowedModules(profile?.department || null);

  const getRoleBadge = (userRole: AppRole | null) => {
    switch (userRole) {
      case 'ceo_coo':
        return { label: 'CEO/COO', icon: Crown, color: 'bg-amber-500 text-white' };
      case 'manager':
        return { label: 'Manager', icon: Shield, color: 'bg-blue-500 text-white' };
      case 'executive':
        return { label: 'Executive', icon: Briefcase, color: 'bg-green-500 text-white' };
      default:
        return null;
    }
  };

  const roleBadge = getRoleBadge(role);

  const getModuleIcon = (moduleId: string) => {
    switch (moduleId) {
      case 'sales': return BarChart3;
      case 'crm': return Users;
      case 'tasks': return FileText;
      case 'accounting': return TrendingUp;
      case 'content': return PenTool;
      case 'attendance': return Target;
      case 'commission-management': return Coins;
      default: return FileText;
    }
  };

  const getModuleColor = (moduleId: string) => {
    switch (moduleId) {
      case 'sales': return 'bg-blue-500';
      case 'crm': return 'bg-green-500';
      case 'tasks': return 'bg-purple-500';
      case 'accounting': return 'bg-orange-500';
      case 'content': return 'bg-pink-500';
      case 'attendance': return 'bg-indigo-500';
      case 'commission-management': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

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
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{profile?.full_name}</h1>
                {roleBadge && !roleLoading && (
                  <Badge className={roleBadge.color}>
                    <roleBadge.icon className="h-3 w-3 mr-1" />
                    {roleBadge.label}
                  </Badge>
                )}
              </div>
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
        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Applications</h2>
          <Button onClick={() => setShowCreateTask(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Allowed Modules Section */}
        <div>
          {allowedModules.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No modules available for your department. Please contact your administrator.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allowedModules.map((module) => {
                const Icon = getModuleIcon(module.id);
                return (
                  <Card 
                    key={module.id} 
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/20"
                    onClick={() => navigate(module.path)}
                  >
                    <CardContent className="pt-6 text-center">
                      <div className={`mx-auto w-12 h-12 rounded-lg ${getModuleColor(module.id)} flex items-center justify-center mb-3`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-medium text-sm">{module.title}</h3>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
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

        {/* Team Members Section for Managers */}
        {(isManager || profile?.position === 'Manager') && teamMembers.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <CardTitle>Your Team Members</CardTitle>
              <Badge variant="secondary" className="ml-auto">{teamMembers.length} members</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center relative">
                      <User className="h-5 w-5 text-primary" />
                      {member.last_seen && new Date(member.last_seen) > new Date(Date.now() - 5 * 60 * 1000) && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{member.full_name}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {member.position} • {member.department}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {member.last_seen ? (
                          <span>Last seen: {formatDistanceToNow(new Date(member.last_seen), { addSuffix: true })}</span>
                        ) : (
                          <span>Never logged in</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {(isManager || profile?.position === 'Manager') && teamMembers.length === 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <CardTitle>Your Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                No executives in your department yet. Executives will appear here once they sign up.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        departments={departments}
        onTaskCreated={() => {
          setShowCreateTask(false);
          refetchTasks();
        }}
      />

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default UserDashboard;
