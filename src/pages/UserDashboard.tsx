import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  MapPin,
  DollarSign,
  Activity,
  Building2
} from "lucide-react";
import { format, isToday, formatDistanceToNow, differenceInHours, isPast, isTomorrow } from "date-fns";
import ChatWidget from "@/components/chat/ChatWidget";
import { getAllowedModules, ModuleAccess, ALL_MODULES } from "@/lib/departmentAccess";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { useAutoAttendance } from "@/hooks/useAutoAttendance";
import { AttendanceStatusCard } from "@/components/dashboard/AttendanceStatusCard";

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

interface Fine {
  id: string;
  user_name: string;
  amount: number;
  reason: string;
  date: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  created_at?: string | null;
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

interface BusinessStats {
  totalSales: number;
  totalSalesValue: number;
  totalLeads: number;
  totalTasks: number;
  totalCommissions: number;
  todayAttendance: number;
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
  const [allUsers, setAllUsers] = useState<TeamMember[]>([]);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [businessStats, setBusinessStats] = useState<BusinessStats | null>(null);
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

  // Auto attendance hook with enhanced features
  const { 
    isChecking: isCheckingAttendance, 
    attendanceStatus, 
    locationStatus, 
    manualCheckIn,
    refreshLocation 
  } = useAutoAttendance(profile?.full_name || null);

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

      // Fetch tasks - for COO, fetch ALL tasks; for others, fetch only assigned tasks
      // Note: isCeoCoo is not yet available here, we'll refetch for COO in useEffect
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

      // Fetch fines for this user
      const { data: finesData } = await supabase
        .from('fines')
        .select('*')
        .eq('user_name', profileData.full_name)
        .order('date', { ascending: false });
      setFines((finesData || []) as Fine[]);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch tasks function
  const refetchTasks = async () => {
    if (isCeoCoo) {
      // COO sees all tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true });
      setTasks(tasksData || []);
    } else if (profile?.full_name) {
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', profile.full_name)
        .order('due_date', { ascending: true });
      setTasks(tasksData || []);
    }
  };

  // Fetch all tasks for COO when role is loaded
  useEffect(() => {
    const fetchAllTasks = async () => {
      if (isCeoCoo) {
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .order('due_date', { ascending: true });
        setTasks(tasksData || []);
      }
    };
    if (!roleLoading && isCeoCoo) {
      fetchAllTasks();
    }
  }, [isCeoCoo, roleLoading]);

