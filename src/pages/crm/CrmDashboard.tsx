import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Lead {
  id: string;
  name: string;
  stage: string;
  budget: number;
  created_at: string;
}

interface Reminder {
  id: string;
  title: string;
  due_date: string;
  completed: boolean;
}

const CrmDashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch recent leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, name, stage, budget, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch upcoming reminders
      const { data: remindersData } = await supabase
        .from('reminders')
        .select('id, title, due_date, completed')
        .eq('completed', false)
        .order('due_date', { ascending: true })
        .limit(5);

      setLeads(leadsData || []);
      setReminders(remindersData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-yellow-100 text-yellow-800',
      'qualified': 'bg-orange-100 text-orange-800',
      'proposal': 'bg-purple-100 text-purple-800',
      'negotiation': 'bg-indigo-100 text-indigo-800',
      'closed_won': 'bg-green-100 text-green-800',
      'closed_lost': 'bg-red-100 text-red-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const stageCounts = leads.reduce((acc, lead) => {
    acc[lead.stage] = (acc[lead.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalBudget = leads.reduce((sum, lead) => sum + (lead.budget || 0), 0);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CRM Dashboard</h1>
        <p className="text-muted-foreground">Overview of your leads and activities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalBudget.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reminders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reminders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Won</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stageCounts['closed_won'] || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads and Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
            <CardDescription>Latest leads added to your pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {lead.budget ? `₹${lead.budget.toLocaleString()}` : 'No budget set'}
                    </p>
                  </div>
                  <Badge className={getStageColor(lead.stage)}>
                    {lead.stage.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Reminders</CardTitle>
            <CardDescription>Tasks and follow-ups due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{reminder.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {new Date(reminder.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CrmDashboard;