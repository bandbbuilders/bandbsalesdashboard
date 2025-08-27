import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sale, Customer, User } from "@/types";

const EditSale = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sale, setSale] = useState<Sale | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Form data
  const [unitNumber, setUnitNumber] = useState("");
  const [unitTotalPrice, setUnitTotalPrice] = useState("");
  const [status, setStatus] = useState<"active" | "completed" | "defaulted">("active");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [downpaymentAmount, setDownpaymentAmount] = useState("");
  const [downpaymentDueDate, setDownpaymentDueDate] = useState("");
  const [monthlyInstallment, setMonthlyInstallment] = useState("");
  const [installmentMonths, setInstallmentMonths] = useState("");
  const [possessionAmount, setPossessionAmount] = useState("");
  const [possessionDueDate, setPossessionDueDate] = useState("");

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
            agent:users(*),
            payment_plan:payment_plans(*)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        if (saleData) {
          const formattedSale: Sale = {
            id: saleData.id,
            customer_id: saleData.customer_id,
            customer: saleData.customer as Customer,
            agent_id: saleData.agent_id,
            agent: saleData.agent as User,
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
          
          // Populate form fields
          setUnitNumber(formattedSale.unit_number);
          setUnitTotalPrice(formattedSale.unit_total_price.toString());
          setStatus(formattedSale.status);
          setCustomerName(formattedSale.customer.name);
          setCustomerEmail(formattedSale.customer.email || "");
          setCustomerContact(formattedSale.customer.contact);
          setCustomerAddress(formattedSale.customer.address || "");
          
          if (formattedSale.payment_plan) {
            setDownpaymentAmount(formattedSale.payment_plan.downpayment_amount?.toString() || "");
            setDownpaymentDueDate(formattedSale.payment_plan.downpayment_due_date || "");
            setMonthlyInstallment(formattedSale.payment_plan.monthly_installment?.toString() || "");
            setInstallmentMonths(formattedSale.payment_plan.installment_months?.toString() || "");
            setPossessionAmount(formattedSale.payment_plan.possession_amount?.toString() || "");
            setPossessionDueDate(formattedSale.payment_plan.possession_due_date || "");
          }
        }
      } catch (error) {
        console.error('Error fetching sale details:', error);
        toast({
          title: "Error",
          description: "Failed to load sale details",
          variant: "destructive",
        });
        navigate("/sales");
      } finally {
        setLoading(false);
      }
    };

    fetchSaleDetails();
  }, [id, toast, navigate]);

  const canEdit = () => {
    if (!sale || !user) return false;
    return user.role === "admin" || (user.role === "agent" && sale.agent_id === user.id);
  };

  const handleSave = async () => {
    if (!sale || !canEdit()) return;

    try {
      setSaving(true);

      // Update customer
      const { error: customerError } = await supabase
        .from('customers')
        .update({
          name: customerName,
          email: customerEmail || null,
          contact: customerContact,
          address: customerAddress || null
        })
        .eq('id', sale.customer_id);

      if (customerError) throw customerError;

      // Update sale
      const { error: saleError } = await supabase
        .from('sales')
        .update({
          unit_number: unitNumber,
          unit_total_price: parseFloat(unitTotalPrice),
          status: status
        })
        .eq('id', sale.id);

      if (saleError) throw saleError;

      // Update payment plan
      if (sale.payment_plan) {
        const { error: paymentPlanError } = await supabase
          .from('payment_plans')
          .update({
            downpayment_amount: downpaymentAmount ? parseFloat(downpaymentAmount) : null,
            downpayment_due_date: downpaymentDueDate || null,
            monthly_installment: monthlyInstallment ? parseFloat(monthlyInstallment) : null,
            installment_months: installmentMonths ? parseInt(installmentMonths) : null,
            possession_amount: possessionAmount ? parseFloat(possessionAmount) : null,
            possession_due_date: possessionDueDate || null
          })
          .eq('sale_id', sale.id);

        if (paymentPlanError) throw paymentPlanError;
      }

      toast({
        title: "Success",
        description: "Sale updated successfully",
      });

      navigate(`/sales/${sale.id}`);
    } catch (error) {
      console.error('Error updating sale:', error);
      toast({
        title: "Error",
        description: "Failed to update sale",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!sale || !canEdit()) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">
          {!sale ? "Sale not found" : "You don't have permission to edit this sale"}
        </p>
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
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/sales/${sale.id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Sale</h1>
          <p className="text-muted-foreground">
            Update sale information for Unit {sale.unit_number}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Update customer details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerContact">Contact Number *</Label>
              <Input
                id="customerContact"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerAddress">Address</Label>
              <Textarea
                id="customerAddress"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sale Information */}
        <Card>
          <CardHeader>
            <CardTitle>Sale Information</CardTitle>
            <CardDescription>Update sale details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unitNumber">Unit Number *</Label>
              <Input
                id="unitNumber"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitTotalPrice">Unit Total Price *</Label>
              <Input
                id="unitTotalPrice"
                type="number"
                value={unitTotalPrice}
                onChange={(e) => setUnitTotalPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: "active" | "completed" | "defaulted") => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="defaulted">Defaulted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Plan</CardTitle>
          <CardDescription>Update payment schedule details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-4">
              <h4 className="font-semibold">Down Payment</h4>
              <div className="space-y-2">
                <Label htmlFor="downpaymentAmount">Amount</Label>
                <Input
                  id="downpaymentAmount"
                  type="number"
                  value={downpaymentAmount}
                  onChange={(e) => setDownpaymentAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="downpaymentDueDate">Due Date</Label>
                <Input
                  id="downpaymentDueDate"
                  type="date"
                  value={downpaymentDueDate}
                  onChange={(e) => setDownpaymentDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Monthly Installments</h4>
              <div className="space-y-2">
                <Label htmlFor="monthlyInstallment">Monthly Amount</Label>
                <Input
                  id="monthlyInstallment"
                  type="number"
                  value={monthlyInstallment}
                  onChange={(e) => setMonthlyInstallment(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="installmentMonths">Number of Months</Label>
                <Input
                  id="installmentMonths"
                  type="number"
                  value={installmentMonths}
                  onChange={(e) => setInstallmentMonths(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Possession</h4>
              <div className="space-y-2">
                <Label htmlFor="possessionAmount">Amount</Label>
                <Input
                  id="possessionAmount"
                  type="number"
                  value={possessionAmount}
                  onChange={(e) => setPossessionAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="possessionDueDate">Due Date</Label>
                <Input
                  id="possessionDueDate"
                  type="date"
                  value={possessionDueDate}
                  onChange={(e) => setPossessionDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="min-w-[120px]"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate(`/sales/${sale.id}`)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default EditSale;