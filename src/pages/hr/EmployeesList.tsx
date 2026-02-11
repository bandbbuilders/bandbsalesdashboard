import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Eye, Edit, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface Employee {
  id: string;
  profile_id: string;
  cnic: string | null;
  joining_date: string | null;
  contract_type: string;
  work_location: string;
  basic_salary: number;
  phone_number: string | null;
  address: string | null;
  status: string;
  profile?: {
    full_name: string;
    email: string;
    position: string | null;
    department: string | null;
  };
}

const EmployeesList = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [formData, setFormData] = useState({
    cnic: "",
    joining_date: "",
    contract_type: "permanent",
    work_location: "office",
    basic_salary: "",
    phone_number: "",
    address: "",
    status: "active",
  });

  useEffect(() => {
    fetchEmployees();
    fetchProfiles();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data: employeeDetails, error } = await supabase
        .from("employee_details")
        .select("*");

      if (error) throw error;

      // Fetch profiles for these employees
      if (employeeDetails && employeeDetails.length > 0) {
        const profileIds = employeeDetails.map(e => e.profile_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("id", profileIds);

        const enrichedEmployees: Employee[] = employeeDetails.map(emp => {
          const profile = profilesData?.find(p => p.id === emp.profile_id);
          return {
            ...emp,
            status: (emp as any).status || "active",
            profile: profile ? {
              full_name: profile.full_name,
              email: profile.email,
              position: profile.position,
              department: profile.department,
            } : undefined
          };
        });

        setEmployees(enrichedEmployees);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");
    setProfiles(data || []);
  };

  const handleAddEmployee = async () => {
    if (!selectedProfile) {
      toast.error("Please select a profile");
      return;
    }

    try {
      const { error } = await supabase
        .from("employee_details")
        .insert({
          profile_id: selectedProfile,
          cnic: formData.cnic || null,
          joining_date: formData.joining_date || null,
          contract_type: formData.contract_type,
          work_location: formData.work_location,
          basic_salary: parseFloat(formData.basic_salary) || 0,
          phone_number: formData.phone_number || null,
          address: formData.address || null,
        });

      if (error) throw error;

      toast.success("Employee added successfully");
      setShowAddDialog(false);
      setSelectedProfile("");
      resetFormData();
      fetchEmployees();
    } catch (error: any) {
      console.error("Error adding employee:", error);
      toast.error(error.message || "Failed to add employee");
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee's details? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("employee_details")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Employee details deleted successfully");
      setShowEditDialog(false);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (error: any) {
      console.error("Error deleting employee:", error);
      toast.error(error.message || "Failed to delete employee");
    }
  };

  const resetFormData = () => {
    setFormData({
      cnic: "",
      joining_date: "",
      contract_type: "permanent",
      work_location: "office",
      basic_salary: "",
      phone_number: "",
      address: "",
      status: "active",
    });
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      cnic: employee.cnic || "",
      joining_date: employee.joining_date || "",
      contract_type: employee.contract_type || "permanent",
      work_location: employee.work_location || "office",
      basic_salary: employee.basic_salary?.toString() || "",
      phone_number: employee.phone_number || "",
      address: employee.address || "",
      status: employee.status || "active",
    });
    setShowEditDialog(true);
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;

    try {
      const { error } = await supabase
        .from("employee_details")
        .update({
          cnic: formData.cnic || null,
          joining_date: formData.joining_date || null,
          contract_type: formData.contract_type,
          work_location: formData.work_location,
          basic_salary: parseFloat(formData.basic_salary) || 0,
          phone_number: formData.phone_number || null,
          address: formData.address || null,
          status: formData.status,
        })
        .eq("id", editingEmployee.id);

      if (error) throw error;

      toast.success("Employee updated successfully");
      setShowEditDialog(false);
      setEditingEmployee(null);
      resetFormData();
      fetchEmployees();
    } catch (error: any) {
      console.error("Error updating employee:", error);
      toast.error(error.message || "Failed to update employee");
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.profile?.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get profiles that don't have employee details yet
  const availableProfiles = profiles.filter(
    p => !employees.some(e => e.profile_id === p.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee Details
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Employee Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Profile</Label>
                <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name} - {profile.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  placeholder="+92 300 1234567"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>CNIC</Label>
                <Input
                  placeholder="00000-0000000-0"
                  value={formData.cnic}
                  onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  placeholder="Full address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Joining Date</Label>
                <Input
                  type="date"
                  value={formData.joining_date}
                  onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contract Type</Label>
                  <Select
                    value={formData.contract_type}
                    onValueChange={(value) => setFormData({ ...formData, contract_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="probation">Probation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Work Location</Label>
                  <Select
                    value={formData.work_location}
                    onValueChange={(value) => setFormData({ ...formData, work_location: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="site">Site</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Basic Salary (PKR)</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={formData.basic_salary}
                  onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                />
              </div>
              <Button onClick={handleAddEmployee} className="w-full">
                Add Employee
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Employees ({filteredEmployees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {employees.length === 0
                ? "No employees found. Add employee details to get started."
                : "No employees match your search."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Contract</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Joining Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{employee.profile?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{employee.profile?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{employee.profile?.department || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>{employee.profile?.position || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            employee.contract_type === "permanent" ? "default" :
                              employee.contract_type === "probation" ? "secondary" : "outline"
                          }
                        >
                          {employee.contract_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{employee.work_location}</TableCell>
                      <TableCell>
                        {employee.joining_date
                          ? format(new Date(employee.joining_date), "MMM d, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={employee.status === 'active' ? 'default' : 'destructive'}>
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" asChild>
                            <Link to={`/hr/employees/${employee.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEditEmployee(employee)}>
                            <Edit className="h-4 w-4" />
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

      {/* Edit Employee Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                placeholder="+92 300 1234567"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>CNIC</Label>
              <Input
                placeholder="00000-0000000-0"
                value={formData.cnic}
                onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                placeholder="Full address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Joining Date</Label>
              <Input
                type="date"
                value={formData.joining_date}
                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Basic Salary (PKR)</Label>
              <Input
                type="number"
                placeholder="50000"
                value={formData.basic_salary}
                onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Employment Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="resigned">Resigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="destructive"
                onClick={() => editingEmployee && handleDeleteEmployee(editingEmployee.id)}
                className="flex-1"
              >
                Delete Details
              </Button>
              <div className="flex gap-2 flex-[2]">
                <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleUpdateEmployee} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeesList;
