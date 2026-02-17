import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Calendar, User, MapPin, Phone, Mail, Trash2, FileText } from "lucide-react";
import { generateMembershipLetter } from "@/lib/membershipLetter";
import { generatePaymentPlanPDF } from "@/lib/paymentPlanGenerator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";
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
import { Sale, Customer, User as UserType } from "@/types";
import { format, addMonths } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const SaleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  // Custom Payment Plan State
  const [customPlan, setCustomPlan] = useState({
    totalAmount: 0,
    downPayment: 0,
    downPaymentDate: format(new Date(), 'yyyy-MM-dd'),
    monthlyInstallment: 0,
    installmentMonths: 12,
    installmentStartDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    possessionAmount: 0,
    possessionDate: format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
    discount: 0,
    totalSqf: 0,
    ratePerSqf: 0,
    bookingAmount: 0,
    bookingDate: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    const fetchSaleDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const { data: saleData, error } = await supabase
          .from('sales')
          .select(`
            *,
            customer:customers(*),
            agent:profiles!sales_agent_id_fkey(user_id, full_name, email, role),
            external_agent:sales_agents!sales_external_agent_id_fkey(id, full_name, email),
            payment_plan:payment_plans(*)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        if (saleData) {
          // Determine agent from either internal profile or external sales_agent
          const internalAgent = saleData.agent as any;
          const externalAgent = saleData.external_agent as any;

          let agentData: UserType | undefined;

          if (internalAgent) {
            agentData = {
              id: internalAgent.user_id,
              name: internalAgent.full_name,
              email: internalAgent.email,
              role: internalAgent.role || 'user',
              created_at: '',
              updated_at: ''
            } as UserType;
          } else if (externalAgent) {
            agentData = {
              id: externalAgent.id,
              name: externalAgent.full_name,
              email: externalAgent.email || '',
              role: 'agent',
              created_at: '',
              updated_at: ''
            } as UserType;
          }

          const formattedSale: Sale = {
            id: saleData.id,
            customer_id: saleData.customer_id,
            customer: saleData.customer as Customer,
            agent_id: saleData.agent_id,
            agent: agentData as UserType,
            unit_number: saleData.unit_number,
            unit_total_price: parseFloat(saleData.unit_total_price.toString()),
            status: saleData.status as "active" | "completed" | "defaulted",
            created_at: saleData.created_at,
            updated_at: saleData.updated_at,
            payment_plan: saleData.payment_plan?.[0] ? {
              downpayment_amount: parseFloat((saleData.payment_plan[0].downpayment_amount || 0).toString()),
              downpayment_due_date: saleData.payment_plan[0].downpayment_due_date,
              monthly_installment: parseFloat((saleData.payment_plan[0].monthly_installment || 0).toString()),
              installment_months: saleData.payment_plan[0].installment_months,
              possession_amount: parseFloat((saleData.payment_plan[0].possession_amount || 0).toString()),
              possession_due_date: saleData.payment_plan[0].possession_due_date
            } : undefined
          };
          setSale(formattedSale);
        }
      } catch (error) {
        console.error('Error fetching sale details:', error);
        toast({
          title: "Error",
          description: "Failed to load sale details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSaleDetails();
  }, [id, toast]);

  useEffect(() => {
    if (sale) {
      setCustomPlan(prev => ({
        ...prev,
        totalAmount: sale.unit_total_price,
        monthlyInstallment: sale.payment_plan?.monthly_installment || 0,
        installmentMonths: sale.payment_plan?.installment_months || 12,
        possessionAmount: sale.payment_plan?.possession_amount || 0,
        discount: 0,
        totalSqf: 0,
        ratePerSqf: 0,
        bookingAmount: 0,
        bookingDate: format(new Date(), 'yyyy-MM-dd'),
      }));
    }
  }, [sale]);

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

  const canEdit = (sale: Sale) => {
    return user?.role === "admin" || (user?.role === "agent" && sale.agent_id === user.id);
  };

  const handleDelete = async () => {
    if (!sale) return;

    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', sale.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sale deleted successfully",
      });

      navigate("/sales");
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast({
        title: "Error",
        description: "Failed to delete sale",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Sale not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/sales")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sales
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/sales")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Sale Details</h1>
            <p className="text-muted-foreground">
              Unit {sale.unit_number} - {sale.customer.name}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {canEdit(sale) && (
            <Button onClick={() => navigate(`/sales/${sale.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Sale
            </Button>
          )}
          <Button
            variant="outline"
            onClick={async () => {
              if (!sale) return;
              try {
                const { data: entries, error } = await supabase
                  .from('ledger_entries')
                  .select('*')
                  .eq('sale_id', sale.id)
                  .order('due_date', { ascending: true });

                if (error) throw error;
                if (entries) {
                  await generateMembershipLetter(sale, entries as any);
                }
              } catch (error) {
                console.error('Error generating membership letter:', error);
                toast({
                  title: "Error",
                  description: "Failed to generate membership letter",
                  variant: "destructive",
                });
              }
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Membership Letter
          </Button>
          {canEdit(sale) && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{sale.customer.name}</h3>
              {sale.customer.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {sale.customer.email}
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                {sale.customer.contact}
              </div>
              {sale.customer.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {sale.customer.address}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sale Information */}
        <Card>
          <CardHeader>
            <CardTitle>Sale Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Unit Number</p>
                <Badge variant="outline" className="mt-1">{sale.unit_number}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={`mt-1 ${getStatusColor(sale.status)}`}>
                  {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Price</p>
                <p className="font-semibold text-lg">{formatCurrency(sale.unit_total_price)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agent</p>
                <p className="font-medium">{sale.agent?.name || 'N/A'}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p>{format(new Date(sale.created_at), "PPP")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p>{format(new Date(sale.updated_at), "PPP")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Plan */}
      {sale.payment_plan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Payment Plan
            </CardTitle>
            <CardDescription>
              Payment schedule and installment details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {sale.payment_plan.downpayment_amount && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Down Payment</h4>
                  <p className="text-lg font-medium">
                    {formatCurrency(sale.payment_plan.downpayment_amount)}
                  </p>
                  {sale.payment_plan.downpayment_due_date && (
                    <p className="text-sm text-muted-foreground">
                      Due: {format(new Date(sale.payment_plan.downpayment_due_date), "PP")}
                    </p>
                  )}
                </div>
              )}

              {sale.payment_plan.monthly_installment && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Monthly Installment</h4>
                  <p className="text-lg font-medium">
                    {formatCurrency(sale.payment_plan.monthly_installment)}
                  </p>
                  {sale.payment_plan.installment_months && (
                    <p className="text-sm text-muted-foreground">
                      For {sale.payment_plan.installment_months} months
                    </p>
                  )}
                </div>
              )}

              {sale.payment_plan.possession_amount && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Possession Amount</h4>
                  <p className="text-lg font-medium">
                    {formatCurrency(sale.payment_plan.possession_amount)}
                  </p>
                  {sale.payment_plan.possession_due_date && (
                    <p className="text-sm text-muted-foreground">
                      Due: {format(new Date(sale.payment_plan.possession_due_date), "PP")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Payment Plan Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Custom Payment Plan Generator
          </CardTitle>
          <CardDescription>
            Generate a custom payment plan PDF for this client.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rate & Size Configuration */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-4 border rounded-md bg-muted/20">
            <div className="space-y-2">
              <Label>Unit Size (SQF)</Label>
              <Input
                type="number"
                value={customPlan.totalSqf}
                onChange={(e) => {
                  const sqf = Number(e.target.value);
                  const newTotal = sqf * customPlan.ratePerSqf;
                  setCustomPlan({ ...customPlan, totalSqf: sqf, totalAmount: newTotal > 0 ? newTotal : customPlan.totalAmount });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Rate (Per SQF)</Label>
              <Input
                type="number"
                value={customPlan.ratePerSqf}
                onChange={(e) => {
                  const rate = Number(e.target.value);
                  const newTotal = rate * customPlan.totalSqf;
                  setCustomPlan({ ...customPlan, ratePerSqf: rate, totalAmount: newTotal > 0 ? newTotal : customPlan.totalAmount });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <Input
                type="number"
                value={customPlan.totalAmount}
                onChange={(e) => setCustomPlan({ ...customPlan, totalAmount: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                {customPlan.totalSqf > 0 && customPlan.ratePerSqf > 0
                  ? `Calculated: ${formatCurrency(customPlan.totalSqf * customPlan.ratePerSqf)}`
                  : 'Manual Entry'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Discount Amount</Label>
              <Input
                type="number"
                value={customPlan.discount}
                onChange={(e) => setCustomPlan({ ...customPlan, discount: Number(e.target.value) })}
              />
            </div>
          </div>

          <Separator />

          {/* Payment Schedule Inputs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Booking Amount</Label>
              <Input
                type="number"
                value={customPlan.bookingAmount}
                onChange={(e) => setCustomPlan({ ...customPlan, bookingAmount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Booking Date</Label>
              <Input
                type="date"
                value={customPlan.bookingDate}
                onChange={(e) => setCustomPlan({ ...customPlan, bookingDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Down Payment</Label>
              <Input
                type="number"
                value={customPlan.downPayment}
                onChange={(e) => setCustomPlan({ ...customPlan, downPayment: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>DP Due Date</Label>
              <Input
                type="date"
                value={customPlan.downPaymentDate}
                onChange={(e) => setCustomPlan({ ...customPlan, downPaymentDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Installment Months</Label>
              <Input
                type="number"
                value={customPlan.installmentMonths}
                onChange={(e) => setCustomPlan({ ...customPlan, installmentMonths: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Monthly Installment</Label>
              <Input
                type="number"
                value={customPlan.monthlyInstallment}
                onChange={(e) => setCustomPlan({ ...customPlan, monthlyInstallment: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={customPlan.installmentStartDate}
                onChange={(e) => setCustomPlan({ ...customPlan, installmentStartDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Installment Total</Label>
              <div className="p-2 border rounded-md bg-muted text-sm font-medium">
                {formatCurrency(customPlan.monthlyInstallment * customPlan.installmentMonths)}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Possession Amount</Label>
              <Input
                type="number"
                value={customPlan.possessionAmount}
                onChange={(e) => setCustomPlan({ ...customPlan, possessionAmount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Possession Date</Label>
              <Input
                type="date"
                value={customPlan.possessionDate}
                onChange={(e) => setCustomPlan({ ...customPlan, possessionDate: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Validation Check</Label>
              <div className={`p-2 border rounded-md text-sm font-medium flex justify-between ${(customPlan.bookingAmount + customPlan.downPayment + (customPlan.monthlyInstallment * customPlan.installmentMonths) + customPlan.possessionAmount) === (customPlan.totalAmount - customPlan.discount)
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-red-100 text-red-800 border-red-200"
                }`}>
                <span>Sum: {formatCurrency(customPlan.bookingAmount + customPlan.downPayment + (customPlan.monthlyInstallment * customPlan.installmentMonths) + customPlan.possessionAmount)}</span>
                <span>Target: {formatCurrency(customPlan.totalAmount - customPlan.discount)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={() => {
                if (!sale) return;

                const totalSum = customPlan.bookingAmount + customPlan.downPayment + (customPlan.monthlyInstallment * customPlan.installmentMonths) + customPlan.possessionAmount;
                const targetTotal = customPlan.totalAmount - customPlan.discount;

                if (Math.abs(totalSum - targetTotal) > 100) { // Allow small float margin
                  toast({
                    title: "Validation Error",
                    description: `Total amount mismatch! Sum of parts (${formatCurrency(totalSum)}) does not equal Total Amount - Discount (${formatCurrency(targetTotal)})`,
                    variant: "destructive"
                  });
                  return;
                }

                generatePaymentPlanPDF(sale, {
                  ...customPlan,
                  downPaymentDate: new Date(customPlan.downPaymentDate),
                  installmentStartDate: new Date(customPlan.installmentStartDate),
                  possessionDate: new Date(customPlan.possessionDate),
                  bookingDate: new Date(customPlan.bookingDate),
                  showDetailedSchedule: true,
                  standardRate: customPlan.totalSqf > 0 ? (sale.unit_total_price / customPlan.totalSqf) : 0,
                  preparedBy: user?.name
                });
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Plan PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the sale for Unit {sale.unit_number}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SaleDetails;