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
  DropdownMenuTrigger,
  DropdownMenuSeparator
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
  Download,
  Trash2,
  Coins
} from "lucide-react";
import { CommissionDialog } from "@/components/crm/CommissionDialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { User } from "@/types";
import { format } from "date-fns";
import { useSales } from "@/hooks/useSales";

const SalesList = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const { sales, loading, deleteSale } = useSales();
  const [filteredSales, setFilteredSales] = useState(sales);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);
  const [selectedSaleForCommission, setSelectedSaleForCommission] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
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
      return `PKR ${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `PKR ${(amount / 100000).toFixed(1)}L`;
    } else {
      return `PKR ${amount.toLocaleString()}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success text-success-foreground";
      case "completed": return "bg-primary text-primary-foreground";
      case "defaulted": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const canEdit = (sale: any) => {
    return user?.role === "admin" || (user?.role === "agent" && sale.agent_id === user.id);
  };

  const handleDeleteSale = (saleId: string) => {
    setSaleToDelete(saleId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (saleToDelete) {
      await deleteSale(saleToDelete);
      setDeleteDialogOpen(false);
      setSaleToDelete(null);
    }
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
                          <DropdownMenuItem onClick={() => {
                            setSelectedSaleForCommission(sale);
                            setCommissionDialogOpen(true);
                          }}>
                            <Coins className="mr-2 h-4 w-4" />
                            Commission
                          </DropdownMenuItem>
                          {canEdit(sale) && (
                            <>
                              <DropdownMenuItem onClick={() => navigate(`/sales/${sale.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Sale
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteSale(sale.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Sale
                              </DropdownMenuItem>
                            </>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sale
              and all associated payment records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Commission Dialog */}
      {selectedSaleForCommission && (
        <CommissionDialog
          open={commissionDialogOpen}
          onOpenChange={setCommissionDialogOpen}
          saleId={selectedSaleForCommission.id}
          saleAmount={selectedSaleForCommission.unit_total_price}
        />
      )}
    </div>
  );
};

export default SalesList;