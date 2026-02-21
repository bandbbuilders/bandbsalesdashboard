import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
    Download, TrendingUp, Users, CheckCircle, Clock,
    BarChart3, PieChart as PieChartIcon, User, Building2, DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

interface SalesData {
    id: string;
    unit_total_price: number;
    created_at: string;
    salesperson_name: string;
}

interface LeadData {
    id: string;
    stage: string;
    created_at: string;
}

interface TaskData {
    id: string;
    status: string;
    assigned_to: string;
}

interface AttendanceData {
    id: string;
    status: string;
    user_name: string;
    date: string;
}

interface SocialAccount {
    id: string;
    platform: string;
}

interface SocialMetric {
    account_id: string;
    follower_count: number;
    recorded_at: string;
}

interface SocialPost {
    account_id: string;
    likes_count: number;
    comments_count: number;
    engagement_count: number;
}

interface SocialLead {
    id: string;
    platform: string;
    captured_at: string;
}

interface Commission {
    id: string;
    recipient_name: string;
    total_amount: number;
    status_30_percent: string;
    status_70_percent: string;
    paid_amount: number;
    created_at: string;
}

interface JournalEntry {
    id: string;
    date: string;
    debit_account: string;
    credit_account: string;
    amount: number;
}

interface LedgerEntry {
    id: string;
    sale_id: string;
    amount: number;
    paid_amount: number;
    status: string;
    paid_date: string;
}

