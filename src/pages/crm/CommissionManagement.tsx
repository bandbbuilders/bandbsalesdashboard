import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Lock, TrendingUp, Users, DollarSign, Home, Calendar, CheckCircle, FileText, MoreHorizontal } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ceoSignature from "@/assets/ceo-signature-new.png";
import bbBuildersLogo from "@/assets/bb-builders-logo.png";
import { numberToWords } from "@/lib/numberToWords";
import ChatWidget from "@/components/chat/ChatWidget";

const CORRECT_PASSWORD = "b&bcom1";

// Inhouse agents get the 50/50 release rule
const INHOUSE_AGENTS = ["Zain Sarwar", "Sara memon", "Zia shahid"];

const CommissionManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesCount, setSalesCount] = useState<Record<string, number>>({});
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Auto-authenticate COO and Zia Shahid
  useEffect(() => {
    const checkAutoAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const allowedUserIds = [
          'fab190bd-3c71-43e8-9385-3ec66044e501', // Zain Sarwar (COO)
          'e91f0415-009a-4712-97e1-c70d1c29e6f9'  // Zia Shahid
        ];
        if (allowedUserIds.includes(session.user.id)) {
          setIsAuthenticated(true);
        }
      }
      setCheckingAccess(false);
    };
    checkAutoAccess();
  }, []);

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: commissionsData } = await supabase
        .from('commissions')
        .select(`*, sale:sales(id, unit_number, unit_total_price, customer:customers(name))`)
        .order('created_at', { ascending: false });
      const { data: ledgerData } = await supabase
        .from('ledger_entries')
        .select('*')
        .order('due_date', { ascending: true });

      const processed = (commissionsData || []).map((c: any) => {
        const saleLedger = ledgerData?.filter(l => l.sale_id === c.sale_id) || [];
        const downpayments = saleLedger.filter(l => l.entry_type === 'downpayment');
        const installments = saleLedger.filter(l => l.entry_type === 'installment');

        const isDownpaymentCleared = downpayments.length > 0 && downpayments.every(dp => dp.status === 'paid');
        const paidInstallmentsCount = installments.filter(inst => inst.status === 'paid').length;
        const areTwoInstallmentsCleared = paidInstallmentsCount >= 2;

        const lastDP = downpayments[downpayments.length - 1];
        const next_release_date = lastDP?.due_date || null;

        const total_amount = parseFloat(c.total_amount);
        const paid_amount = parseFloat(c.paid_amount || 0);
        const outstanding = total_amount - paid_amount;

        const isInhouse = INHOUSE_AGENTS.some(name =>
          c.recipient_name.toLowerCase().includes(name.toLowerCase())
        );

        let releasable_amount = total_amount;
        let release_conditions = "";

        if (isInhouse) {
          releasable_amount = 0;
          const conditions: string[] = [];

          if (isDownpaymentCleared) {
            releasable_amount += total_amount * 0.5;
          } else {
            conditions.push("Downpayment");
          }

          if (areTwoInstallmentsCleared) {
            releasable_amount += total_amount * 0.5;
          } else {
            conditions.push("2 Installments");
          }

          release_conditions = conditions.length > 0
            ? `Awaiting: ${conditions.join(", ")}`
            : "All Conditions Met";
        }

        return {
          ...c,
          next_release_date,
          paid_amount,
          outstanding,
          releasable_amount,
          isInhouse,
          release_conditions,
          isDownpaymentCleared,
          areTwoInstallmentsCleared,
        };
      });

      setCommissions(processed);

      const unique: Record<string, Set<string>> = {};
      processed.forEach((c: any) => {
        if (c.recipient_type !== 'coo') {
          if (!unique[c.recipient_name]) unique[c.recipient_name] = new Set();
          unique[c.recipient_name].add(c.sale_id);
        }
      });
      const counts: Record<string, number> = {};
      Object.entries(unique).forEach(([name, sales]) => { counts[name] = sales.size; });
      setSalesCount(counts);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAuthenticated) fetchCommissions();
  }, [isAuthenticated, fetchCommissions]);

  const handlePasswordSubmit = () => {
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      toast({ title: "Access Granted", description: "Welcome to Commission Management" });
    } else {
      toast({ title: "Access Denied", description: "Incorrect password", variant: "destructive" });
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedCommission || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    const currentPaid = parseFloat(selectedCommission.paid_amount || 0);
    const newPaidAmount = currentPaid + amount;

    // Enforce releasable amount for inhouse agents
    if (selectedCommission.isInhouse && newPaidAmount > selectedCommission.releasable_amount + 0.01) {
      toast({
        title: "Payment Restricted",
        description: `Only PKR ${selectedCommission.releasable_amount.toLocaleString()} is currently releasable for this inhouse agent. Half is released on downpayment clearance, half after 2 installments.`,
        variant: "destructive"
      });
      return;
    }

    try {
      await supabase.from('commissions').update({ paid_amount: newPaidAmount }).eq('id', selectedCommission.id);
      await supabase.from('journal_entries').insert({
        date: paymentDate,
        description: `Commission paid to ${selectedCommission.recipient_name}`,
        debit_account: 'Commission Expense',
        credit_account: 'Cash',
        amount
      });

      const outstanding = parseFloat(selectedCommission.total_amount) - newPaidAmount;
      toast({
        title: outstanding <= 0 ? "Fully Paid" : "Payment Recorded",
        description: outstanding <= 0
          ? `Commission fully paid - PKR ${amount.toLocaleString()}`
          : `PKR ${amount.toLocaleString()} paid. Outstanding: PKR ${outstanding.toLocaleString()}`
      });

      setPaymentDialogOpen(false);
      fetchCommissions();
    } catch (error) {
      toast({ title: "Error", description: "Failed to process", variant: "destructive" });
    }
  };

  const generateReceiving = async () => {
    if (!selectedCommission || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);

    try {
      const doc = new jsPDF();
      const primaryColor = [180, 2, 2] as [number, number, number];

      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('B&B BUILDERS', 105, 20, { align: 'center' });

      doc.setFontSize(14);
      doc.text('COMMISSION PAYMENT RECEIPT', 105, 30, { align: 'center' });

      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      let yPos = 50;
      doc.text(`Receipt Date: ${format(new Date(paymentDate), 'dd MMMM yyyy')}`, 20, yPos);
      yPos += 10;
      doc.text(`Recipient: ${selectedCommission.recipient_name}`, 20, yPos);
      yPos += 7;
      doc.text(`Type: ${selectedCommission.recipient_type.toUpperCase()}`, 20, yPos);
      yPos += 7;
      doc.text(`Sale: ${selectedCommission.sale?.unit_number || 'N/A'}`, 20, yPos);
      yPos += 7;
      doc.text(`Customer: ${selectedCommission.sale?.customer?.name || 'N/A'}`, 20, yPos);
      yPos += 15;

      autoTable(doc, {
        startY: yPos,
        head: [['Description', 'Amount (PKR)']],
        body: [
          ['Commission Payment', amount.toLocaleString()],
          ['Amount in Words', numberToWords(amount)],
        ],
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] as [number, number, number] },
        styles: { fontSize: 10 },
        columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 70, halign: 'right' } },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 20;

      const signatureImg = new Image();
      signatureImg.src = ceoSignature;
      await new Promise((resolve) => { signatureImg.onload = resolve; });
      doc.addImage(signatureImg, 'PNG', 20, finalY, 50, 20);

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(20, finalY + 22, 70, finalY + 22);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Abdullah Shah', 20, finalY + 28);
      doc.setFont('helvetica', 'bold');
      doc.text('CEO', 20, finalY + 33);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${format(new Date(paymentDate), 'dd/MM/yyyy')}`, 20, finalY + 38);

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(130, finalY + 22, 190, finalY + 22);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(selectedCommission.recipient_name, 130, finalY + 28);
      doc.setFont('helvetica', 'bold');
      doc.text(selectedCommission.recipient_type.toUpperCase(), 130, finalY + 33);
      doc.setFont('helvetica', 'normal');
      doc.text('(Signature)', 130, finalY + 38);

      const logoImg = new Image();
      logoImg.src = bbBuildersLogo;
      await new Promise((resolve) => { logoImg.onload = resolve; });

      const logoSize = 50;
      const centerX = 105;
      const centerY = finalY + 25;
      const angle = -30 * Math.PI / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      (doc as any).internal.write('q');
      (doc as any).internal.write(`${cos.toFixed(4)} ${sin.toFixed(4)} ${(-sin).toFixed(4)} ${cos.toFixed(4)} ${centerX.toFixed(2)} ${centerY.toFixed(2)} cm`);
      doc.addImage(logoImg, 'PNG', -logoSize / 2, -logoSize / 2, logoSize, logoSize);
      (doc as any).internal.write('Q');

      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.3);
      doc.line(20, finalY + 55, 190, finalY + 55);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Thank you for choosing B&B Builders!', 105, finalY + 63, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const endingNote = 'We appreciate your trust in us for your property investment. For any queries, please feel free to contact us.';
      const splitNote = doc.splitTextToSize(endingNote, 170);
      doc.text(splitNote, 105, finalY + 70, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('B&B Builders - Building Your Dreams with Excellence', 105, finalY + 85, { align: 'center' });

      doc.save(`Commission_Receipt_${selectedCommission.recipient_name}_${paymentDate}.pdf`);
      toast({ title: "Success", description: "Receipt generated and downloaded" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to generate receipt", variant: "destructive" });
    }
  };

  const getStatus = (c: any) => {
    const paid = parseFloat(c.paid_amount || 0);
    const total = parseFloat(c.total_amount);
    if (paid >= total) return { label: 'Fully Paid', color: 'bg-green-600' };
    if (paid > 0) return { label: 'Outstanding', color: 'bg-orange-500' };
    return { label: 'Pending', color: 'bg-gray-500' };
  };

  if (checkingAccess) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Commission Management</CardTitle>
          <CardDescription>Enter password to access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()} />
          </div>
          <Button onClick={handlePasswordSubmit} className="w-full">Access</Button>
          <Button variant="outline" onClick={() => navigate("/")} className="w-full">Back to Home</Button>
        </CardContent>
      </Card>
    </div>
  );

  const totalComm = commissions.reduce((s, c) => s + parseFloat(c.total_amount), 0);
  const totalPaid = commissions.reduce((s, c) => s + parseFloat(c.paid_amount || 0), 0);
  const totalOutstanding = totalComm - totalPaid;

  const recipientData = commissions.reduce((acc: any, c) => {
    if (!acc[c.recipient_name]) acc[c.recipient_name] = { total: 0, paid: 0, type: c.recipient_type, sales: salesCount[c.recipient_name] || 0 };
    acc[c.recipient_name].total += parseFloat(c.total_amount);
    acc[c.recipient_name].paid += parseFloat(c.paid_amount || 0);
    return acc;
  }, {});

  const barData = Object.entries(recipientData).map(([name, d]: any) => ({
    name,
    paid: d.paid,
    outstanding: d.total - d.paid,
    sales: d.sales
  })).sort((a, b) => (b.paid + b.outstanding) - (a.paid + a.outstanding)).slice(0, 10);

  const pieData = Object.values(commissions.reduce((acc: any, c) => {
    if (!acc[c.recipient_type]) acc[c.recipient_type] = { name: c.recipient_type.toUpperCase(), value: 0 };
    acc[c.recipient_type].value += parseFloat(c.total_amount);
    return acc;
  }, {}));

  const COLORS = ['#B40202', '#F59E0B', '#10B981'];

  const upcoming = commissions
    .filter(c => c.next_release_date && c.outstanding > 0)
    .sort((a, b) => new Date(a.next_release_date).getTime() - new Date(b.next_release_date).getTime())
    .slice(0, 5);

  const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Commission Management</h1>
          <p className="text-muted-foreground">Track all commission payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/")}>
            <Home className="h-4 w-4 mr-2" />Home
          </Button>
          <Button variant="outline" onClick={() => { setIsAuthenticated(false); setPassword(""); }}>
            Logout
          </Button>
        </div>
      </div>

      {/* Inhouse agent note */}
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200">
        <strong>Inhouse Agent Policy:</strong> Commissions for <strong>Zain Sarwar, Sara Memon & Zia Shahid</strong> are released in two equal halves — <strong>50%</strong> upon downpayment clearance and <strong>50%</strong> after 2 installments are paid.
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(totalComm)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{fmt(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Outstanding</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{fmt(totalOutstanding)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Recipients</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(recipientData).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />Next Commission Releases
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{c.recipient_name}</p>
                    <p className="text-sm text-muted-foreground">{c.sale?.unit_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{fmt(c.outstanding)}</p>
                    <p className="text-sm text-muted-foreground">{format(new Date(c.next_release_date), 'dd MMM yyyy')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No upcoming releases</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Commission by Recipient</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="paid" fill="#10B981" name="Paid" stackId="a" />
                <Bar dataKey="outstanding" fill="#F59E0B" name="Outstanding" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>By Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* COO Commission Stats */}
      {(() => {
        const cooData = recipientData['Zain Sarwar'];
        if (!cooData) return null;
        const cooOutstanding = cooData.total - cooData.paid;
        return (
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                COO Commission - Zain Sarwar
              </CardTitle>
              <CardDescription>Chief Operating Officer commission overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-background border">
                  <p className="text-sm text-muted-foreground">Total Commission</p>
                  <p className="text-2xl font-bold">{fmt(cooData.total)}</p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-600">Paid Commission</p>
                  <p className="text-2xl font-bold text-green-600">{fmt(cooData.paid)}</p>
                </div>
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-orange-600">Outstanding Commission</p>
                  <p className="text-2xl font-bold text-orange-600">{fmt(cooOutstanding)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      <Card>
        <CardHeader><CardTitle>Agent & Dealer Performance</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(recipientData).filter(([, d]: any) => d.type !== 'coo').map(([name, d]: any) => (
              <Card key={name} className="border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{name}</CardTitle>
                  <Badge variant="outline">{d.sales} Sales</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-semibold">{fmt(d.total)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Paid:</span>
                    <span className="font-semibold">{fmt(d.paid)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>Outstanding:</span>
                    <span className="font-semibold">{fmt(d.total - d.paid)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All Commissions</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Sale</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Releasable</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead>Conditions</TableHead>
                      <TableHead>Release Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map(c => {
                      const s = getStatus(c);
                      const outstanding = parseFloat(c.total_amount) - parseFloat(c.paid_amount || 0);
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.recipient_name}</TableCell>
                          <TableCell><Badge variant="outline">{c.recipient_type.toUpperCase()}</Badge></TableCell>
                          <TableCell>
                            <div className="font-medium">{c.sale?.unit_number}</div>
                            <div className="text-sm text-muted-foreground">{c.sale?.customer?.name}</div>
                          </TableCell>
                          <TableCell className="font-medium">{fmt(parseFloat(c.total_amount))}</TableCell>
                          <TableCell className="font-medium text-blue-600">{fmt(c.releasable_amount)}</TableCell>
                          <TableCell className="text-green-600 font-medium">{fmt(parseFloat(c.paid_amount || 0))}</TableCell>
                          <TableCell className="text-orange-600 font-medium">{fmt(outstanding)}</TableCell>
                          <TableCell>
                            {c.isInhouse ? (
                              <div className={`text-xs px-2 py-1 rounded ${c.release_conditions === "All Conditions Met" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                                {c.release_conditions}
                              </div>
                            ) : <span className="text-muted-foreground text-xs">Standard</span>}
                          </TableCell>
                          <TableCell>
                            {c.next_release_date ? (
                              <div className="text-sm text-muted-foreground">{format(new Date(c.next_release_date), 'dd MMM yyyy')}</div>
                            ) : '-'}
                          </TableCell>
                          <TableCell><Badge className={s.color}>{s.label}</Badge></TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-10 w-10 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                {outstanding > 0 && (
                                  <DropdownMenuItem onClick={() => { setSelectedCommission(c); setPaymentAmount(""); setPaymentDate(new Date().toISOString().split('T')[0]); setPaymentDialogOpen(true); }}>
                                    <DollarSign className="mr-2 h-4 w-4" /> Record Payment
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => { setSelectedCommission(c); navigate(`/sales/${c.sale_id}/ledger`); }}>
                                  <FileText className="mr-2 h-4 w-4" /> View Ledger
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {commissions.map(c => {
                  const s = getStatus(c);
                  const outstanding = parseFloat(c.total_amount) - parseFloat(c.paid_amount || 0);
                  return (
                    <Card key={c.id} className="p-4 border shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="font-bold text-base">{c.recipient_name}</p>
                          <p className="text-sm text-muted-foreground">{c.sale?.customer?.name} · Unit {c.sale?.unit_number}</p>
                        </div>
                        <Badge className={`${s.color} shrink-0`}>{s.label}</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total</p>
                          <p className="font-bold">{fmt(parseFloat(c.total_amount))}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-green-600 uppercase font-semibold">Paid</p>
                          <p className="font-bold text-green-600">{fmt(parseFloat(c.paid_amount || 0))}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-orange-600 uppercase font-semibold">Balance</p>
                          <p className="font-bold text-orange-600">{fmt(outstanding)}</p>
                        </div>
                      </div>

                      {c.isInhouse && (
                        <div className={`text-xs px-2 py-1.5 rounded mb-3 ${c.release_conditions === "All Conditions Met" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                          {c.release_conditions}
                        </div>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" className="w-full h-11 text-sm font-semibold gap-2 bg-primary/5 hover:bg-primary/10">
                            <MoreHorizontal className="h-4 w-4" />
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[calc(100vw-3rem)] max-w-[280px] p-2">
                          <DropdownMenuLabel className="text-xs text-muted-foreground uppercase pb-2">Commission Actions</DropdownMenuLabel>
                          {outstanding > 0 && (
                            <DropdownMenuItem className="h-11" onClick={() => { setSelectedCommission(c); setPaymentAmount(""); setPaymentDate(new Date().toISOString().split('T')[0]); setPaymentDialogOpen(true); }}>
                              <DollarSign className="mr-3 h-4 w-4" /> Record Payment
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="h-11" onClick={() => { setSelectedCommission(c); navigate(`/sales/${c.sale_id}/ledger`); }}>
                            <FileText className="mr-3 h-4 w-4" /> View Ledger
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Enter payment details for {selectedCommission?.recipient_name}</DialogDescription>
          </DialogHeader>
          {selectedCommission && (
            <div className="space-y-4 py-4">
              {selectedCommission.isInhouse && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200">
                  <strong>Inhouse Agent:</strong> 50% released on downpayment clearance, 50% after 2 installments paid.
                  <div className="mt-1 flex gap-2 text-xs">
                    <span className={selectedCommission.isDownpaymentCleared ? "text-green-600" : "text-red-600"}>
                      DP: {selectedCommission.isDownpaymentCleared ? "✓ Cleared" : "✗ Pending"}
                    </span>
                    <span className={selectedCommission.areTwoInstallmentsCleared ? "text-green-600" : "text-red-600"}>
                      2 Installments: {selectedCommission.areTwoInstallmentsCleared ? "✓ Cleared" : "✗ Pending"}
                    </span>
                  </div>
                </div>
              )}
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Total Commission:</span>
                  <span className="font-semibold">{fmt(parseFloat(selectedCommission.total_amount))}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>Currently Releasable:</span>
                  <span className="font-semibold">{fmt(selectedCommission.releasable_amount)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Already Paid:</span>
                  <span className="font-semibold">{fmt(parseFloat(selectedCommission.paid_amount || 0))}</span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>Outstanding Releasable:</span>
                  <span className="font-semibold">{fmt(Math.max(0, selectedCommission.releasable_amount - parseFloat(selectedCommission.paid_amount || 0)))}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Amount Paid (PKR)</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Max: PKR ${Math.max(0, selectedCommission.releasable_amount - parseFloat(selectedCommission.paid_amount || 0)).toLocaleString()}`}
                />
              </div>
              {paymentAmount && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-orange-600">
                    <span>New Outstanding:</span>
                    <span className="font-semibold">
                      {fmt(Math.max(0, parseFloat(selectedCommission.total_amount) - parseFloat(String(selectedCommission.paid_amount || 0)) - parseFloat(paymentAmount || '0')))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button variant="outline" onClick={generateReceiving} disabled={!paymentAmount}>
              <FileText className="h-4 w-4 mr-2" />Generate Receiving
            </Button>
            <Button onClick={handlePaymentSubmit} disabled={!paymentAmount}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ChatWidget />
    </div>
  );
};

export default CommissionManagement;