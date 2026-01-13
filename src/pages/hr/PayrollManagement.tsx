import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Download, Plus, Eye, CheckCircle, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface PayrollRecord {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  bonuses: number;
  commission: number;
  gross_salary: number;
  late_deductions: number;
  leave_deductions: number;
  advance_deductions: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  payment_status: string;
  payment_date: string | null;
  employee_name?: string;
  department?: string;
}

interface Employee {
  id: string;
  profile_id: string;
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  other_allowances: number;
  profile?: {
    full_name: string;
    department: string;
  };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PayrollManagement = () => {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showSlipDialog, setShowSlipDialog] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      // Fetch payroll records for selected month/year
      const { data: payroll, error } = await supabase
        .from("payroll")
        .select("*")
        .eq("month", selectedMonth)
        .eq("year", selectedYear)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch employees with their profile info
      const { data: empDetails } = await supabase
        .from("employee_details")
        .select("*");

      if (empDetails && empDetails.length > 0) {
        const profileIds = empDetails.map(e => e.profile_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, department")
          .in("id", profileIds);

        const enrichedEmployees = empDetails.map(emp => ({
          ...emp,
          profile: profiles?.find(p => p.id === emp.profile_id)
        }));

        setEmployees(enrichedEmployees as Employee[]);

        // Enrich payroll with employee names
        if (payroll) {
          const enrichedPayroll = payroll.map(p => {
            const emp = enrichedEmployees.find(e => e.id === p.employee_id);
            return {
              ...p,
              employee_name: emp?.profile?.full_name || "Unknown",
              department: emp?.profile?.department || "N/A"
            };
          });
          setPayrollRecords(enrichedPayroll as PayrollRecord[]);
        }
      } else {
        setPayrollRecords([]);
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  };

  const generatePayroll = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get employees without payroll for this month
      const existingEmployeeIds = payrollRecords.map(p => p.employee_id);
      const employeesToGenerate = employees.filter(e => !existingEmployeeIds.includes(e.id));

      if (employeesToGenerate.length === 0) {
        toast.info("Payroll already generated for all employees");
        setShowGenerateDialog(false);
        return;
      }

      // Get late count from attendance for deductions
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate()}`;

      for (const emp of employeesToGenerate) {
        // Calculate attendance-based deductions
        const { data: attendance } = await supabase
          .from("attendance")
          .select("*")
          .eq("user_name", emp.profile?.full_name || "")
          .gte("date", startDate)
          .lte("date", endDate);

        const lateCount = attendance?.filter(a => a.is_late).length || 0;
        const absentCount = attendance?.filter(a => a.status === 'absent').length || 0;

        const basicSalary = emp.basic_salary || 0;
        const allowances = (emp.housing_allowance || 0) + (emp.transport_allowance || 0) + (emp.other_allowances || 0);
        const grossSalary = basicSalary + allowances;

        // Calculate deductions (example: 500 per late, 1 day salary per absent)
        const lateDeductions = lateCount * 500;
        const leaveDeductions = absentCount * (basicSalary / 30);
        const totalDeductions = lateDeductions + leaveDeductions;
        const netSalary = grossSalary - totalDeductions;

        await supabase.from("payroll").insert({
          employee_id: emp.id,
          month: selectedMonth,
          year: selectedYear,
          basic_salary: basicSalary,
          allowances: allowances,
          bonuses: 0,
          commission: 0,
          gross_salary: grossSalary,
          late_deductions: lateDeductions,
          leave_deductions: leaveDeductions,
          advance_deductions: 0,
          other_deductions: 0,
          total_deductions: totalDeductions,
          net_salary: netSalary,
          payment_status: "pending",
          generated_by: user?.id,
        });
      }

      toast.success(`Payroll generated for ${employeesToGenerate.length} employee(s)`);
      setShowGenerateDialog(false);
      fetchData();
    } catch (error) {
      console.error("Error generating payroll:", error);
      toast.error("Failed to generate payroll");
    } finally {
      setGenerating(false);
    }
  };

  const markAsPaid = async (payrollId: string) => {
    try {
      await supabase
        .from("payroll")
        .update({
          payment_status: "paid",
          payment_date: new Date().toISOString().split('T')[0],
        })
        .eq("id", payrollId);

      toast.success("Marked as paid");
      fetchData();
    } catch (error) {
      toast.error("Failed to update payment status");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalPayroll = payrollRecords.reduce((sum, p) => sum + p.net_salary, 0);
  const paidCount = payrollRecords.filter(p => p.payment_status === "paid").length;
  const pendingCount = payrollRecords.filter(p => p.payment_status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3">
          <Select
            value={String(selectedMonth)}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, idx) => (
                <SelectItem key={idx} value={String(idx + 1)}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((year) => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowGenerateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Payroll
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <DollarSign className="h-8 w-8 text-green-500" />
              <span className="text-xl font-bold">{formatCurrency(totalPayroll)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Total Payroll</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold">{paidCount}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Clock className="h-8 w-8 text-orange-500" />
              <span className="text-2xl font-bold">{pendingCount}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <FileText className="h-8 w-8 text-purple-500" />
              <span className="text-2xl font-bold">{payrollRecords.length}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Total Records</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>{MONTHS[selectedMonth - 1]} {selectedYear} Payroll</CardTitle>
        </CardHeader>
        <CardContent>
          {payrollRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payroll records for this month. Click "Generate Payroll" to create.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.employee_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.department}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(record.gross_salary)}</TableCell>
                      <TableCell className="text-right text-red-500">
                        {record.total_deductions > 0 ? `-${formatCurrency(record.total_deductions)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(record.net_salary)}</TableCell>
                      <TableCell>
                        <Badge variant={record.payment_status === "paid" ? "default" : "secondary"}>
                          {record.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedPayroll(record);
                              setShowSlipDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {record.payment_status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsPaid(record.id)}
                            >
                              Mark Paid
                            </Button>
                          )}
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

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Payroll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This will generate payroll for all employees without a record for {MONTHS[selectedMonth - 1]} {selectedYear}.
            </p>
            <p className="text-sm">
              <strong>Employees without payroll:</strong>{" "}
              {employees.filter(e => !payrollRecords.some(p => p.employee_id === e.id)).length}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={generatePayroll} disabled={generating}>
                {generating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Salary Slip Dialog */}
      <Dialog open={showSlipDialog} onOpenChange={setShowSlipDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Salary Slip</DialogTitle>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold text-lg">{selectedPayroll.employee_name}</h3>
                <p className="text-sm text-muted-foreground">{selectedPayroll.department}</p>
                <p className="text-sm text-muted-foreground">
                  {MONTHS[selectedPayroll.month - 1]} {selectedPayroll.year}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span>Basic Salary</span>
                  <span>{formatCurrency(selectedPayroll.basic_salary)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Allowances</span>
                  <span>{formatCurrency(selectedPayroll.allowances)}</span>
                </div>
                {selectedPayroll.bonuses > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span>Bonuses</span>
                    <span className="text-green-500">+{formatCurrency(selectedPayroll.bonuses)}</span>
                  </div>
                )}
                {selectedPayroll.commission > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span>Commission</span>
                    <span className="text-green-500">+{formatCurrency(selectedPayroll.commission)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b font-medium">
                  <span>Gross Salary</span>
                  <span>{formatCurrency(selectedPayroll.gross_salary)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-red-500">Deductions</h4>
                {selectedPayroll.late_deductions > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-sm">Late Arrival</span>
                    <span className="text-red-500">-{formatCurrency(selectedPayroll.late_deductions)}</span>
                  </div>
                )}
                {selectedPayroll.leave_deductions > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-sm">Leave Deductions</span>
                    <span className="text-red-500">-{formatCurrency(selectedPayroll.leave_deductions)}</span>
                  </div>
                )}
                {selectedPayroll.advance_deductions > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-sm">Advance</span>
                    <span className="text-red-500">-{formatCurrency(selectedPayroll.advance_deductions)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between py-3 border-t-2 font-bold text-lg">
                <span>Net Salary</span>
                <span className="text-green-600">{formatCurrency(selectedPayroll.net_salary)}</span>
              </div>

              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollManagement;
