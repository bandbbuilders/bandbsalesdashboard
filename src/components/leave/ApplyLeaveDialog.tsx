import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, AlertTriangle, DollarSign, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LeaveType {
  id: string;
  name: string;
  days_per_year: number | null;
  is_paid: boolean | null;
  color: string | null;
}

interface EmployeeDetails {
  id: string;
  profile_id: string;
  basic_salary: number | null;
}

interface LeaveBalance {
  id: string;
  leave_type_id: string;
  total_days: number | null;
  used_days: number | null;
  pending_days: number | null;
}

interface ApplyLeaveDialogProps {
  trigger?: React.ReactNode;
  userName?: string | null;
  userId?: string | null;
}

const WORKING_DAYS_PER_MONTH = 26;

export const ApplyLeaveDialog = ({ trigger, userName, userId }: ApplyLeaveDialogProps) => {
  const [open, setOpen] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetails | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDeductionWarning, setShowDeductionWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLeaveTypes();
      if (userId) {
        fetchEmployeeDetails();
        fetchLeaveBalances();
      }
    }
  }, [open, userId]);

  const fetchLeaveTypes = async () => {
    const { data } = await supabase
      .from("leave_types")
      .select("*")
      .order("name");
    
    // Filter to show only relevant leave types
    const filteredTypes = (data || []).filter(lt => 
      ["Annual Leave", "Casual Leave", "Sick Leave", "Unpaid Leave", "Half Day", "Early Leave"].includes(lt.name)
    );
    setLeaveTypes(filteredTypes);
  };

  const fetchEmployeeDetails = async () => {
    if (!userId) return;

    // First get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!profile) return;

    // Then get employee details
    const { data: employee } = await supabase
      .from("employee_details")
      .select("*")
      .eq("profile_id", profile.id)
      .single();

    if (employee) {
      setEmployeeDetails(employee);
    }
  };

  const fetchLeaveBalances = async () => {
    if (!userId) return;

    // First get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!profile) return;

    // Get employee id
    const { data: employee } = await supabase
      .from("employee_details")
      .select("id")
      .eq("profile_id", profile.id)
      .single();

    if (!employee) return;

    const currentYear = new Date().getFullYear();
    const { data: balances } = await supabase
      .from("leave_balances")
      .select("*")
      .eq("employee_id", employee.id)
      .eq("year", currentYear);

    setLeaveBalances(balances || []);
  };

  const selectedLeaveTypeData = leaveTypes.find(lt => lt.id === selectedLeaveType);
  const isUnpaidLeave = selectedLeaveTypeData?.name === "Unpaid Leave";
  const isHalfDay = selectedLeaveTypeData?.name === "Half Day";

  // Calculate total days
  const calculateTotalDays = () => {
    if (isHalfDay) return 0.5;
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.max(1, differenceInDays(end, start) + 1);
  };

  const totalDays = calculateTotalDays();

  // Calculate salary deduction for unpaid leave
  const calculateDeduction = () => {
    const basicSalary = employeeDetails?.basic_salary || 0;
    const perDaySalary = basicSalary / WORKING_DAYS_PER_MONTH;
    return {
      basicSalary,
      perDaySalary,
      totalDeduction: perDaySalary * totalDays,
    };
  };

  const deductionInfo = calculateDeduction();

  // Get balance for selected leave type
  const getBalanceForType = (typeId: string) => {
    const balance = leaveBalances.find(b => b.leave_type_id === typeId);
    if (!balance) return { available: 0, used: 0, pending: 0 };
    return {
      available: (balance.total_days || 0) - (balance.used_days || 0) - (balance.pending_days || 0),
      used: balance.used_days || 0,
      pending: balance.pending_days || 0,
    };
  };

  const handleLeaveTypeChange = (value: string) => {
    setSelectedLeaveType(value);
    const leaveType = leaveTypes.find(lt => lt.id === value);
    
    // Reset dates when changing leave type
    if (leaveType?.name === "Half Day") {
      setEndDate(startDate);
    }
    
    // Show deduction warning for unpaid leave
    if (leaveType?.name === "Unpaid Leave") {
      setShowDeductionWarning(true);
    } else {
      setShowDeductionWarning(false);
    }
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (isHalfDay) {
      setEndDate(value);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedLeaveType) {
      toast.error("Please select leave type");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for leave");
      return;
    }
    if (!startDate) {
      toast.error("Please select start date");
      return;
    }
    if (!isHalfDay && !endDate) {
      toast.error("Please select end date");
      return;
    }

    // Check balance for paid leaves (not unpaid)
    if (!isUnpaidLeave && selectedLeaveTypeData) {
      const balance = getBalanceForType(selectedLeaveType);
      if (totalDays > balance.available) {
        toast.error(`Insufficient leave balance. Available: ${balance.available} days`);
        return;
      }
    }

    if (!employeeDetails) {
      toast.error("Employee details not found. Please contact HR.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create leave application
      const { error } = await supabase.from("leave_applications").insert({
        employee_id: employeeDetails.id,
        leave_type_id: selectedLeaveType,
        start_date: startDate,
        end_date: isHalfDay ? startDate : endDate,
        total_days: totalDays,
        reason: reason.trim(),
        status: "pending",
      });

      if (error) throw error;

      // Update pending days in leave balance (if not unpaid)
      if (!isUnpaidLeave) {
        const currentBalance = leaveBalances.find(b => b.leave_type_id === selectedLeaveType);
        if (currentBalance) {
          await supabase
            .from("leave_balances")
            .update({
              pending_days: (currentBalance.pending_days || 0) + totalDays,
            })
            .eq("id", currentBalance.id);
        }
      }

      toast.success("Leave application submitted successfully!", {
        description: "Your request is pending approval.",
      });

      // Reset form
      setOpen(false);
      setSelectedLeaveType("");
      setReason("");
      setStartDate("");
      setEndDate("");
      setShowDeductionWarning(false);
    } catch (error: any) {
      console.error("Error submitting leave:", error);
      toast.error(error.message || "Failed to submit leave application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <CalendarDays className="h-4 w-4" />
      Apply for Leave
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Apply for Leave
          </DialogTitle>
          <DialogDescription>
            Submit a leave request for approval
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Leave Type Selection */}
          <div className="space-y-2">
            <Label>Leave Type *</Label>
            <Select value={selectedLeaveType} onValueChange={handleLeaveTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((lt) => {
                  const balance = getBalanceForType(lt.id);
                  const isUnpaid = lt.name === "Unpaid Leave";
                  return (
                    <SelectItem key={lt.id} value={lt.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: lt.color || "#3B82F6" }}
                        />
                        <span>{lt.name}</span>
                        {!isUnpaid && lt.days_per_year && lt.days_per_year > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({balance.available} available)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Show balance info */}
            {selectedLeaveType && !isUnpaidLeave && selectedLeaveTypeData?.days_per_year && selectedLeaveTypeData.days_per_year > 0 && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                Balance: {getBalanceForType(selectedLeaveType).available} days available
                ({getBalanceForType(selectedLeaveType).used} used, {getBalanceForType(selectedLeaveType).pending} pending)
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea
              placeholder="Provide reason for your leave request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isHalfDay ? "Date *" : "Start Date *"}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </div>
            {!isHalfDay && (
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            )}
          </div>

          {/* Total Days Display */}
          {(startDate && (isHalfDay || endDate)) && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Leave Days:</span>
                <span className="text-lg font-bold text-primary">{totalDays} {totalDays === 1 ? "day" : "days"}</span>
              </div>
            </div>
          )}

          {/* Unpaid Leave Salary Deduction Warning */}
          {isUnpaidLeave && startDate && (isHalfDay || endDate) && totalDays > 0 && (
            <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/30">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-600">Salary Deduction Notice</AlertTitle>
              <AlertDescription className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <span className="text-muted-foreground">Your Basic Salary:</span>
                  <span className="font-medium">Rs {deductionInfo.basicSalary.toLocaleString()}</span>
                  
                  <span className="text-muted-foreground">Per Day Rate (÷26):</span>
                  <span className="font-medium">Rs {deductionInfo.perDaySalary.toFixed(2)}</span>
                  
                  <span className="text-muted-foreground">Leave Days:</span>
                  <span className="font-medium">{totalDays}</span>
                  
                  <span className="text-muted-foreground font-semibold">Total Deduction:</span>
                  <span className="font-bold text-orange-600">Rs {deductionInfo.totalDeduction.toFixed(2)}</span>
                </div>
                <p className="text-xs mt-2 text-muted-foreground">
                  This amount will be deducted from your next salary.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Half Day Notice */}
          {isHalfDay && (
            <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/30">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-600">
                Half day leave will deduct 0.5 days from your leave balance.
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Submitting..." : "Submit Leave Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyLeaveDialog;
