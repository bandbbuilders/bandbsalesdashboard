import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Calendar, User, MapPin, Phone, Mail } from "lucide-react";
import { Sale, Customer, User as UserType } from "@/types";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const SaleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserType | null>(null);
  const { toast } = useToast();

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
            agent: saleData.agent as UserType,
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
      case "active": return "bg-success text-success-foreground";
      case "completed": return "bg-primary text-primary-foreground";
      case "defaulted": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const canEdit = (sale: Sale) => {
    return user?.role === "admin" || (user?.role === "agent" && sale.agent_id === user.id);
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
        
        {canEdit(sale) && (
          <Button onClick={() => navigate(`/sales/${sale.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Sale
          </Button>
        )}
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
                <p className="font-medium">{sale.agent.name}</p>
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
    </div>
  );
};

export default SaleDetails;