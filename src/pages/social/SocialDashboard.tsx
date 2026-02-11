import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
    Users,
    Heart,
    MessageSquare,
    TrendingUp,
    Facebook,
    Instagram,
    Youtube,
    BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

export default function SocialDashboard() {
    const [stats, setStats] = useState({
        totalFollowers: 0,
        totalEngagement: 0,
        totalLeads: 0,
        newLeadsToday: 0
    });

    const [recentLeads, setRecentLeads] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        // Mock data for initial view or fetch from new tables
        const { data: leads } = await supabase
            .from('social_leads' as any)
            .select('*')
            .order('captured_at', { ascending: false })
            .limit(10);

        setRecentLeads(leads || []);

        // In a real scenario, we'd aggregate metrics here
        setStats({
            totalFollowers: 12450,
            totalEngagement: 2840,
            totalLeads: leads?.length || 45,
            newLeadsToday: 3
        });
    };

    const platforms = [
        { name: 'Facebook', icon: Facebook, color: 'text-blue-600', followers: '5.2k', growth: '+12%' },
        { name: 'Instagram', icon: Instagram, color: 'text-pink-600', followers: '4.8k', growth: '+18%' },
        { name: 'YouTube', icon: Youtube, color: 'text-red-600', followers: '2.1k', growth: '+5%' },
        { name: 'TikTok', icon: MessageSquare, color: 'text-black', followers: '350', growth: '+25%' },
    ];

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalFollowers.toLocaleString()}</div>
                        <p className="text-xs text-green-500 font-medium">+2.5% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                        <Heart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4.2%</div>
                        <p className="text-xs text-muted-foreground">Across all platforms</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalLeads}</div>
                        <p className="text-xs text-muted-foreground">{stats.newLeadsToday} new from today</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lead Conv. Rate</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12.5%</div>
                        <p className="text-xs text-muted-foreground">From social interactions</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-7">
                {/* Platform Performance */}
                <Card className="md:col-span-4">
                    <CardHeader>
                        <CardTitle>Platform Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {platforms.map((p) => (
                                <div key={p.name} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <p.icon className={cn("h-5 w-5", p.color)} />
                                        <div>
                                            <p className="font-medium">{p.name}</p>
                                            <p className="text-xs text-muted-foreground">Business Account</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{p.followers}</p>
                                        <p className="text-xs text-green-500">{p.growth}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Social Leads */}
                <Card className="md:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Recent Leads</CardTitle>
                        <Badge variant="outline">Live Feed</Badge>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-4">
                                {recentLeads.length > 0 ? (
                                    recentLeads.map((lead) => (
                                        <div key={lead.id} className="flex flex-col gap-1 border-b pb-3 last:border-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-sm">{lead.commenter_name}</p>
                                                <Badge variant={lead.intent_score === 'high' ? 'destructive' : lead.intent_score === 'medium' ? 'default' : 'secondary'}>
                                                    {lead.intent_score}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                "{lead.comment_content}"
                                            </p>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    {lead.platform === 'facebook' && <Facebook className="h-3 w-3" />}
                                                    {lead.platform === 'instagram' && <Instagram className="h-3 w-3" />}
                                                    {lead.platform.toUpperCase()} • {format(new Date(lead.captured_at), 'MMM d, HH:mm')}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground text-sm">
                                        No leads captured yet.
                                        <p className="text-xs">(Sync your accounts to start)</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
