import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format, formatDistanceToNow } from "date-fns";
import { Clock, Download, User, AlertTriangle, Lock, Pencil, CheckCircle } from "lucide-react";
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

interface ProfileWithLastSeen {
  full_name: string;
  last_seen: string | null;
  position: string | null;
}

interface Fine {
  id: string;
  user_name: string;
  amount: number;
  reason: string;
  date: string;
  status: string;
}

// Users who can edit attendance: Sara Memon and COO (Zain Sarwar)
const ALLOWED_EDITORS = [
  "msara8032@gmail.com",           // Sara Memon
  "2bdf88c3-56d0-4eff-8fb1-243fa17cc0f0", // Sara Memon user_id
  "mzainsarwar55@gmail.com",       // COO actual email
  "fab190bd-3c71-43e8-9381-3ec66044e501", // COO user_id
];

const TEAM_MEMBERS = ["Huraira", "Muzamil", "Hamna", "Zia", "Sara"];
const STANDARD_IN_TIME = "10:00";
const GRACE_PERIOD = 20; // minutes - grace until 10:20 AM
const STANDARD_OUT_TIME = "18:00";
const LATE_FINE_AMOUNT = 500;

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [checkInTime, setCheckInTime] = useState<string>(STANDARD_IN_TIME);
  const [checkOutTime, setCheckOutTime] = useState<string>(STANDARD_OUT_TIME);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [profiles, setProfiles] = useState<ProfileWithLastSeen[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [editReason, setEditReason] = useState("");
  const { toast } = useToast();

  // Check if current user can edit attendance
  useEffect(() => {
    const checkEditPermission = async () => {
      try {
        // First check Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const userEmail = session.user.email?.toLowerCase();
          const userId = session.user.id;
          
          console.log('Checking edit permission for:', userEmail, userId);
          
          // Check if user is Sara Memon
          const isSara = userEmail === "msara8032@gmail.com" || 
                         userId === "2bdf88c3-56d0-4eff-8fb1-243fa17cc0f0";
          
          // Check if user has ceo_coo role
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .maybeSingle();
          
          console.log('User role:', roleData?.role, 'Is Sara:', isSara);
          
          if (roleData?.role === 'ceo_coo' || isSara) {
            console.log('Edit permission granted');
            setCanEdit(true);
            return;
          }
          
          setCanEdit(isSara);
        } else {
          // Fallback to localStorage for demo mode
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            const userEmail = user.email?.toLowerCase();
            const userId = user.id || user.user_id;
            
            const isSara = userEmail === "msara8032@gmail.com" || 
                           userId === "2bdf88c3-56d0-4eff-8fb1-243fa17cc0f0";
            
            if (userId) {
              const { data: roleData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', userId)
                .maybeSingle();
              
              if (roleData?.role === 'ceo_coo' || isSara) {
                setCanEdit(true);
                return;
              }
            }
            
            setCanEdit(isSara);
          }
        }
      } catch (error) {
        console.error('Error checking edit permission:', error);
        setCanEdit(false);
      }
    };
    
    checkEditPermission();
  }, []);

  useEffect(() => {
    fetchAttendance();
    fetchProfiles();
    fetchFines();
  }, [selectedDate]);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, last_seen, position');

    if (error) {
      console.error('Error fetching profiles:', error);
    } else {
      setProfiles((data || []) as ProfileWithLastSeen[]);
    }
  };

  const fetchFines = async () => {
    const { data, error } = await supabase
      .from('fines')
      .select('*')
      .order('date', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching fines:', error);
    } else {
      setFines((data || []) as Fine[]);
    }
  };

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

  const calculateStatus = (checkIn: string): { status: "present" | "late"; isLate: boolean; shouldFine: boolean } => {
    const [hours, minutes] = checkIn.split(':').map(Number);
    const [stdHours, stdMinutes] = STANDARD_IN_TIME.split(':').map(Number);
    
    const checkInMinutes = hours * 60 + minutes;
    const standardTime = stdHours * 60 + stdMinutes;
    const graceTime = standardTime + GRACE_PERIOD;

    if (checkInMinutes <= graceTime) {
      return { status: "present", isLate: checkInMinutes > standardTime, shouldFine: false };
    } else {
      return { status: "late", isLate: true, shouldFine: true };
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
    const { status, isLate, shouldFine } = calculateStatus(checkInTime);

    const attendanceData = {
      user_name: selectedMember,
      date: dateStr,
      check_in: checkInTime,
      check_out: checkOutTime || null,
      status,
      is_late: isLate,
    };

    const { data: insertedAttendance, error } = await supabase
      .from('attendance')
      .upsert(attendanceData, {
        onConflict: 'user_name,date'
      })
      .select()
      .single();

    if (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      });
    } else {
      // Create fine if late after grace period (unless member is COO)
      let fineApplied = false;
      if (shouldFine && insertedAttendance) {
        // Check if member is COO (exempt from fines)
        const { data: memberProfile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('full_name', selectedMember)
          .maybeSingle();
        
        let isCoo = false;
        if (memberProfile?.user_id) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', memberProfile.user_id)
            .maybeSingle();
          isCoo = roleData?.role === 'ceo_coo';
        }

        // Only create fine if not COO
        if (!isCoo) {
          // Check if fine already exists for this attendance
          const { data: existingFine } = await supabase
            .from('fines')
            .select('id')
            .eq('attendance_id', insertedAttendance.id)
            .maybeSingle();

          if (!existingFine) {
              await supabase.from('fines').insert({
              user_name: selectedMember,
              amount: LATE_FINE_AMOUNT,
              reason: `Late arrival - Check-in at ${checkInTime} (after 10:20 AM grace period)`,
              date: dateStr,
              attendance_id: insertedAttendance.id,
              status: 'pending',
            });
            fineApplied = true;
          }
        }
      }

      toast({
        title: "Success",
        description: fineApplied 
          ? `Attendance marked. Late fine of Rs ${LATE_FINE_AMOUNT} applied.`
          : "Attendance marked successfully",
      });
      fetchAttendance();
      fetchFines();
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
  const todayFines = fines.filter(f => f.date === format(selectedDate, "yyyy-MM-dd"));

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

      {/* Login Status Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Team Login Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile) => (
              <div
                key={profile.full_name}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition"
              >
                <div className="relative">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10">
                      {profile.full_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {profile.last_seen && new Date(profile.last_seen) > new Date(Date.now() - 5 * 60 * 1000) && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile.position || 'Team Member'}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="h-3 w-3" />
                    {profile.last_seen ? (
                      <span>Last seen: {formatDistanceToNow(new Date(profile.last_seen), { addSuffix: true })}</span>
                    ) : (
                      <span className="text-orange-500">Never logged in</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
            
            {canEdit ? (
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
                    Standard: {STANDARD_IN_TIME} (Grace until 10:20 AM)
                  </p>
                  <p className="text-xs text-orange-500 mt-1">
                    Late after 10:20 AM = Rs {LATE_FINE_AMOUNT} fine
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
            ) : (
              <div className="mt-6 p-4 border rounded-lg bg-muted/50 text-center">
                <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Only Sara Memon and COO can edit attendance records.
                </p>
              </div>
            )}
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
                    {canEdit && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenEditDialog(record)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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

        {/* Fines Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Late Fines - {format(selectedDate, "MMMM dd, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayFines.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No fines for this date
              </div>
            ) : (
              <div className="space-y-3">
                {todayFines.map((fine) => (
                  <div key={fine.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-500/10">
                    <div>
                      <p className="font-semibold">{fine.user_name}</p>
                      <p className="text-xs text-muted-foreground">{fine.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">Rs {fine.amount}</p>
                      <Badge variant={fine.status === 'paid' ? 'default' : 'destructive'} className="text-xs">
                        {fine.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Attendance Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance - {editingRecord?.user_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Check In Time</Label>
              <Input
                type="time"
                value={editCheckIn}
                onChange={(e) => setEditCheckIn(e.target.value)}
              />
            </div>
            <div>
              <Label>Check Out Time</Label>
              <Input
                type="time"
                value={editCheckOut}
                onChange={(e) => setEditCheckOut(e.target.value)}
              />
            </div>
            <div>
              <Label>Reason for Change *</Label>
              <Textarea
                placeholder="Enter reason for modifying attendance..."
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                This reason will be saved in the attendance notes.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editReason.trim()}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function handleOpenEditDialog(record: AttendanceRecord) {
    setEditingRecord(record);
    setEditCheckIn(record.check_in || STANDARD_IN_TIME);
    setEditCheckOut(record.check_out || STANDARD_OUT_TIME);
    setEditReason("");
    setEditDialogOpen(true);
  }

  async function handleSaveEdit() {
    if (!editingRecord || !editReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the change",
        variant: "destructive",
      });
      return;
    }

    const { status, isLate } = calculateStatus(editCheckIn);
    const updatedNotes = `${editingRecord.notes || ''}\n[${format(new Date(), "yyyy-MM-dd HH:mm")}] Edit: ${editReason}`.trim();

    const { error } = await supabase
      .from('attendance')
      .update({
        check_in: editCheckIn,
        check_out: editCheckOut || null,
        status,
        is_late: isLate,
        notes: updatedNotes,
      })
      .eq('id', editingRecord.id);

    if (error) {
      console.error('Error updating attendance:', error);
      toast({
        title: "Error",
        description: "Failed to update attendance",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Attendance updated successfully",
      });
      setEditDialogOpen(false);
      fetchAttendance();
    }
  }
}