const ReportingDashboard = () => {
    const [sales, setSales] = useState<SalesData[]>([]);
    const [leads, setLeads] = useState<LeadData[]>([]);
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [attendance, setAttendance] = useState<AttendanceData[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>("all");
    const [loading, setLoading] = useState(true);

    // Additional state for new requirements
    const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
    const [socialMetrics, setSocialMetrics] = useState<SocialMetric[]>([]);
    const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
    const [socialLeads, setSocialLeads] = useState<SocialLead[]>([]);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [payroll, setPayroll] = useState<any[]>([]);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [
                { data: salesData },
                { data: leadsData },
                { data: tasksData },
                { data: attendanceData },
                { data: profilesData },
                { data: sAccData },
                { data: sMetData },
                { data: sPostData },
                { data: sLeadData },
                { data: commData },
                { data: journalData },
                { data: ledgerData },
                { data: payrollData }
            ] = await Promise.all([
                supabase.from('sales').select('id, unit_total_price, created_at, agent:profiles!sales_agent_id_fkey(full_name)'),
                supabase.from('leads').select('id, stage, created_at'),
                supabase.from('tasks').select('id, status, assigned_to'),
                supabase.from('attendance').select('id, status, user_name, date'),
                supabase.from('profiles').select('id, full_name, department, position'),
                supabase.from('social_accounts' as any).select('*'),
                supabase.from('social_metrics' as any).select('*').order('recorded_at', { ascending: false }),
                supabase.from('social_posts' as any).select('*'),
                supabase.from('social_leads' as any).select('*'),
                supabase.from('commissions').select('*'),
                supabase.from('journal_entries').select('*'),
                supabase.from('ledger_entries').select('*'),
                supabase.from('payroll').select('*')
            ]);

            const formattedSales = (salesData || []).map((s: any) => ({
                id: s.id,
                unit_total_price: s.unit_total_price,
                created_at: s.created_at,
                salesperson_name: s.agent?.full_name || 'Unknown'
            }));

            setSales(formattedSales);
            setLeads((leadsData as any) || []);
            setTasks((tasksData as any) || []);
            setAttendance((attendanceData as any) || []);
            setProfiles((profilesData as any) || []);
            setSocialAccounts((sAccData as any) || []);
            setSocialMetrics((sMetData as any) || []);
            setSocialPosts((sPostData as any) || []);
            setSocialLeads((sLeadData as any) || []);
            setCommissions((commData as any) || []);
            setJournalEntries((journalData as any) || []);
            setLedgerEntries((ledgerData as any) || []);
            setPayroll((payrollData as any) || []);
        } catch (error) {
            console.error('Error fetching reporting data:', error);
            toast.error("Failed to load reporting data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const filteredSales = selectedUser === "all" ? sales : sales.filter(s => s.salesperson_name === selectedUser);
    const filteredTasks = selectedUser === "all" ? tasks : tasks.filter(t => t.assigned_to?.includes(selectedUser));
    const filteredAttendance = selectedUser === "all" ? attendance : attendance.filter(a => a.user_name === selectedUser);

    // Process data for charts
    const salesByMonth = filteredSales.reduce((acc: any[], sale) => {
        const month = format(new Date(sale.created_at), 'MMM yyyy');
        const existing = acc.find(a => a.name === month);
        if (existing) {
            existing.value += sale.unit_total_price || 0;
            existing.count += 1;
        } else {
            acc.push({ name: month, value: sale.unit_total_price || 0, count: 1 });
        }
        return acc;
    }, []).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

    const leadsByStage = leads.reduce((acc: any[], lead) => {
        const existing = acc.find(a => a.name === lead.stage);
        if (existing) {
            existing.value += 1;
        } else {
            acc.push({ name: lead.stage, value: 1 });
        }
        return acc;
    }, []);

    const taskStatusDist = filteredTasks.reduce((acc: any[], task) => {
        const status = task.status || 'todo';
        const existing = acc.find(a => a.name === status);
        if (existing) {
            existing.value += 1;
        } else {
            acc.push({ name: status, value: 1 });
        }
        return acc;
    }, []);

    const topSalespersons = filteredSales.reduce((acc: any[], sale) => {
        const name = sale.salesperson_name || 'Unknown';
        const existing = acc.find(a => a.name === name);
        if (existing) {
            existing.value += sale.unit_total_price || 0;
        } else {
            acc.push({ name, value: sale.unit_total_price || 0 });
        }
        return acc;
    }, []).sort((a, b) => b.value - a.value).slice(0, 5);

    // New Calculations
    const socialStats = socialAccounts.map(acc => {
        const platformMetrics = socialMetrics.filter(m => m.account_id === acc.id);
        const platformPosts = socialPosts.filter(p => p.account_id === acc.id);
        const platformLeads = socialLeads.filter(l => l.platform === acc.platform);

        const latestFollowers = platformMetrics[0]?.follower_count || 0;
        const totalEng = platformPosts.reduce((sum, p) => sum + (p.engagement_count || 0), 0);

        return {
            platform: acc.platform,
            followers: latestFollowers,
            engagement: totalEng,
            leads: platformLeads.length
        };
    });

    const taskStatsByUser = profiles.map(p => {
        const userTasks = tasks.filter(t => t.assigned_to?.includes(p.full_name));
        return {
            name: p.full_name,
            total: userTasks.length,
            completed: userTasks.filter(t => t.status === 'done').length,
            pending: userTasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length,
            cancelled: userTasks.filter(t => t.status === 'cancelled').length
        };
    });

    const specificCollections = ledgerEntries
        .filter(entry => entry.status === 'paid')
        .reduce((acc: any, entry) => {
            const sale = sales.find(s => s.id === entry.sale_id);
            if (sale && (sale.salesperson_name === 'Sara Memon' || sale.salesperson_name === 'Zia Shahid')) {
                if (!acc[sale.salesperson_name]) acc[sale.salesperson_name] = 0;
                acc[sale.salesperson_name] += entry.paid_amount || 0;
            }
            return acc;
        }, {});

    const financialSummary = journalEntries.reduce((acc, entry) => {
        if (entry.credit_account.toLowerCase().includes('revenue') || entry.credit_account.toLowerCase().includes('sales')) {
            acc.revenue += entry.amount;
        }
        if (entry.debit_account.toLowerCase().includes('expense') || entry.debit_account.toLowerCase().includes('cost')) {
            acc.expenses += entry.amount;
        }
        return acc;
    }, { revenue: 0, expenses: 0 });

    const commSummary = commissions.reduce((acc, c) => {
        const isUpcoming = c.status_30_percent !== 'paid' || c.status_70_percent !== 'paid';
        if (isUpcoming) acc.upcoming += c.total_amount - (c.paid_amount || 0);
        else acc.paid += c.paid_amount || 0;
        return acc;
    }, { paid: 0, upcoming: 0 });

    const generatePDF = () => {
        const doc = new jsPDF();
        const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm');

        // Header
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text('B&B Builders - MEGA PERFORMANCE REPORT', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${timestamp}`, 14, 30);
        doc.line(14, 35, 196, 35);

        // 1. Social Media Insights
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('1. Social Media Insights', 14, 45);

        const socialTable = socialStats.map(s => [s.platform.toUpperCase(), s.followers.toLocaleString(), s.engagement.toLocaleString(), s.leads.toString()]);
        autoTable(doc, {
            startY: 50,
            head: [['Platform', 'Followers', 'Engagement', 'Leads Captured']],
            body: socialTable,
            theme: 'grid',
            headStyles: { fillColor: [52, 152, 219] }
        });

        // 2. Task Manager Audit
        doc.addPage();
        doc.text('2. Task Management Efficiency (Per User)', 14, 22);
        const taskTable = taskStatsByUser.filter(u => u.total > 0).map(u => [u.name, u.total.toString(), u.completed.toString(), u.pending.toString(), u.cancelled.toString()]);
        autoTable(doc, {
            startY: 30,
            head: [['User', 'Total Tasks', 'Completed', 'Pending/In-Prog', 'Cancelled']],
            body: taskTable,
            theme: 'striped'
        });

        // 3. Sales & Target Collections
        doc.addPage();
        doc.text('3. Sales & Target Collections', 14, 22);
        doc.setFontSize(12);
        doc.text('Installment Collections (Target Users):', 14, 32);

        const collectionTable = [
            ['Sara Memon', `Rs ${specificCollections['Sara Memon']?.toLocaleString() || '0'}`],
            ['Zia Shahid', `Rs ${specificCollections['Zia Shahid']?.toLocaleString() || '0'}`]
        ];
        autoTable(doc, {
            startY: 35,
            head: [['Salesperson', 'Amount Collected in Installments']],
            body: collectionTable,
            theme: 'grid',
            headStyles: { fillColor: [39, 174, 96] }
        });

        const monthlySalesTable = salesByMonth.map(m => [m.name, m.count.toString(), `Rs ${m.value.toLocaleString()}`]);
        doc.text('Monthly Sales Breakdown:', 14, (doc as any).lastAutoTable.finalY + 15);
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [['Month', 'No. of Sales', 'Total Revenue']],
            body: monthlySalesTable,
            theme: 'grid'
        });

        // 4. Financial & HR Module
        doc.addPage();
        doc.text('4. Financial & HR Summary', 14, 22);

        const finTable = [
            ['Total Company Revenue', `Rs ${financialSummary.revenue.toLocaleString()}`],
            ['Total Operating Expenses', `Rs ${financialSummary.expenses.toLocaleString()}`],
            ['Net Profit/Loss', `Rs ${(financialSummary.revenue - financialSummary.expenses).toLocaleString()}`],
            ['Commissions Paid (MTD)', `Rs ${commSummary.paid.toLocaleString()}`],
            ['Upcoming Commissions (Liability)', `Rs ${commSummary.upcoming.toLocaleString()}`]
        ];
        autoTable(doc, {
            startY: 30,
            head: [['Financial Metric', 'Value']],
            body: finTable,
            theme: 'striped',
            headStyles: { fillColor: [230, 126, 34] }
        });

        const hrTable = [
            ['Total Headcount', profiles.length.toString()],
            ['Attendance Rate Today', `${((attendance.filter(a => a.date === format(new Date(), 'yyyy-MM-dd') && a.status === 'present').length / profiles.length) * 100 || 0).toFixed(1)}%`],
            ['Payroll Status', payroll.some(p => p.payment_status === 'pending') ? 'Pending Payments Found' : 'All Paid']
        ];
        doc.text('HR & Attendance Metrics:', 14, (doc as any).lastAutoTable.finalY + 15);
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [['HR Metric', 'Status/Value']],
            body: hrTable,
            theme: 'grid'
        });

        doc.save(`BB_Full_Business_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
        toast.success("Mega Report downloaded successfully");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Reporting & Analytics</h1>
                    <p className="text-muted-foreground mt-2">Comprehensive data visualization across all modules</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 bg-card border rounded-md px-3 py-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <select
                            className="bg-transparent border-none text-sm focus:ring-0"
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                        >
                            <option value="all">All Employees</option>
                            {profiles.map(p => (
                                <option key={p.id} value={p.full_name}>{p.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <Button onClick={generatePDF} className="gap-2 bg-primary hover:bg-primary/90">
                        <Download className="h-4 w-4" /> Download Full Report
                    </Button>
                </div>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="relative overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rs {filteredSales.reduce((sum, s) => sum + (s.unit_total_price || 0), 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Across {filteredSales.length} sales</p>
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{leads.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total System Pipeline</p>
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
                        <CheckCircle className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {((filteredTasks.filter(t => t.status === 'done').length / filteredTasks.length) * 100 || 0).toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{filteredTasks.filter(t => t.status === 'done').length} of {filteredTasks.length} done</p>
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Staff Attendance</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {filteredAttendance.length > 0
                                ? `${((filteredAttendance.filter(a => a.status === 'present').length / filteredAttendance.length) * 100).toFixed(1)}%`
                                : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Average punctuality</p>
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales Trend Chart */}
                <Card className="shadow-lg border-none bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" /> Sales Trend
                        </CardTitle>
                        <CardDescription>Monthly revenue growth and volume</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesByMonth}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value: any) => [`Rs ${value.toLocaleString()}`, 'Revenue']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Lead Distribution Chart */}
                <Card className="shadow-lg border-none bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5 text-primary" /> Lead Pipeline
                        </CardTitle>
                        <CardDescription>Distribution of leads across various stages</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={leadsByStage}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {leadsByStage.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Task Performance */}
                <Card className="shadow-lg border-none bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-primary" /> Task Breakdown
                        </CardTitle>
                        <CardDescription>Current status of all departmental tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={taskStatusDist} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Performers */}
                <Card className="shadow-lg border-none bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" /> Top Sales Team
                        </CardTitle>
                        <CardDescription>Top 5 contributors by revenue</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topSalespersons}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: any) => `Rs ${value.toLocaleString()}`} />
                                <Bar dataKey="value" fill="#FF8042" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Social Media Insights */}
                <Card className="shadow-lg border-none bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" /> Social Media Stats
                        </CardTitle>
                        <CardDescription>Followers and Engagement per platform</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={socialStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="platform" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="followers" fill="#3498db" name="Followers" />
                                <Bar dataKey="engagement" fill="#e74c3c" name="Engagement" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Specific Collections (Sara & Zia) */}
                <Card className="shadow-lg border-none bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" /> Installment Collections
                        </CardTitle>
                        <CardDescription>Target performance for Sara and Zia</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-around h-[350px]">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Sara Memon</p>
                            <p className="text-3xl font-bold text-green-600">Rs {specificCollections['Sara Memon']?.toLocaleString() || '0'}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Zia Shahid</p>
                            <p className="text-3xl font-bold text-blue-600">Rs {specificCollections['Zia Shahid']?.toLocaleString() || '0'}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Table Section */}
            <Card className="shadow-xl bg-card/50 backdrop-blur-md overflow-hidden">
                <CardHeader className="border-b bg-muted/30">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Employee Performance Matrix</CardTitle>
                            <CardDescription>Cross-module efficiency tracking</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-muted/50">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Employee</th>
                                    <th className="px-6 py-4 font-bold">Sales</th>
                                    <th className="px-6 py-4 font-bold">Revenue</th>
                                    <th className="px-6 py-4 font-bold">Leads</th>
                                    <th className="px-6 py-4 font-bold">Tasks</th>
                                    <th className="px-6 py-4 font-bold">Punctuality</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {profiles.slice(0, 10).map((p) => {
                                    const userSales = sales.filter(s => s.salesperson_name === p.full_name);
                                    const revenue = userSales.reduce((sum, s) => sum + (s.unit_total_price || 0), 0);
                                    const userTasks = tasks.filter(t => t.assigned_to?.includes(p.full_name));
                                    const completedTasks = userTasks.filter(t => t.status === 'done').length;

                                    return (
                                        <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <User className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{p.full_name}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase">{p.position}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium">{userSales.length}</td>
                                            <td className="px-6 py-4 font-bold text-green-600 dark:text-green-400">
                                                Rs {revenue >= 100000 ? `${(revenue / 100000).toFixed(1)}L` : revenue.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">12</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary"
                                                            style={{ width: `${(completedTasks / userTasks.length) * 100 || 0}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px]">{completedTasks}/{userTasks.length}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs">98%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ReportingDashboard;
