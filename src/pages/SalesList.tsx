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
  DropdownMenuLabel,
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
  Coins,
  FileText
} from "lucide-react";
import { generateMembershipLetter } from "@/lib/membershipLetter";
import { CommissionDialog } from "@/components/crm/CommissionDialog";
import { AgentSalesSummary } from "@/components/sales/AgentSalesSummary";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SalesList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [appRole, setAppRole] = useState<string | null>(null);
  const { sales, loading, deleteSale } = useSales();
  const [filteredSales, setFilteredSales] = useState(sales);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);
  const [selectedSaleForCommission, setSelectedSaleForCommission] = useState<any>(null);

  useEffect(() => {
    // Support both legacy key ("user") and demo/auth key ("currentUser")
    const userData = localStorage.getItem("user") ?? localStorage.getItem("currentUser");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // If using real Supabase auth, derive permissions from session + user_roles
    supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user;
      if (!sessionUser) return;

      setAuthUserId(sessionUser.id);

      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sessionUser.id)
        .maybeSingle();

      setAppRole(roleRow?.role ?? null);
    });
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
    // Zia Shahid's auth user IDs (legacy + current)
    const ziaShahidIds = [
      "e91f0415-7d0e-4fa3-9be3-e965b0a0a3cf",
      "e91f0415-009a-4712-97e1-c70d1c29e6f9",
    ];

    // Zain Sarwar (COO) user ID
    const zainSarwarId = "fab190bd-59c4-4cd2-9d53-3fc0e7b5af95";

    const currentUserId = user?.id ?? authUserId;
    const currentRole = user?.role ?? appRole;

    const isAdmin = currentRole === "admin" || currentRole === "superadmin";
    const isCeoCoo = currentRole === "ceo_coo";
    const isZia = !!currentUserId && ziaShahidIds.includes(currentUserId);
    const isZain = currentUserId === zainSarwarId;
    const isAgentOwner = currentRole === "agent" && !!currentUserId && sale.agent_id === currentUserId;

    return isAdmin || isCeoCoo || isZia || isZain || isAgentOwner;
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
          <h1 className="text-2xl md:text-3xl font-bold">Sales Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage all sales records and customer information
          </p>
        </div>

        {(user?.role === "admin" || user?.role === "agent") && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9 md:h-10">
              <Download className="mr-1 h-4 w-4 md:mr-2" />
              <span className="xs:inline md:inline">Export</span>
            </Button>
            <Button onClick={() => navigate("/sales/new")} size="sm" className="h-9 md:h-10">
              <Plus className="mr-1 h-4 w-4 md:mr-2" />
              <span className="xs:inline md:inline">New Sale</span>
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 md:h-10"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto h-9 md:h-10">
                  <Filter className="mr-2 h-4 w-4" />
                  Status: {statusFilter === "all" ? "All" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
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

      {/* Agent Sales Summary */}
      <AgentSalesSummary sales={sales} />

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Records</CardTitle>
          <CardDescription>
            {filteredSales.length} of {sales.length} sales
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {/* Desktop Table */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell>{sale.agent?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(sale.status)} variant="outline">
                        {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(sale.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="h-10 w-10 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/sales/${sale.id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/sales/${sale.id}/ledger`)}>
                            <Calendar className="mr-2 h-4 w-4" /> Payment Ledger
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedSaleForCommission(sale);
                            setCommissionDialogOpen(true);
                          }}>
                            <Coins className="mr-2 h-4 w-4" /> Commission
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            try {
                              const { data: entries, error } = await supabase.from('ledger_entries').select('*').eq('sale_id', sale.id).order('due_date', { ascending: true });
                              if (error) throw error;
                              if (entries) { await generateMembershipLetter(sale, entries as any); toast({ title: "Success", description: "Membership letter generated successfully" }); }
                            } catch (error) { toast({ title: "Error", description: "Failed to generate membership letter", variant: "destructive" }); }
                          }}>
                            <FileText className="mr-2 h-4 w-4" /> Membership Letter
                          </DropdownMenuItem>
                          {canEdit(sale) && (
                            <>
                              <DropdownMenuItem onClick={() => navigate(`/sales/${sale.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Sale
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteSale(sale.id)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Sale
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

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredSales.map((sale) => (
              <Card key={sale.id} className="p-4 border shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-bold text-base truncate">{sale.customer.name}</p>
                    <p className="text-sm text-muted-foreground">{sale.customer.contact}</p>
                  </div>
                  <Badge className={`${getStatusColor(sale.status)} shrink-0 text-[10px] uppercase`} variant="outline">
                    {sale.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Unit</p>
                    <Badge variant="outline" className="font-mono">{sale.unit_number}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Price</p>
                    <p className="font-bold text-primary">{formatCurrency(sale.unit_total_price)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Agent</p>
                    <p className="font-medium truncate">{sale.agent?.name || 'N/A'}</p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="w-full h-11 text-sm font-semibold gap-2 bg-primary/5 hover:bg-primary/10">
                      <MoreHorizontal className="h-4 w-4" />
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[calc(100vw-3rem)] max-w-[300px] p-2">
                    <DropdownMenuLabel className="text-xs text-muted-foreground uppercase pb-2">Sale Actions</DropdownMenuLabel>
                    <DropdownMenuItem className="h-11" onClick={() => navigate(`/sales/${sale.id}`)}>
                      <Eye className="mr-3 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="h-11" onClick={() => navigate(`/sales/${sale.id}/ledger`)}>
                      <Calendar className="mr-3 h-4 w-4" /> Payment Ledger
                    </DropdownMenuItem>
                    <DropdownMenuItem className="h-11" onClick={() => {
                      setSelectedSaleForCommission(sale);
                      setCommissionDialogOpen(true);
                    }}>
                      <Coins className="mr-3 h-4 w-4" /> Commission
                    </DropdownMenuItem>
                    <DropdownMenuItem className="h-11" onClick={async () => {
                      try {
                        const { data: entries, error } = await supabase.from('ledger_entries').select('*').eq('sale_id', sale.id).order('due_date', { ascending: true });
                        if (error) throw error;
                        if (entries) { await generateMembershipLetter(sale, entries as any); toast({ title: "Success", description: "Membership letter generated" }); }
                      } catch (error) { toast({ title: "Error", description: "Failed to generate letter", variant: "destructive" }); }
                    }}>
                      <FileText className="mr-3 h-4 w-4" /> Membership Letter
                    </DropdownMenuItem>
                    {canEdit(sale) && (
                      <>
                        <DropdownMenuItem className="h-11" onClick={() => navigate(`/sales/${sale.id}/edit`)}>
                          <Edit className="mr-3 h-4 w-4" /> Edit Sale
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="h-11 text-destructive focus:text-destructive" onClick={() => handleDeleteSale(sale.id)}>
                          <Trash2 className="mr-3 h-4 w-4" /> Delete Sale
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </Card>
            ))}
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