  // Mark task as complete
  const markTaskComplete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'done' })
        .eq('id', taskId);

      if (error) throw error;
      
      toast.success('Task marked as complete!');
      refetchTasks();
    } catch (error: any) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  // Get deadline urgency class
  const getDeadlineClass = (dueDate: string | null) => {
    if (!dueDate) return '';
    const due = new Date(dueDate);
    const now = new Date();
    const hoursUntilDue = differenceInHours(due, now);
    
    if (isPast(due)) {
      return 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20';
    } else if (hoursUntilDue <= 2) {
      return 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20';
    } else if (hoursUntilDue <= 24) {
      return 'border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20';
    } else if (isTomorrow(due) || hoursUntilDue <= 48) {
      return 'border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
    }
    return '';
  };

  // Format due time display
  const formatDueTime = (dueDate: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    
    if (isPast(due)) {
      return { text: `Overdue by ${formatDistanceToNow(due)}`, urgent: true };
    }
    
    const hoursLeft = differenceInHours(due, now);
    if (hoursLeft < 1) {
      return { text: 'Due in less than an hour!', urgent: true };
    } else if (hoursLeft <= 2) {
      return { text: `Due in ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}`, urgent: true };
    } else if (hoursLeft <= 24) {
      return { text: `Due in ${hoursLeft} hours`, urgent: false };
    } else if (isToday(due)) {
      return { text: `Today at ${format(due, 'h:mm a')}`, urgent: false };
    } else if (isTomorrow(due)) {
      return { text: `Tomorrow at ${format(due, 'h:mm a')}`, urgent: false };
    }
    return { text: format(due, 'MMM d, h:mm a'), urgent: false };
  };

  // Fetch team members for managers (same department) OR all users for CEO/COO
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!profile) return;
      
      try {
        if (isCeoCoo) {
          // CEO/COO sees ALL users
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, position, department, last_seen')
            .neq('id', profile.id)
            .order('department', { ascending: true });

          if (error) throw error;
          setAllUsers((data || []) as TeamMember[]);
          
          // Also fetch business stats for COO
          const [salesData, leadsData, tasksData, commissionsData, attendanceData] = await Promise.all([
            supabase.from('sales').select('unit_total_price'),
            supabase.from('leads').select('id'),
            supabase.from('tasks').select('id, status'),
            supabase.from('commissions').select('total_amount'),
            supabase.from('attendance').select('id').eq('date', new Date().toISOString().split('T')[0])
          ]);
          
          setBusinessStats({
            totalSales: salesData.data?.length || 0,
            totalSalesValue: salesData.data?.reduce((sum, s) => sum + (s.unit_total_price || 0), 0) || 0,
            totalLeads: leadsData.data?.length || 0,
            totalTasks: tasksData.data?.length || 0,
            totalCommissions: commissionsData.data?.reduce((sum, c) => sum + (c.total_amount || 0), 0) || 0,
            todayAttendance: attendanceData.data?.length || 0
          });
        } else if (isManager || profile?.position === 'Manager') {
          // Managers see executives in their department
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, position, department, last_seen')
            .eq('department', profile.department)
            .eq('position', 'Executive')
            .neq('id', profile.id);

          if (error) throw error;
          setTeamMembers((data || []) as TeamMember[]);
        }
      } catch (error: any) {
        console.error('Error fetching team members:', error);
      }
    };

    if (!roleLoading && profile) {
      fetchTeamMembers();
    }
  }, [isCeoCoo, isManager, roleLoading, profile]);

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
  const allowedModules = getAllowedModules(profile?.department || null, isCeoCoo);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `Rs ${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `Rs ${(amount / 100000).toFixed(2)} Lac`;
    }
    return `Rs ${amount.toLocaleString()}`;
  };

  const getDepartmentColor = (dept: string | null) => {
    switch (dept) {
      case 'Marketing': return 'bg-pink-500';
      case 'Sales': return 'bg-green-500';
      case 'Accounting': return 'bg-blue-500';
      case 'Finance': return 'bg-purple-500';
      case 'Operations': return 'bg-orange-500';
      case 'HR': return 'bg-teal-500';
      default: return 'bg-gray-500';
    }
  };

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
      case 'hr': return User;
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
      case 'hr': return 'bg-teal-500';
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
        {/* COO Business Overview - Only for CEO/COO */}
        {isCeoCoo && businessStats && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Business Overview</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="pt-6">
                  <div className="flex flex-col">
                    <BarChart3 className="h-8 w-8 text-blue-500 mb-2" />
                    <p className="text-xs text-muted-foreground">Total Sales</p>
                    <p className="text-2xl font-bold">{businessStats.totalSales}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="pt-6">
                  <div className="flex flex-col">
                    <DollarSign className="h-8 w-8 text-green-500 mb-2" />
                    <p className="text-xs text-muted-foreground">Sales Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(businessStats.totalSalesValue)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="pt-6">
                  <div className="flex flex-col">
                    <Users className="h-8 w-8 text-purple-500 mb-2" />
                    <p className="text-xs text-muted-foreground">Total Leads</p>
                    <p className="text-2xl font-bold">{businessStats.totalLeads}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                <CardContent className="pt-6">
                  <div className="flex flex-col">
                    <FileText className="h-8 w-8 text-orange-500 mb-2" />
                    <p className="text-xs text-muted-foreground">Total Tasks</p>
                    <p className="text-2xl font-bold">{businessStats.totalTasks}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                <CardContent className="pt-6">
                  <div className="flex flex-col">
                    <Coins className="h-8 w-8 text-amber-500 mb-2" />
                    <p className="text-xs text-muted-foreground">Commissions</p>
                    <p className="text-2xl font-bold">{formatCurrency(businessStats.totalCommissions)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-teal-500/10 to-teal-600/5 border-teal-500/20">
                <CardContent className="pt-6">
                  <div className="flex flex-col">
                    <Activity className="h-8 w-8 text-teal-500 mb-2" />
                    <p className="text-xs text-muted-foreground">Today Attendance</p>
                    <p className="text-2xl font-bold">{businessStats.todayAttendance}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{isCeoCoo ? 'All Modules' : 'Your Applications'}</h2>
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

        {/* Attendance Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AttendanceStatusCard
            attendanceStatus={attendanceStatus}
            locationStatus={locationStatus}
            isChecking={isCheckingAttendance}
            onManualCheckIn={manualCheckIn}
            onRefreshLocation={refreshLocation}
          />
        </div>

        {/* Fines Alert Section */}
        {fines.filter(f => f.status === 'pending').length > 0 && (
          <Card className="border-orange-500/50 bg-orange-500/10">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-orange-600">Pending Fines</CardTitle>
              <Badge variant="destructive" className="ml-auto">
                Rs {fines.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0)}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {fines.filter(f => f.status === 'pending').slice(0, 3).map(fine => (
                  <div key={fine.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                    <div>
                      <p className="text-sm font-medium">{fine.reason}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(fine.date), 'MMM dd, yyyy')}</p>
                    </div>
                    <span className="font-bold text-orange-600">Rs {fine.amount}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <CardTitle>{isCeoCoo ? "All Tasks Due Today" : "Today's Tasks"}</CardTitle>
            <Badge variant="secondary" className="ml-auto">{todayTasks.length} tasks</Badge>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No tasks due today</p>
            ) : (
              <div className="space-y-3">
                {todayTasks.map(task => {
                  const dueInfo = formatDueTime(task.due_date);
                  return (
                    <div key={task.id} className={`flex items-center justify-between p-4 rounded-lg border bg-card transition-colors ${getDeadlineClass(task.due_date)}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{task.title}</h4>
                          {isCeoCoo && task.assigned_to && (
                            <Badge variant="outline" className="text-xs">{task.assigned_to}</Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                        )}
                        {dueInfo && (
                          <p className={`text-xs mt-1 ${dueInfo.urgent ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                            <Clock className="h-3 w-3 inline mr-1" />
                            {dueInfo.text}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        <Badge className={getStatusColor(task.status)}>{task.status.replace('_', ' ')}</Badge>
                        {task.status !== 'done' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8"
                            onClick={() => markTaskComplete(task.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Done
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks In Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <ArrowRight className="h-5 w-5 text-blue-500" />
            <CardTitle>{isCeoCoo ? "All Tasks In Progress" : "Tasks In Progress"}</CardTitle>
            <Badge variant="secondary" className="ml-auto">{inProgressTasks.length} tasks</Badge>
          </CardHeader>
          <CardContent>
            {inProgressTasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No tasks in progress</p>
            ) : (
              <div className="space-y-3">
                {inProgressTasks.map(task => {
                  const dueInfo = formatDueTime(task.due_date);
                  return (
                    <div key={task.id} className={`flex items-center justify-between p-4 rounded-lg border bg-card transition-colors ${getDeadlineClass(task.due_date)}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{task.title}</h4>
                          {isCeoCoo && task.assigned_to && (
                            <Badge variant="outline" className="text-xs">{task.assigned_to}</Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                        )}
                        {dueInfo && (
                          <p className={`text-xs mt-1 ${dueInfo.urgent ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                            <Clock className="h-3 w-3 inline mr-1" />
                            {dueInfo.text}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-8"
                          onClick={() => markTaskComplete(task.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Done
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Business Tasks - COO Only */}
        {isCeoCoo && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <div>
                <CardTitle>All Business Tasks</CardTitle>
                <CardDescription>Complete task overview across all departments</CardDescription>
              </div>
              <Badge variant="secondary" className="ml-auto">{tasks.filter(t => t.status !== 'done').length} pending</Badge>
            </CardHeader>
            <CardContent>
              {tasks.filter(t => t.status !== 'done').length === 0 ? (
                <p className="text-muted-foreground text-center py-8">All tasks completed!</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {tasks.filter(t => t.status !== 'done').map(task => {
                    const dueInfo = formatDueTime(task.due_date);
                    return (
                      <div key={task.id} className={`flex items-center justify-between p-4 rounded-lg border bg-card transition-colors ${getDeadlineClass(task.due_date)}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium">{task.title}</h4>
                            {task.assigned_to && (
                              <Badge variant="outline" className="text-xs">{task.assigned_to}</Badge>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                          )}
                          {dueInfo && (
                            <p className={`text-xs mt-1 ${dueInfo.urgent ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                              <Clock className="h-3 w-3 inline mr-1" />
                              {dueInfo.text}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          <Badge className={getStatusColor(task.status)}>{task.status.replace('_', ' ')}</Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8"
                            onClick={() => markTaskComplete(task.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Done
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* All Team Members Section for CEO/COO */}
        {isCeoCoo && allUsers.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <div>
                <CardTitle>All Team Members</CardTitle>
                <CardDescription>Complete organization overview</CardDescription>
              </div>
              <Badge variant="secondary" className="ml-auto">{allUsers.length} members</Badge>
            </CardHeader>
            <CardContent>
              {/* Group by department */}
              {Object.entries(
                allUsers.reduce((acc, member) => {
                  const dept = member.department || 'Unassigned';
                  if (!acc[dept]) acc[dept] = [];
                  acc[dept].push(member);
                  return acc;
                }, {} as Record<string, TeamMember[]>)
              ).map(([dept, members]) => (
                <div key={dept} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`h-3 w-3 rounded-full ${getDepartmentColor(dept)}`} />
                    <h3 className="font-semibold text-sm">{dept}</h3>
                    <Badge variant="outline" className="text-xs">{members.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {members.map(member => (
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
                            {member.position}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {member.last_seen ? (
                              <span>{formatDistanceToNow(new Date(member.last_seen), { addSuffix: true })}</span>
                            ) : (
                              <span>Never logged in</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Team Members Section for Managers */}
        {!isCeoCoo && (isManager || profile?.position === 'Manager') && teamMembers.length > 0 && (
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

        {!isCeoCoo && (isManager || profile?.position === 'Manager') && teamMembers.length === 0 && (
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
