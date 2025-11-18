import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Clock, CheckCircle2, XCircle, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AttendanceRecord {
  id?: string;
  user_name: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: "present" | "absent" | "late";
  is_late: boolean;
  notes?: string;
}

const TEAM_MEMBERS = ["Huraira", "Muzamil", "Hamna", "Zia", "Sara"];
const STANDARD_IN_TIME = "10:00";
const GRACE_PERIOD = 15; // minutes
const STANDARD_OUT_TIME = "18:00";

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [checkInTime, setCheckInTime] = useState<string>(STANDARD_IN_TIME);
  const [checkOutTime, setCheckOutTime] = useState<string>(STANDARD_OUT_TIME);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const fetchAttendance = async () => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', dateStr);

    if (error) {
      console.error('Error fetching attendance:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance records",
        variant: "destructive",
      });
    } else {
      setAttendance((data || []) as AttendanceRecord[]);
    }
  };

  const calculateStatus = (checkIn: string): { status: "present" | "late"; isLate: boolean } => {
    const [hours, minutes] = checkIn.split(':').map(Number);
    const [stdHours, stdMinutes] = STANDARD_IN_TIME.split(':').map(Number);
    
    const checkInMinutes = hours * 60 + minutes;
    const standardTime = stdHours * 60 + stdMinutes;
    const graceTime = standardTime + GRACE_PERIOD;

    if (checkInMinutes <= graceTime) {
      return { status: "present", isLate: checkInMinutes > standardTime };
    } else {
      return { status: "late", isLate: true };
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedMember) {
      toast({
        title: "Error",
        description: "Please select a team member",
        variant: "destructive",
      });
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const { status, isLate } = calculateStatus(checkInTime);

    const attendanceData = {
      user_name: selectedMember,
      date: dateStr,
      check_in: checkInTime,
      check_out: checkOutTime || null,
      status,
      is_late: isLate,
    };

    const { error } = await supabase
      .from('attendance')
      .upsert(attendanceData, {
        onConflict: 'user_name,date'
      });

    if (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Attendance marked successfully",
      });
      fetchAttendance();
      setSelectedMember("");
      setCheckInTime(STANDARD_IN_TIME);
      setCheckOutTime(STANDARD_OUT_TIME);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-success";
      case "absent":
        return "bg-destructive";
      case "late":
        return "bg-warning";
      default:
        return "bg-muted";
    }
  };

  const generateReport = () => {
    const monthlyData = attendance.reduce((acc, record) => {
      const existing = acc.find(r => r.user_name === record.user_name);
      if (existing) {
        existing.total++;
        if (record.status === 'present' || record.status === 'late') existing.present++;
        if (record.status === 'late') existing.late++;
        if (record.status === 'absent') existing.absent++;
      } else {
        acc.push({
          user_name: record.user_name,
          total: 1,
          present: record.status === 'present' || record.status === 'late' ? 1 : 0,
          late: record.status === 'late' ? 1 : 0,
          absent: record.status === 'absent' ? 1 : 0
        });
      }
      return acc;
    }, [] as any[]);

    console.log('Monthly Report:', monthlyData);
    toast({
      title: "Report Generated",
      description: "Check console for monthly attendance report",
    });
  };

  const todayAttendance = attendance.filter(r => r.date === format(selectedDate, "yyyy-MM-dd"));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">Track team attendance and working hours</p>
        </div>
        <Button onClick={generateReport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
            
            <div className="mt-6 space-y-4">
              <div>
                <Label>Team Member</Label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_MEMBERS.map(member => (
                      <SelectItem key={member} value={member}>{member}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Check In Time</Label>
                <Input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Standard: {STANDARD_IN_TIME} (Grace: {GRACE_PERIOD} min)
                </p>
              </div>

              <div>
                <Label>Check Out Time</Label>
                <Input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Standard: {STANDARD_OUT_TIME}
                </p>
              </div>

              <Button onClick={handleMarkAttendance} className="w-full">
                Mark Attendance
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Attendance - {format(selectedDate, "MMMM dd, yyyy")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayAttendance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records for this date
              </div>
            ) : (
              todayAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className={getStatusColor(record.status)}>
                        {record.user_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{record.user_name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {record.check_in && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            In: {record.check_in}
                          </span>
                        )}
                        {record.check_out && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Out: {record.check_out}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={record.status === "present" ? "default" : "destructive"}>
                      {record.status}
                      {record.is_late && " (Late)"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-success">
                {todayAttendance.filter((r) => r.status === "present").length}
              </div>
              <div className="text-sm text-muted-foreground">Present</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-warning">
                {todayAttendance.filter((r) => r.status === "late").length}
              </div>
              <div className="text-sm text-muted-foreground">Late</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-muted-foreground">
                {TEAM_MEMBERS.length - todayAttendance.length}
              </div>
              <div className="text-sm text-muted-foreground">Not Marked</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
