import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from "date-fns";
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface UserPerformance {
  userName: string;
  totalWorkingDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  attendanceRate: number;
  punctualityRate: number;
  totalFines: number;
}

export const UserAttendancePerformance = () => {
  const [performances, setPerformances] = useState<UserPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedMonth]);

  const getWorkingDays = (year: number, month: number): number => {
    const start = startOfMonth(new Date(year, month));
    const end = endOfMonth(new Date(year, month));
    const days = eachDayOfInterval({ start, end });
    return days.filter(day => !isWeekend(day)).length;
  };

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split("-").map(Number);
      const startDate = format(startOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");
      const endDate = format(endOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");
      const workingDays = getWorkingDays(year, month - 1);

      // Fetch all attendance records for the month
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate);

      if (attendanceError) throw attendanceError;

      // Fetch all fines for the month
      const { data: finesData, error: finesError } = await supabase
        .from("fines")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .in("status", ["approved", "pending"]);

      if (finesError) throw finesError;

      // Fetch all profiles to get user list
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("full_name");

      if (profilesError) throw profilesError;

      // Calculate performance for each user
      const userPerformances: UserPerformance[] = (profiles || []).map((profile) => {
        const userName = profile.full_name;
        const userAttendance = (attendanceData || []).filter((a) => a.user_name === userName);
        const userFines = (finesData || []).filter((f) => f.user_name === userName);

        const presentDays = userAttendance.filter((a) => a.status === "present" || a.status === "late").length;
        const lateDays = userAttendance.filter((a) => a.status === "late" || a.is_late).length;
        const absentDays = workingDays - presentDays;
        const attendanceRate = workingDays > 0 ? (presentDays / workingDays) * 100 : 0;
        const punctualityRate = presentDays > 0 ? ((presentDays - lateDays) / presentDays) * 100 : 0;
        const totalFines = userFines.reduce((sum, f) => sum + (f.amount || 0), 0);

        return {
          userName,
          totalWorkingDays: workingDays,
          presentDays,
          lateDays,
          absentDays: Math.max(0, absentDays),
          attendanceRate: Math.round(attendanceRate),
          punctualityRate: Math.round(punctualityRate),
          totalFines,
        };
      });

      // Sort by attendance rate (descending)
      userPerformances.sort((a, b) => b.attendanceRate - a.attendanceRate);
      setPerformances(userPerformances);
    } catch (error) {
      console.error("Error fetching performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 90) return { label: "Excellent", variant: "default" as const, className: "bg-green-500" };
    if (rate >= 80) return { label: "Good", variant: "secondary" as const, className: "bg-blue-500 text-white" };
    if (rate >= 70) return { label: "Average", variant: "outline" as const, className: "border-yellow-500 text-yellow-600" };
    return { label: "Needs Improvement", variant: "destructive" as const, className: "" };
  };

  // Generate month options for the last 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy"),
    };
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Attendance Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          User Attendance Performance
        </CardTitle>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {performances.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No attendance data for this month</p>
          ) : (
            performances.map((perf, index) => {
              const badge = getPerformanceBadge(perf.attendanceRate);
              return (
                <div
                  key={perf.userName}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition"
                >
                  {/* Rank & Avatar */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <span className="text-lg font-bold text-muted-foreground w-6">#{index + 1}</span>
                    <Avatar>
                      <AvatarFallback className="bg-primary/10">
                        {perf.userName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{perf.userName}</p>
                      <Badge className={badge.className} variant={badge.variant}>
                        {badge.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Present</p>
                        <p className="font-medium">{perf.presentDays}/{perf.totalWorkingDays}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Late</p>
                        <p className="font-medium">{perf.lateDays} days</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Absent</p>
                        <p className="font-medium">{perf.absentDays} days</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Fines</p>
                        <p className="font-medium">Rs {perf.totalFines.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="w-full md:w-48 space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Attendance</span>
                        <span className={getPerformanceColor(perf.attendanceRate)}>{perf.attendanceRate}%</span>
                      </div>
                      <Progress value={perf.attendanceRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Punctuality</span>
                        <span className={getPerformanceColor(perf.punctualityRate)}>{perf.punctualityRate}%</span>
                      </div>
                      <Progress value={perf.punctualityRate} className="h-2" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
