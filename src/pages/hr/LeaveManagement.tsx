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
import { format, differenceInDays, parseISO } from "date-fns";
import { Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUserRole } from "@/hooks/useUserRole";

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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [editData, setEditData] = useState({
    startDate: "",
    endDate: "",
    remarks: "",
    status: "",
  });

  const { isCeoCoo, isHR } = useUserRole();

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

  const openEditDialog = (application: LeaveApplication) => {
    setSelectedApplication(application);
    setEditData({
      startDate: application.start_date,
      endDate: application.end_date,
      remarks: application.reviewer_remarks || "",
      status: application.status,
    });
    setShowEditDialog(true);
  };

  const handleEditLeave = async () => {
    if (!selectedApplication) return;

    try {
      const start = parseISO(editData.startDate);
      const end = parseISO(editData.endDate);
      const newTotalDays = differenceInDays(end, start) + 1;

      if (newTotalDays <= 0) {
        toast.error("End date must be after start date");
        return;
      }

      // Update leave application
      const { error: updateError } = await supabase
        .from("leave_applications")
        .update({
          start_date: editData.startDate,
          end_date: editData.endDate,
          total_days: newTotalDays,
          status: editData.status,
          reviewer_remarks: editData.remarks || null,
        })
        .eq("id", selectedApplication.id);

      if (updateError) throw updateError;

      // Handle balance adjustment
      const year = new Date(editData.startDate).getFullYear();
      const { data: balance } = await supabase
        .from("leave_balances")
        .select("*")
        .eq("employee_id", selectedApplication.employee_id)
        .eq("leave_type_id", selectedApplication.leave_type_id)
        .eq("year", year)
        .single();

      if (balance) {
        let newUsed = balance.used_days || 0;

        // If it was approved and remains approved, adjust for delta
        if (selectedApplication.status === "approved" && editData.status === "approved") {
          newUsed = (balance.used_days || 0) - selectedApplication.total_days + newTotalDays;
        }
        // If it was approved and now rejected/cancelled, remove from used
        else if (selectedApplication.status === "approved" && editData.status !== "approved") {
          newUsed = Math.max(0, (balance.used_days || 0) - selectedApplication.total_days);
        }
        // If it was NOT approved and now IS approved, add to used
        else if (selectedApplication.status !== "approved" && editData.status === "approved") {
          newUsed = (balance.used_days || 0) + newTotalDays;
        }

        await supabase
          .from("leave_balances")
          .update({ used_days: newUsed })
          .eq("id", balance.id);
      }

      toast.success("Leave application updated successfully");
      setShowEditDialog(false);
      fetchData();
    } catch (error: any) {
      console.error("Error editing leave:", error);
      toast.error("Failed to update leave application");
    }
  };

  const handleDeleteLeave = async (application: LeaveApplication) => {
    if (!confirm(`Are you sure you want to delete this leave history for ${application.employee_name}?`)) return;

    try {
      // Revert balance if it was approved
      if (application.status === "approved") {
        const year = new Date(application.start_date).getFullYear();
        const { data: balance } = await supabase
          .from("leave_balances")
          .select("*")
          .eq("employee_id", application.employee_id)
          .eq("leave_type_id", application.leave_type_id)
          .eq("year", year)
          .single();

        if (balance) {
          await supabase
            .from("leave_balances")
            .update({
              used_days: Math.max(0, (balance.used_days || 0) - application.total_days)
            })
            .eq("id", balance.id);
        }
      }

      const { error } = await supabase
        .from("leave_applications")
        .delete()
        .eq("id", application.id);

      if (error) throw error;

      toast.success("Leave entry deleted successfully");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting leave:", error);
      toast.error("Failed to delete leave entry");
    }
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
                            {(isCeoCoo || isHR) && (
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
                            )}
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
                        <TableHead className="text-right">Actions</TableHead>
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
                          <TableCell className="text-right">
                            {(isCeoCoo || isHR) && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  onClick={() => openEditDialog(app)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteLeave(app)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Leave Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={editData.startDate}
                  onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={editData.endDate}
                  onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
              >
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reviewer Remarks</label>
              <Textarea
                placeholder="Add any remarks..."
                value={editData.remarks}
                onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditLeave}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveManagement;
