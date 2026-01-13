import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Target, Award, Users, Plus, Edit } from "lucide-react";
import { toast } from "sonner";

interface KpiDefinition {
  id: string;
  department: string;
  kpi_name: string;
  description: string | null;
  target_value: number;
  unit: string;
  weight: number;
}

interface EmployeeKpi {
  id: string;
  employee_id: string;
  kpi_id: string;
  month: number;
  year: number;
  achieved_value: number;
  score: number;
  manager_remarks: string | null;
  kpi?: KpiDefinition;
  employee_name?: string;
}

interface PerformanceReview {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  overall_score: number;
  manager_remarks: string | null;
  self_assessment: string | null;
  status: string;
  employee_name?: string;
  department?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PerformanceManagement = () => {
  const [kpiDefinitions, setKpiDefinitions] = useState<KpiDefinition[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showKpiDialog, setShowKpiDialog] = useState(false);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employeeKpis, setEmployeeKpis] = useState<EmployeeKpi[]>([]);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      // Fetch KPI definitions
      const { data: kpis } = await supabase
        .from("kpi_definitions")
        .select("*")
        .order("department");

      setKpiDefinitions(kpis || []);

      // Fetch employees with profiles
      const { data: empDetails } = await supabase
        .from("employee_details")
        .select("*");

