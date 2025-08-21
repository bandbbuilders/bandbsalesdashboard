import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Calendar,
  DollarSign,
  Plus,
  Download
} from "lucide-react";
import { Sale, User } from "@/types";
import { format } from "date-fns";

const SalesList = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Mock sales data
    const mockSales: Sale[] = [
      {
        id: "1",
        customer_id: "c1",
        customer: {
          id: "c1",
          name: "Ahmed Hassan",
          contact: "+92 300 1234567",
          email: "ahmed@email.com"
        },
        agent_id: "a1",
        agent: {
          id: "a1",
          email: "agent1@company.com",
          role: "agent",
          name: "Sara Khan",
          created_at: "2024-01-01"
        },
        unit_number: "A-101",
        unit_total_price: 5000000,
        status: "active",
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
        payment_plan: {
          downpayment_amount: 1000000,
          downpayment_due_date: "2024-02-15",
          monthly_installment: 100000,
          installment_months: 42,
          possession_amount: 500000,
          possession_due_date: "2027-07-15"
        }
      },
      {
        id: "2",
        customer_id: "c2",
        customer: {
          id: "c2",
          name: "Fatima Sheikh",
          contact: "+92 301 9876543",
          email: "fatima@email.com"
        },
        agent_id: "a2",
        agent: {
          id: "a2",
          email: "agent2@company.com",
          role: "agent",
          name: "Ali Ahmed",
          created_at: "2024-01-01"
        },
        unit_number: "B-205",
        unit_total_price: 3800000,
        status: "active",
        created_at: "2024-01-20T14:30:00Z",
        updated_at: "2024-01-20T14:30:00Z",
        payment_plan: {
          downpayment_amount: 800000,
          downpayment_due_date: "2024-02-20",
          monthly_installment: 75000,
          installment_months: 40
        }
      },
      {
        id: "3",
        customer_id: "c3",
        customer: {
          id: "c3",
          name: "Muhammad Khan",
          contact: "+92 302 5555555",
          email: "muhammad@email.com"
        },
        agent_id: "a1",
        agent: {
          id: "a1",
          email: "agent1@company.com",
          role: "agent",
          name: "Sara Khan",
          created_at: "2024-01-01"
        },
        unit_number: "C-301",
        unit_total_price: 7200000,
        status: "completed",
        created_at: "2023-06-10T09:15:00Z",
        updated_at: "2024-01-10T16:45:00Z",
        payment_plan: {
          downpayment_amount: 1500000,
          monthly_installment: 135000,
          installment_months: 42,
          possession_amount: 720000
        }
      }
    ];
    
    setSales(mockSales);
    setFilteredSales(mockSales);
  }, []);

  useEffect(() => {
    let filtered = sales;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer.contact.includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(sale => sale.status === statusFilter);
    }

    setFilteredSales(filtered);
  }, [sales, searchTerm, statusFilter]);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else {
      return `₹${amount.toLocaleString()}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "completed": return "bg-blue-100 text-blue-800 border-blue-200";
      case "defaulted": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const canEdit = (sale: Sale) => {
    return user?.role === "admin" || (user?.role === "agent" && sale.agent_id === user.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Management</h1>
          <p className="text-muted-foreground">
            Manage all sales records and customer information
          </p>
        </div>
        
        {(user?.role === "admin" || user?.role === "agent") && (
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => navigate("/sales/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New Sale
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name, unit number, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <Filter className="mr-2 h-4 w-4" />
                  Status: {statusFilter === "all" ? "All" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("defaulted")}>
                  Defaulted
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(sales.reduce((sum, sale) => sum + sale.unit_total_price, 0))} total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sales</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sales.filter(sale => sale.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {sales.filter(sale => sale.status === "completed").length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Sales</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.role === "agent" ? sales.filter(sale => sale.agent_id === user.id).length : sales.length}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Records</CardTitle>
          <CardDescription>
            {filteredSales.length} of {sales.length} sales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sale.customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {sale.customer.contact}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{sale.unit_number}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(sale.unit_total_price)}
                    </TableCell>
                    <TableCell>{sale.agent.name}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(sale.status)} variant="outline">
                        {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(sale.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/sales/${sale.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/sales/${sale.id}/ledger`)}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Payment Ledger
                          </DropdownMenuItem>
                          {canEdit(sale) && (
                            <DropdownMenuItem onClick={() => navigate(`/sales/${sale.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Sale
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredSales.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No sales found matching your criteria.</p>
              {(user?.role === "admin" || user?.role === "agent") && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate("/sales/new")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Sale
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesList;