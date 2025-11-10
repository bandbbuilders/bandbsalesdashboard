import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Analytics() {
  const [analytics, setAnalytics] = useState({
    totalEngagement: 0,
    totalReach: 0,
    totalSaves: 0,
    totalLeads: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('content_analytics')
        .select('*');

      if (error) throw error;

      const totals = (data || []).reduce((acc, item) => ({
        totalEngagement: acc.totalEngagement + (item.engagement || 0),
        totalReach: acc.totalReach + (item.reach || 0),
        totalSaves: acc.totalSaves + (item.saves || 0),
        totalLeads: acc.totalLeads + (item.leads || 0)
      }), {
        totalEngagement: 0,
        totalReach: 0,
        totalSaves: 0,
        totalLeads: 0
      });

      setAnalytics(totals);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Track your content performance across all platforms</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEngagement.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Likes, comments, shares</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalReach.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Unique viewers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saves</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSaves.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Content saved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalLeads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Generated leads</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Detailed analytics charts will be available soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