      if (empDetails && empDetails.length > 0) {
        const profileIds = empDetails.map(e => e.profile_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", profileIds);

        const enrichedEmployees = empDetails.map(emp => ({
          ...emp,
          profile: profiles?.find(p => p.id === emp.profile_id)
        }));

        setEmployees(enrichedEmployees);
      }

      // Fetch performance reviews
      const { data: reviewData } = await supabase
        .from("performance_reviews")
        .select("*")
        .eq("month", selectedMonth)
        .eq("year", selectedYear);

      if (reviewData && empDetails) {
        const profileIds = empDetails.map(e => e.profile_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", profileIds);

        const enrichedReviews = reviewData.map(r => {
          const emp = empDetails.find(e => e.id === r.employee_id);
          const profile = profiles?.find(p => p.id === emp?.profile_id);
          return {
            ...r,
            employee_name: profile?.full_name || "Unknown",
            department: profile?.department || "N/A"
          };
        });

        setReviews(enrichedReviews as PerformanceReview[]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load performance data");
    } finally {
      setLoading(false);
    }
  };

  const openScoreDialog = async (employee: any) => {
    setSelectedEmployee(employee);

    // Fetch existing KPIs for this employee
    const { data: kpis } = await supabase
      .from("employee_kpis")
      .select(`
        *,
        kpi_definitions(*)
      `)
      .eq("employee_id", employee.id)
      .eq("month", selectedMonth)
      .eq("year", selectedYear);

    setEmployeeKpis(kpis || []);
    setShowScoreDialog(true);
  };

  const saveKpiScore = async (kpiId: string, achievedValue: number) => {
    if (!selectedEmployee) return;

    try {
      const kpi = kpiDefinitions.find(k => k.id === kpiId);
      if (!kpi) return;

      // Calculate score based on achieved vs target
      const score = Math.min(100, (achievedValue / kpi.target_value) * 100);

      const { error } = await supabase
        .from("employee_kpis")
        .upsert({
          employee_id: selectedEmployee.id,
          kpi_id: kpiId,
          month: selectedMonth,
          year: selectedYear,
          achieved_value: achievedValue,
          score: score,
        }, { onConflict: 'employee_id,kpi_id,month,year' });

      if (error) throw error;

      toast.success("KPI score saved");
      
      // Refresh KPIs
      const { data: updatedKpis } = await supabase
        .from("employee_kpis")
        .select(`*, kpi_definitions(*)`)
        .eq("employee_id", selectedEmployee.id)
        .eq("month", selectedMonth)
        .eq("year", selectedYear);

      setEmployeeKpis(updatedKpis || []);
    } catch (error) {
      console.error("Error saving KPI:", error);
      toast.error("Failed to save KPI score");
    }
  };

  const calculateOverallScore = () => {
    if (employeeKpis.length === 0) return 0;
    const totalScore = employeeKpis.reduce((sum, k) => sum + (k.score || 0), 0);
    return Math.round(totalScore / employeeKpis.length);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500">Good</Badge>;
    if (score >= 40) return <Badge className="bg-orange-500">Average</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  // Group KPIs by department
  const kpisByDepartment = kpiDefinitions.reduce((acc, kpi) => {
    if (!acc[kpi.department]) acc[kpi.department] = [];
    acc[kpi.department].push(kpi);
    return acc;
  }, {} as Record<string, KpiDefinition[]>);

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
        <Button onClick={() => setShowKpiDialog(true)}>
          <Target className="h-4 w-4 mr-2" />
          View KPI Definitions
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold">{employees.length}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Total Employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Target className="h-8 w-8 text-purple-500" />
              <span className="text-2xl font-bold">{kpiDefinitions.length}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">KPI Metrics</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <span className="text-2xl font-bold">{reviews.length}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Reviews This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Award className="h-8 w-8 text-yellow-500" />
              <span className="text-2xl font-bold">
                {reviews.length > 0 
                  ? Math.round(reviews.reduce((sum, r) => sum + r.overall_score, 0) / reviews.length)
                  : 0}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Avg Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Performance - {MONTHS[selectedMonth - 1]} {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No employees found. Add employees first.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => {
                    const review = reviews.find(r => r.employee_id === emp.id);
                    return (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.profile?.full_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{emp.profile?.department || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>{emp.profile?.position || "N/A"}</TableCell>
                        <TableCell>
                          {review ? (
                            <div className="flex items-center gap-2">
                              <Progress value={review.overall_score} className="w-20" />
                              <span className={getScoreColor(review.overall_score)}>
                                {review.overall_score}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {review 
                            ? getScoreBadge(review.overall_score)
                            : <Badge variant="secondary">Pending</Badge>
                          }
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openScoreDialog(emp)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Score KPIs
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Definitions Dialog */}
      <Dialog open={showKpiDialog} onOpenChange={setShowKpiDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KPI Definitions by Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {Object.entries(kpisByDepartment).map(([dept, kpis]) => (
              <div key={dept}>
                <h3 className="font-semibold text-lg mb-3">{dept}</h3>
                <div className="space-y-2">
                  {kpis.map((kpi) => (
                    <div key={kpi.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{kpi.kpi_name}</p>
                          <p className="text-sm text-muted-foreground">{kpi.description}</p>
                        </div>
                        <Badge variant="outline">
                          Target: {kpi.target_value} {kpi.unit}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Score KPIs Dialog */}
      <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Score KPIs - {selectedEmployee?.profile?.full_name}
            </DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Department: {selectedEmployee.profile?.department}</p>
                <p className="text-sm text-muted-foreground">Period: {MONTHS[selectedMonth - 1]} {selectedYear}</p>
                <p className="text-lg font-semibold mt-2">
                  Overall Score: <span className={getScoreColor(calculateOverallScore())}>{calculateOverallScore()}%</span>
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Department KPIs</h4>
                {kpiDefinitions
                  .filter(kpi => kpi.department === selectedEmployee.profile?.department)
                  .map((kpi) => {
                    const existingKpi = employeeKpis.find(ek => ek.kpi_id === kpi.id);
                    return (
                      <div key={kpi.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{kpi.kpi_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Target: {kpi.target_value} {kpi.unit}
                            </p>
                          </div>
                          {existingKpi && (
                            <Badge className={getScoreColor(existingKpi.score).replace('text-', 'bg-').replace('-500', '-500/20')}>
                              Score: {Math.round(existingKpi.score)}%
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Label className="w-32">Achieved Value:</Label>
                          <Input
                            type="number"
                            className="w-32"
                            defaultValue={existingKpi?.achieved_value || 0}
                            onBlur={(e) => saveKpiScore(kpi.id, parseFloat(e.target.value) || 0)}
                          />
                          <span className="text-sm text-muted-foreground">{kpi.unit}</span>
                        </div>
                        {existingKpi && (
                          <Progress value={existingKpi.score} className="h-2" />
                        )}
                      </div>
                    );
                  })}

                {kpiDefinitions.filter(kpi => kpi.department === selectedEmployee.profile?.department).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No KPIs defined for {selectedEmployee.profile?.department} department
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PerformanceManagement;
