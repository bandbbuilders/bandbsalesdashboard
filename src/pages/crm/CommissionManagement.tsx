import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Lock, TrendingUp, Users, DollarSign, Home, Calendar, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from "date-fns";

const CORRECT_PASSWORD = "b&bcom1";

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
  const [salesCount, setSalesCount] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isAuthenticated) fetchCommissions();
  }, [isAuthenticated]);

  const handlePasswordSubmit = () => {
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      toast({ title: "Access Granted", description: "Welcome to Commission Management" });
    } else {
      toast({ title: "Access Denied", description: "Incorrect password", variant: "destructive" });
    }
  };

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const { data: commissionsData } = await supabase.from('commissions').select(`*, sale:sales(id, unit_number, unit_total_price, customer:customers(name))`).order('created_at', { ascending: false });
      const { data: ledgerData } = await supabase.from('ledger_entries').select('*').order('due_date', { ascending: true });

      const processed = (commissionsData || []).map((c: any) => {
        const saleLedger = ledgerData?.filter(l => l.sale_id === c.sale_id) || [];
        const downpayments = saleLedger.filter(l => l.entry_type === 'downpayment');
        const lastDP = downpayments[downpayments.length - 1];
        const installments = saleLedger.filter(l => l.entry_type === 'installment');
        const secondInst = installments[1];

        let next_release_date = null, next_release_amount = 0;
        if (c.status_70_percent === 'pending' && lastDP) { next_release_date = lastDP.due_date; next_release_amount = c.amount_70_percent; }
        else if (c.status_30_percent === 'pending' && secondInst) { next_release_date = secondInst.due_date; next_release_amount = c.amount_30_percent; }
        return { ...c, next_release_date, next_release_amount };
      });
      setCommissions(processed);

      const counts: Record<string, number> = {};
      const unique: Record<string, Set<string>> = {};
      processed.forEach((c: any) => { if (c.recipient_type !== 'coo') { if (!unique[c.recipient_name]) unique[c.recipient_name] = new Set(); unique[c.recipient_name].add(c.sale_id); } });
      Object.entries(unique).forEach(([name, sales]) => { counts[name] = sales.size; });
      setSalesCount(counts);
    } catch (error) { console.error(error); toast({ title: "Error", description: "Failed to load", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedCommission || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    const pending = (selectedCommission.status_70_percent === 'pending' ? selectedCommission.amount_70_percent : 0) + (selectedCommission.status_30_percent === 'pending' ? selectedCommission.amount_30_percent : 0);
    try {
      const updates: any = {};
      if (amount >= pending) { if (selectedCommission.status_70_percent === 'pending') { updates.status_70_percent = 'released'; updates.released_70_date = new Date().toISOString().split('T')[0]; } if (selectedCommission.status_30_percent === 'pending') { updates.status_30_percent = 'released'; updates.released_30_date = new Date().toISOString().split('T')[0]; } }
      else if (amount >= selectedCommission.amount_70_percent && selectedCommission.status_70_percent === 'pending') { updates.status_70_percent = 'released'; updates.released_70_date = new Date().toISOString().split('T')[0]; }
      if (Object.keys(updates).length > 0) await supabase.from('commissions').update(updates).eq('id', selectedCommission.id);
      await supabase.from('journal_entries').insert({ date: new Date().toISOString().split('T')[0], description: `Commission paid to ${selectedCommission.recipient_name}`, debit_account: 'Commission Expense', credit_account: 'Cash', amount });
      toast({ title: amount >= pending ? "Fully Paid" : "Payment Recorded", description: `PKR ${amount.toLocaleString()} paid` });
      setPaymentDialogOpen(false); fetchCommissions();
    } catch (error) { toast({ title: "Error", description: "Failed to process", variant: "destructive" }); }
  };

  const getStatus = (c: any) => { const p70 = c.status_70_percent === 'released', p30 = c.status_30_percent === 'released'; if (p70 && p30) return { label: 'Fully Paid', color: 'bg-green-600' }; if (p70 || p30) return { label: 'Outstanding', color: 'bg-orange-500' }; return { label: 'Pending', color: 'bg-gray-500' }; };

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center"><div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4"><Lock className="h-6 w-6 text-primary" /></div><CardTitle className="text-2xl">Commission Management</CardTitle><CardDescription>Enter password to access</CardDescription></CardHeader>
        <CardContent className="space-y-4"><div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()} /></div><Button onClick={handlePasswordSubmit} className="w-full">Access</Button><Button variant="outline" onClick={() => navigate("/")} className="w-full">Back to Home</Button></CardContent>
      </Card>
    </div>
  );

  const totalComm = commissions.reduce((s, c) => s + parseFloat(c.total_amount), 0);
  const totalPaid = commissions.reduce((s, c) => s + (c.status_70_percent === 'released' ? parseFloat(c.amount_70_percent) : 0) + (c.status_30_percent === 'released' ? parseFloat(c.amount_30_percent) : 0), 0);
  const recipientData = commissions.reduce((acc: any, c) => { if (!acc[c.recipient_name]) acc[c.recipient_name] = { total: 0, paid: 0, type: c.recipient_type, sales: salesCount[c.recipient_name] || 0 }; acc[c.recipient_name].total += parseFloat(c.total_amount); if (c.status_70_percent === 'released') acc[c.recipient_name].paid += parseFloat(c.amount_70_percent); if (c.status_30_percent === 'released') acc[c.recipient_name].paid += parseFloat(c.amount_30_percent); return acc; }, {});
  const barData = Object.entries(recipientData).map(([name, d]: any) => ({ name, paid: d.paid, pending: d.total - d.paid, sales: d.sales })).sort((a, b) => (b.paid + b.pending) - (a.paid + a.pending)).slice(0, 10);
  const pieData = Object.values(commissions.reduce((acc: any, c) => { if (!acc[c.recipient_type]) acc[c.recipient_type] = { name: c.recipient_type.toUpperCase(), value: 0 }; acc[c.recipient_type].value += parseFloat(c.total_amount); return acc; }, {}));
  const COLORS = ['#B40202', '#F59E0B', '#10B981'];
  const upcoming = commissions.filter(c => c.next_release_date && c.next_release_amount > 0).sort((a, b) => new Date(a.next_release_date).getTime() - new Date(b.next_release_date).getTime()).slice(0, 5);
  const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">Commission Management</h1><p className="text-muted-foreground">Track all commission payments</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => navigate("/")}><Home className="h-4 w-4 mr-2" />Home</Button><Button variant="outline" onClick={() => { setIsAuthenticated(false); setPassword(""); }}>Logout</Button></div></div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">Total Commissions</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(totalComm)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">Paid</CardTitle><CheckCircle className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{fmt(totalPaid)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">Outstanding</CardTitle><TrendingUp className="h-4 w-4 text-orange-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{fmt(totalComm - totalPaid)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">Recipients</CardTitle><Users className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold">{Object.keys(recipientData).length}</div></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Next Commission Releases</CardTitle></CardHeader><CardContent>{upcoming.length > 0 ? <div className="space-y-3">{upcoming.map(c => <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg"><div><p className="font-medium">{c.recipient_name}</p><p className="text-sm text-muted-foreground">{c.sale?.unit_number}</p></div><div className="text-right"><p className="font-semibold text-primary">{fmt(c.next_release_amount)}</p><p className="text-sm text-muted-foreground">{format(new Date(c.next_release_date), 'dd MMM yyyy')}</p></div></div>)}</div> : <p className="text-muted-foreground text-center py-4">No upcoming releases</p>}</CardContent></Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Commission by Recipient</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={barData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v: number) => fmt(v)} /><Legend /><Bar dataKey="paid" fill="#10B981" name="Paid" stackId="a" /><Bar dataKey="pending" fill="#F59E0B" name="Pending" stackId="a" /></BarChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>By Type</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={pieData} cx="50%" cy="50%" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} dataKey="value">{pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => fmt(v)} /></PieChart></ResponsiveContainer></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Agent & Dealer Performance</CardTitle></CardHeader><CardContent><div className="grid gap-4 md:grid-cols-3">{Object.entries(recipientData).filter(([, d]: any) => d.type !== 'coo').map(([name, d]: any) => <Card key={name} className="border-2"><CardHeader className="pb-2"><CardTitle className="text-lg">{name}</CardTitle><Badge variant="outline">{d.sales} Sales</Badge></CardHeader><CardContent className="space-y-2"><div className="flex justify-between"><span className="text-muted-foreground">Total:</span><span className="font-semibold">{fmt(d.total)}</span></div><div className="flex justify-between text-green-600"><span>Paid:</span><span className="font-semibold">{fmt(d.paid)}</span></div><div className="flex justify-between text-orange-600"><span>Outstanding:</span><span className="font-semibold">{fmt(d.total - d.paid)}</span></div></CardContent></Card>)}</div></CardContent></Card>
      <Card><CardHeader><CardTitle>All Commissions</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Recipient</TableHead><TableHead>Type</TableHead><TableHead>Sale</TableHead><TableHead>Amount</TableHead><TableHead>Next Release</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{commissions.map(c => { const s = getStatus(c); return <TableRow key={c.id}><TableCell className="font-medium">{c.recipient_name}</TableCell><TableCell><Badge variant="outline">{c.recipient_type.toUpperCase()}</Badge></TableCell><TableCell><div className="font-medium">{c.sale?.unit_number}</div><div className="text-sm text-muted-foreground">{c.sale?.customer?.name}</div></TableCell><TableCell className="font-medium">{fmt(parseFloat(c.total_amount))}</TableCell><TableCell>{c.next_release_date && c.next_release_amount > 0 ? <div><div className="font-medium">{fmt(c.next_release_amount)}</div><div className="text-sm text-muted-foreground">{format(new Date(c.next_release_date), 'dd MMM yyyy')}</div></div> : '-'}</TableCell><TableCell><Badge className={s.color}>{s.label}</Badge></TableCell><TableCell>{(c.status_70_percent === 'pending' || c.status_30_percent === 'pending') && <Button size="sm" variant="outline" onClick={() => { setSelectedCommission(c); setPaymentAmount(""); setPaymentDialogOpen(true); }}>Paid</Button>}</TableCell></TableRow>; })}</TableBody></Table></CardContent></Card>
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}><DialogContent><DialogHeader><DialogTitle>Record Payment</DialogTitle><DialogDescription>Enter amount paid to {selectedCommission?.recipient_name}</DialogDescription></DialogHeader>{selectedCommission && <div className="space-y-4 py-4"><div className="p-3 bg-muted rounded-lg space-y-2"><div className="flex justify-between"><span>Total:</span><span className="font-semibold">{fmt(parseFloat(selectedCommission.total_amount))}</span></div><div className="flex justify-between"><span>70%:</span><span className={selectedCommission.status_70_percent === 'released' ? 'text-green-600' : ''}>{fmt(parseFloat(selectedCommission.amount_70_percent))}{selectedCommission.status_70_percent === 'released' && ' (Paid)'}</span></div><div className="flex justify-between"><span>30%:</span><span className={selectedCommission.status_30_percent === 'released' ? 'text-green-600' : ''}>{fmt(parseFloat(selectedCommission.amount_30_percent))}{selectedCommission.status_30_percent === 'released' && ' (Paid)'}</span></div></div><div className="space-y-2"><Label>Amount Paid (PKR)</Label><Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Enter amount" /></div></div>}<DialogFooter><Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button><Button onClick={handlePaymentSubmit} disabled={!paymentAmount}>Record Payment</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
};

export default CommissionManagement;
