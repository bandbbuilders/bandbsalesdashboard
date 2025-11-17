import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

interface AttendanceRecord {
  id: string;
  name: string;
  status: "present" | "absent" | "late";
  checkIn?: string;
  checkOut?: string;
}

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([
    { id: "1", name: "Huraira", status: "present", checkIn: "09:00 AM", checkOut: "05:00 PM" },
    { id: "2", name: "Muzamil", status: "present", checkIn: "09:15 AM" },
    { id: "3", name: "Hamna", status: "absent" },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-500";
      case "absent":
        return "bg-red-500";
      case "late":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const toggleStatus = (id: string) => {
    setAttendance(prev =>
      prev.map(record =>
        record.id === id
          ? {
              ...record,
              status: record.status === "present" ? "absent" : "present",
              checkIn: record.status === "absent" ? format(new Date(), "hh:mm a") : record.checkIn,
            }
          : record
      )
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <p className="text-muted-foreground">Track team attendance and working hours</p>
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
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Attendance - {format(selectedDate, "MMMM dd, yyyy")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {attendance.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className={getStatusColor(record.status)}>
                      {record.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{record.name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {record.checkIn && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          In: {record.checkIn}
                        </span>
                      )}
                      {record.checkOut && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Out: {record.checkOut}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={record.status === "present" ? "default" : "destructive"}>
                    {record.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleStatus(record.id)}
                  >
                    {record.status === "present" ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {attendance.filter((r) => r.status === "present").length}
              </div>
              <div className="text-sm text-muted-foreground">Present Today</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {attendance.filter((r) => r.status === "absent").length}
              </div>
              <div className="text-sm text-muted-foreground">Absent Today</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {attendance.filter((r) => r.status === "late").length}
              </div>
              <div className="text-sm text-muted-foreground">Late Today</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
