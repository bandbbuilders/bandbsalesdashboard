import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Clock, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

interface LeaveApplication {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: string;
  applied_at: string;
  reviewer_remarks: string | null;
  leave_types: {
    name: string;
    color: string;
  };
  employee_details: {
    profile_id: string;
  };
  employee_name?: string;
}

interface LeaveType {
  id: string;
  name: string;
  days_per_year: number;
  is_paid: boolean;
  color: string;
}

const LeaveManagement = () => {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch leave applications with type info
      const { data: apps, error } = await supabase
        .from("leave_applications")
        .select(`
          *,
          leave_types(name, color),
          employee_details(profile_id)
        `)
        .order("applied_at", { ascending: false });

      if (error) throw error;

      // Fetch employee names from profiles
      if (apps && apps.length > 0) {
        const profileIds = apps.map(a => a.employee_details?.profile_id).filter(Boolean);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", profileIds);

        const enrichedApps = apps.map(app => ({
          ...app,
          employee_name: profiles?.find(p => p.id === app.employee_details?.profile_id)?.full_name || "Unknown"
        }));

        setApplications(enrichedApps as LeaveApplication[]);
      } else {
        setApplications([]);
      }

      // Fetch leave types
      const { data: types } = await supabase
        .from("leave_types")
        .select("*")
        .order("name");

      setLeaveTypes(types || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load leave applications");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedApplication || !actionType) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("leave_applications")
        .update({
          status: actionType === "approve" ? "approved" : "rejected",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          reviewer_remarks: reviewRemarks || null,
        })
        .eq("id", selectedApplication.id);

      if (error) throw error;

      // If approved, update leave balance
      if (actionType === "approve") {
        const year = new Date().getFullYear();
        const { data: balance } = await supabase
          .from("leave_balances")
          .select("*")
          .eq("employee_id", selectedApplication.employee_id)
          .eq("leave_type_id", selectedApplication.leave_type_id)
          .eq("year", year)
          .single();

        if (balance) {
          await supabase
            .from("leave_balances")
            .update({
              used_days: (balance.used_days || 0) + selectedApplication.total_days,
              pending_days: Math.max(0, (balance.pending_days || 0) - selectedApplication.total_days),
            })
            .eq("id", balance.id);
        }
      }

      toast.success(`Leave ${actionType === "approve" ? "approved" : "rejected"} successfully`);
      setShowReviewDialog(false);
      setSelectedApplication(null);
      setReviewRemarks("");
      setActionType(null);
      fetchData();
    } catch (error) {
      console.error("Error updating leave:", error);
      toast.error("Failed to update leave application");
    }
  };

  const openReviewDialog = (application: LeaveApplication, action: "approve" | "reject") => {
    setSelectedApplication(application);
    setActionType(action);
    setShowReviewDialog(true);
  };

  const pendingApplications = applications.filter(a => a.status === "pending");
  const processedApplications = applications.filter(a => a.status !== "pending");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Leave Types Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {leaveTypes.map((type) => (
          <Card key={type.id}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
                <span className="text-sm font-medium">{type.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {type.days_per_year > 0 ? `${type.days_per_year} days/year` : "As needed"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingApplications.length})
          </TabsTrigger>
          <TabsTrigger value="processed">
            Processed ({processedApplications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingApplications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending leave applications
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Applied On</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">{app.employee_name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              style={{ borderColor: app.leave_types?.color, color: app.leave_types?.color }}
                            >
                              {app.leave_types?.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(app.start_date), "MMM d")} - {format(new Date(app.end_date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>{app.total_days}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{app.reason || "—"}</TableCell>
                          <TableCell>{format(new Date(app.applied_at), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => openReviewDialog(app, "approve")}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openReviewDialog(app, "reject")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave History</CardTitle>
            </CardHeader>
            <CardContent>
              {processedApplications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No processed leave applications
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">{app.employee_name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              style={{ borderColor: app.leave_types?.color, color: app.leave_types?.color }}
                            >
                              {app.leave_types?.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(app.start_date), "MMM d")} - {format(new Date(app.end_date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>{app.total_days}</TableCell>
                          <TableCell>{getStatusBadge(app.status)}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{app.reviewer_remarks || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Leave Application
            </DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p><strong>Employee:</strong> {selectedApplication.employee_name}</p>
                <p><strong>Leave Type:</strong> {selectedApplication.leave_types?.name}</p>
                <p>
                  <strong>Duration:</strong> {format(new Date(selectedApplication.start_date), "MMM d")} - {format(new Date(selectedApplication.end_date), "MMM d, yyyy")} ({selectedApplication.total_days} days)
                </p>
                {selectedApplication.reason && (
                  <p><strong>Reason:</strong> {selectedApplication.reason}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Remarks (optional)</label>
                <Textarea
                  placeholder="Add any remarks..."
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                  Cancel
                </Button>
                <Button
                  variant={actionType === "approve" ? "default" : "destructive"}
                  onClick={handleReview}
                >
                  {actionType === "approve" ? "Approve" : "Reject"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveManagement;
