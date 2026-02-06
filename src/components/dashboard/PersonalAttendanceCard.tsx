import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Target, Clock, AlertCircle, TrendingUp } from "lucide-react";

interface PersonalAttendanceCardProps {
  userName: string | null;
}

const WORKING_DAYS_PER_MONTH = 26;

export const PersonalAttendanceCard = ({ userName }: PersonalAttendanceCardProps) => {
  const [stats, setStats] = useState({
    presentDays: 0,
    lateDays: 0,
    absentDays: 0,
    attendanceRate: 0,
    punctualityRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userName) return;

    const fetchAttendance = async () => {
      setIsLoading(true);
      const now = new Date();
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_name', userName)
        .gte('date', monthStart)
        .lte('date', monthEnd);

      const records = attendanceData || [];
      const presentDays = records.filter(r => r.status === 'present').length;
      const lateDays = records.filter(r => r.status === 'late').length;
      const totalMarked = records.length;
      
      // Calculate days passed in current month (max 26 working days)
      const dayOfMonth = now.getDate();
      const effectiveWorkingDays = Math.min(dayOfMonth, WORKING_DAYS_PER_MONTH);
      const absentDays = Math.max(0, effectiveWorkingDays - totalMarked);
      
      const attendanceRate = effectiveWorkingDays > 0 
        ? Math.round((totalMarked / effectiveWorkingDays) * 100) 
        : 0;
      
      const punctualityRate = totalMarked > 0 
        ? Math.round((presentDays / totalMarked) * 100) 
        : 100;

      setStats({
        presentDays,
        lateDays,
        absentDays,
        attendanceRate,
        punctualityRate,
      });
      setIsLoading(false);
    };

    fetchAttendance();
  }, [userName]);

  const getPerformanceBadge = () => {
    if (stats.attendanceRate >= 95 && stats.punctualityRate >= 90) {
      return { label: "Excellent", className: "bg-green-500 text-white" };
    } else if (stats.attendanceRate >= 85) {
      return { label: "Good", className: "bg-blue-500 text-white" };
    } else if (stats.attendanceRate >= 70) {
      return { label: "Needs Improvement", className: "bg-orange-500 text-white" };
    }
    return { label: "Critical", className: "bg-red-500 text-white" };
  };

  const badge = getPerformanceBadge();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-primary" />
            Attendance Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-primary" />
            Attendance Performance
          </CardTitle>
          <Badge className={badge.className}>{badge.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {format(new Date(), 'MMMM yyyy')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Attendance Rate */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Attendance Rate
            </span>
            <span className="text-sm font-medium">{stats.attendanceRate}%</span>
          </div>
          <Progress value={stats.attendanceRate} className="h-2" />
        </div>

        {/* Punctuality Rate */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Punctuality Rate
            </span>
            <span className="text-sm font-medium">{stats.punctualityRate}%</span>
          </div>
          <Progress value={stats.punctualityRate} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center p-2 rounded-lg bg-green-500/10">
            <p className="text-lg font-bold text-green-600">{stats.presentDays}</p>
            <p className="text-xs text-muted-foreground">Present</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-orange-500/10">
            <p className="text-lg font-bold text-orange-600">{stats.lateDays}</p>
            <p className="text-xs text-muted-foreground">Late</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-500/10">
            <p className="text-lg font-bold text-red-600">{stats.absentDays}</p>
            <p className="text-xs text-muted-foreground">Absent</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
