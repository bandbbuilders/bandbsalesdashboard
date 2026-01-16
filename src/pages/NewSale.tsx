
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Save } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LedgerEntry {
  id: string;
  dueDate: Date;
  type: 'downpayment' | 'installment' | 'possession';
  amount: number;
  description: string;
}

const NewSale = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Customer Information
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  
  // Unit Information
  const [unitNumber, setUnitNumber] = useState("");
  const [unitTotalPrice, setUnitTotalPrice] = useState("");
  
  // Payment Plan
  const [downpaymentAmount, setDownpaymentAmount] = useState("");
  const [downpaymentDate, setDownpaymentDate] = useState<Date>();
  const [monthlyInstallment, setMonthlyInstallment] = useState("");
  const [installmentMonths, setInstallmentMonths] = useState("42");
  const [possessionAmount, setPossessionAmount] = useState("");
  const [possessionDate, setPossessionDate] = useState<Date>();
  
  // Ledger entries
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [isGeneratingLedger, setIsGeneratingLedger] = useState(false);

  const generateLedger = () => {
    setIsGeneratingLedger(true);
    const entries: LedgerEntry[] = [];
    
    // Add downpayment if specified
    if (downpaymentAmount && downpaymentDate) {
      entries.push({
        id: `dp-${Date.now()}`,
        dueDate: downpaymentDate,
        type: 'downpayment',
        amount: parseFloat(downpaymentAmount),
        description: 'Down Payment'
      });
    }
    
    // Add monthly installments
    if (monthlyInstallment && installmentMonths) {
      const installmentAmount = parseFloat(monthlyInstallment);
      const months = parseInt(installmentMonths);
      const startDate = downpaymentDate ? new Date(downpaymentDate) : new Date();
      
      for (let i = 1; i <= months; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        entries.push({
          id: `inst-${i}-${Date.now()}`,
          dueDate,
          type: 'installment',
          amount: installmentAmount,
          description: `Monthly Installment ${i}`
        });
      }
    }
    
    // Add possession payment if specified
    if (possessionAmount && possessionDate) {
      entries.push({
        id: `pos-${Date.now()}`,
        dueDate: possessionDate,
        type: 'possession',
        amount: parseFloat(possessionAmount),
        description: 'Possession Payment'
      });
    }
    
    setLedgerEntries(entries.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()));
    setIsGeneratingLedger(false);
    
    toast({
      title: "Ledger Generated",
      description: `${entries.length} payment entries created successfully.`,
    });
  };

  const addCustomEntry = () => {
    const newEntry: LedgerEntry = {
      id: `custom-${Date.now()}`,
      dueDate: new Date(),
      type: 'installment',
      amount: 0,
      description: 'Custom Payment'
    };
    setLedgerEntries([...ledgerEntries, newEntry]);
  };

  const updateLedgerEntry = (id: string, field: keyof LedgerEntry, value: any) => {
    setLedgerEntries(entries => 
      entries.map(entry => 
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const removeLedgerEntry = (id: string) => {
    setLedgerEntries(entries => entries.filter(entry => entry.id !== id));
  };

  const handleSave = async () => {
    try {
      // Basic validation
      if (!customerName.trim()) {
        toast({
          title: "Validation Error",
          description: "Customer name is required",
          variant: "destructive",
        });
        return;
      }
      
      if (!customerContact.trim()) {
        toast({
          title: "Validation Error", 
          description: "Customer contact is required",
          variant: "destructive",
        });
        return;
      }
      
      if (!unitNumber.trim()) {
        toast({
          title: "Validation Error",
          description: "Unit number is required", 
          variant: "destructive",
        });
        return;
      }
      
      if (!unitTotalPrice || parseFloat(unitTotalPrice) <= 0) {
        toast({
          title: "Validation Error",
          description: "Valid unit price is required",
          variant: "destructive",
        });
        return;
      }
      
      // Get current user - prioritize Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      let agentId: string | null = null;
      
      if (session?.user) {
        agentId = session.user.id;
      } else {
        // Fallback to localStorage for demo mode
        const userData = localStorage.getItem("currentUser");
        if (userData) {
          const user = JSON.parse(userData);
          agentId = user.id || user.user_id;
        }
      }
      
      if (!agentId) {
        toast({
          title: "Authentication Error",
          description: "Please login first",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      
      console.log('Creating sale with agent_id:', agentId);
      
      // Create customer first
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: customerName.trim(),
          contact: customerContact.trim(),
          email: customerEmail?.trim() || null,
          address: customerAddress?.trim() || null,
        })
        .select()
        .single();

      if (customerError) {
        console.error("Customer creation error:", customerError);
        throw new Error(customerError.message || 'Failed to create customer');
      }

      // Create sale - use agentId from session
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          customer_id: customerData.id,
          agent_id: agentId,
          unit_number: unitNumber.trim(),
          unit_total_price: parseFloat(unitTotalPrice),
          status: 'active',
        })
        .select()
        .single();

      if (saleError) {
        console.error("Sale creation error:", saleError);
        throw new Error(saleError.message || 'Failed to create sale');
      }
      
      console.log("Sale created successfully:", saleData);

      // Create payment plan
      if (monthlyInstallment && parseFloat(monthlyInstallment) > 0) {
        console.log("Creating payment plan...");
        const { error: paymentPlanError } = await supabase
          .from('payment_plans')
          .insert({
            sale_id: saleData.id,
            downpayment_amount: downpaymentAmount ? parseFloat(downpaymentAmount) : null,
            downpayment_due_date: downpaymentDate ? downpaymentDate.toISOString().split('T')[0] : null,
            monthly_installment: parseFloat(monthlyInstallment),
            installment_months: parseInt(installmentMonths) || 42,
            possession_amount: possessionAmount ? parseFloat(possessionAmount) : null,
            possession_due_date: possessionDate ? possessionDate.toISOString().split('T')[0] : null,
          });

        if (paymentPlanError) {
          console.error("Payment plan creation error:", paymentPlanError);
          throw new Error(paymentPlanError.message || 'Failed to create payment plan');
        }
        
        console.log("Payment plan created successfully");
      }

      // Create ledger entries
      if (ledgerEntries.length > 0) {
        console.log("Creating ledger entries...", ledgerEntries.length);
        const ledgerInserts = ledgerEntries.map(entry => ({
          sale_id: saleData.id,
          due_date: entry.dueDate.toISOString().split('T')[0],
          entry_type: entry.type,
          amount: entry.amount,
          description: entry.description,
          status: 'pending',
        }));

        const { error: ledgerError } = await supabase
          .from('ledger_entries')
          .insert(ledgerInserts);

        if (ledgerError) {
          console.error("Ledger entries creation error:", ledgerError);
          throw new Error(ledgerError.message || 'Failed to create ledger entries');
        }
        
        console.log("Ledger entries created successfully");
      }
      
      toast({
        title: "Sale Created",
        description: "Sale record has been created successfully.",
      });
      
      navigate("/sales");
    } catch (error: any) {
      console.error('Error creating sale:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast({
        title: "Error",
        description: error?.message || "Failed to create sale record. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString()}`;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'downpayment': return 'bg-blue-100 text-blue-800';
      case 'installment': return 'bg-green-100 text-green-800';
      case 'possession': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create New Sale</h1>
          <p className="text-muted-foreground">Enter customer and unit details</p>
        </div>
        <Button onClick={handleSave} disabled={!customerName || !unitNumber || !unitTotalPrice}>
          <Save className="mr-2 h-4 w-4" />
          Save Sale
        </Button>
      </div>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>Enter customer contact details</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name *</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer full name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customerContact">Contact Number *</Label>
            <Input
              id="customerContact"
              value={customerContact}
              onChange={(e) => setCustomerContact(e.target.value)}
              placeholder="+92 300 1234567"
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
              placeholder="customer@email.com"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="customerAddress">Address</Label>
            <Textarea
              id="customerAddress"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Customer address"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Unit Information */}
      <Card>
        <CardHeader>
          <CardTitle>Unit Details</CardTitle>
          <CardDescription>Property information</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="unitNumber">Unit Number *</Label>
            <Input
              id="unitNumber"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              placeholder="A-101, B-205, etc."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="unitTotalPrice">Total Unit Price (PKR) *</Label>
            <Input
              id="unitTotalPrice"
              type="number"
              value={unitTotalPrice}
              onChange={(e) => setUnitTotalPrice(e.target.value)}
              placeholder="5000000"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Plan</CardTitle>
          <CardDescription>Define the payment structure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="downpaymentAmount">Down Payment Amount (PKR)</Label>
              <Input
                id="downpaymentAmount"
                type="number"
                value={downpaymentAmount}
                onChange={(e) => setDownpaymentAmount(e.target.value)}
                placeholder="1000000"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Down Payment Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !downpaymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {downpaymentDate ? format(downpaymentDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={downpaymentDate}
                    onSelect={setDownpaymentDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="monthlyInstallment">Monthly Installment (PKR) *</Label>
              <Input
                id="monthlyInstallment"
                type="number"
                value={monthlyInstallment}
                onChange={(e) => setMonthlyInstallment(e.target.value)}
                placeholder="100000"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="installmentMonths">Number of Installments</Label>
              <Input
                id="installmentMonths"
                type="number"
                value={installmentMonths}
                onChange={(e) => setInstallmentMonths(e.target.value)}
                placeholder="42"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="possessionAmount">Possession Payment (PKR)</Label>
              <Input
                id="possessionAmount"
                type="number"
                value={possessionAmount}
                onChange={(e) => setPossessionAmount(e.target.value)}
                placeholder="500000"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Possession Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !possessionDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {possessionDate ? format(possessionDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={possessionDate}
                    onSelect={setPossessionDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button onClick={generateLedger} disabled={isGeneratingLedger || !monthlyInstallment}>
              {isGeneratingLedger ? "Generating..." : "Generate Payment Ledger"}
            </Button>
            <Button variant="outline" onClick={addCustomEntry}>
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Entry
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Ledger */}
      {ledgerEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Ledger ({ledgerEntries.length} entries)</CardTitle>
            <CardDescription>Review and modify payment schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {ledgerEntries.map((entry, index) => (
                <div key={entry.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="text-sm font-medium w-8">{index + 1}</div>
                  
                  <div className="flex-1 grid gap-2 md:grid-cols-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {format(entry.dueDate, "dd/MM/yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={entry.dueDate}
                          onSelect={(date) => date && updateLedgerEntry(entry.id, 'dueDate', date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Input
                      type="number"
                      value={entry.amount}
                      onChange={(e) => updateLedgerEntry(entry.id, 'amount', parseFloat(e.target.value) || 0)}
                      placeholder="Amount"
                      size={20}
                    />
                    
                    <Input
                      value={entry.description}
                      onChange={(e) => updateLedgerEntry(entry.id, 'description', e.target.value)}
                      placeholder="Description"
                    />
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(entry.type)} variant="secondary">
                        {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLedgerEntry(entry.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Total Amount:</span>
              <span className="text-lg font-bold">
                {formatCurrency(ledgerEntries.reduce((sum, entry) => sum + entry.amount, 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NewSale;
