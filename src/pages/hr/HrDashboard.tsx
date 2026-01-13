import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, DollarSign, TrendingUp, Clock, AlertCircle, CheckCircle, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaves: number;
  payrollPending: number;
  performanceReviewsDue: number;
  todayAttendance: number;
  lateToday: number;
}

const HrDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    payrollPending: 0,
    performanceReviewsDue: 0,
    todayAttendance: 0,
    lateToday: 0,
  });
  const [recentLeaves, setRecentLeaves] = useState<any[]>([]);
  const [recentEmployees, setRecentEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch employee count
      const { count: employeeCount } = await supabase
        .from("employee_details")
        .select("*", { count: "exact", head: true });

      // Fetch profiles for employee list
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch pending leave applications
      const { count: pendingLeaves } = await supabase
        .from("leave_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Fetch recent leave applications with employee info
      const { data: leaves } = await supabase
        .from("leave_applications")
        .select(`
          *,
          leave_types(name, color)
        `)
        .order("applied_at", { ascending: false })
        .limit(5);

      // Fetch today's attendance
      const today = format(new Date(), "yyyy-MM-dd");
      const { data: todayAttendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", today);

      // Fetch pending payroll
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const { count: payrollPending } = await supabase
        .from("payroll")
        .select("*", { count: "exact", head: true })
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .eq("payment_status", "pending");

      setStats({
        totalEmployees: employeeCount || 0,
        activeEmployees: profiles?.length || 0,
        pendingLeaves: pendingLeaves || 0,
        payrollPending: payrollPending || 0,
        performanceReviewsDue: 0,
        todayAttendance: todayAttendance?.filter(a => a.status === 'present').length || 0,
        lateToday: todayAttendance?.filter(a => a.is_late).length || 0,
      });

      setRecentLeaves(leaves || []);
      setRecentEmployees(profiles || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "Total Employees", value: stats.totalEmployees, icon: Users, color: "text-blue-500" },
    { title: "Present Today", value: stats.todayAttendance, icon: CheckCircle, color: "text-green-500" },
    { title: "Late Today", value: stats.lateToday, icon: Clock, color: "text-orange-500" },
    { title: "Pending Leaves", value: stats.pendingLeaves, icon: Calendar, color: "text-purple-500" },
    { title: "Payroll Pending", value: stats.payrollPending, icon: DollarSign, color: "text-yellow-500" },
    { title: "Reviews Due", value: stats.performanceReviewsDue, icon: TrendingUp, color: "text-red-500" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/hr/employees/new">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/hr/leave">
            <Calendar className="h-4 w-4 mr-2" />
            Manage Leave
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/hr/payroll">
            <DollarSign className="h-4 w-4 mr-2" />
            Process Payroll
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Leave Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Leave Applications</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/hr/leave">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentLeaves.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No leave applications</p>
            ) : (
              <div className="space-y-3">
                {recentLeaves.map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">
                        {format(new Date(leave.start_date), "MMM d")} - {format(new Date(leave.end_date), "MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {leave.leave_types?.name} • {leave.total_days} day(s)
                      </p>
                    </div>
                    <Badge
                      variant={
                        leave.status === "approved" ? "default" :
                        leave.status === "rejected" ? "destructive" : "secondary"
                      }
                    >
                      {leave.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Employees */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Team Members</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/hr/employees">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentEmployees.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No employees found</p>
            ) : (
              <div className="space-y-3">
                {recentEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {employee.full_name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{employee.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {employee.position} • {employee.department}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(stats.pendingLeaves > 0 || stats.payrollPending > 0) && (
        <Card className="border-orange-500/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.pendingLeaves > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg">
                  <span className="text-sm">{stats.pendingLeaves} leave application(s) pending approval</span>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/hr/leave">Review</Link>
                  </Button>
                </div>
              )}
              {stats.payrollPending > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
                  <span className="text-sm">{stats.payrollPending} payroll(s) pending for this month</span>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/hr/payroll">Process</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HrDashboard;
