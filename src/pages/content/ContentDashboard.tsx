import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Upload, CheckCircle, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function ContentDashboard() {
  const [stats, setStats] = useState({
    postsThisWeek: 0,
    pendingApprovals: 0,
    scheduledPosts: 0,
    totalEngagement: 0
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Posts this week
      const { count: postsCount } = await supabase
        .from('content_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('created_at', oneWeekAgo.toISOString());

      // Pending approvals
      const { count: approvalsCount } = await supabase
        .from('content_approvals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Scheduled posts
      const { count: scheduledCount } = await supabase
        .from('content_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled');

      // Total engagement
      const { data: analytics } = await supabase
        .from('content_analytics')
        .select('engagement')
        .gte('recorded_at', oneWeekAgo.toISOString());

      const totalEngagement = analytics?.reduce((sum, item) => sum + (item.engagement || 0), 0) || 0;

      setStats({
        postsThisWeek: postsCount || 0,
        pendingApprovals: approvalsCount || 0,
        scheduledPosts: scheduledCount || 0,
        totalEngagement
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    }
  };

  const quickActions = [
    {
      title: "Create New Task",
      description: "Start a new content production task",
      icon: Plus,
      action: () => navigate("/content/board")
    },
    {
      title: "Upload Post",
      description: "Upload content ready for approval",
      icon: Upload,
      action: () => navigate("/content/board")
    },
    {
      title: "Schedule Post",
      description: "Schedule approved content",
      icon: Calendar,
      action: () => navigate("/content/scheduler")
    },
    {
      title: "View Analytics",
      description: "Check performance metrics",
      icon: BarChart3,
      action: () => navigate("/content/analytics")
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Production Dashboard</h1>
        <p className="text-muted-foreground">Manage all your social media content in one place</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts This Week</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.postsThisWeek}</div>
            <p className="text-xs text-muted-foreground">Published content</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <CheckCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduledPosts}</div>
            <p className="text-xs text-muted-foreground">Ready to publish</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEngagement.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant="outline"
                className="h-auto flex-col items-start p-4 space-y-2"
                onClick={action.action}
              >
                <action.icon className="h-6 w-6 text-primary" />
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
