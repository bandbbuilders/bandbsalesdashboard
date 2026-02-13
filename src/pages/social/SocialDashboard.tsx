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

    const [platformStats, setPlatformStats] = useState<Record<string, any>>({
        facebook: { followers: 0, engagement: 0, leads: 0, connected: false },
        instagram: { followers: 0, engagement: 0, leads: 0, connected: false },
        youtube: { followers: 0, engagement: 0, leads: 0, connected: false },
        tiktok: { followers: 0, engagement: 0, leads: 0, connected: false }
    });

    const [recentLeads, setRecentLeads] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        // 1. Fetch recent leads
        const { data: leads } = await supabase
            .from('social_leads' as any)
            .select('*')
            .order('captured_at', { ascending: false })
            .limit(10);

        setRecentLeads(leads || []);

        // 2. Aggregate Total Metrics
        const { data: accounts } = await supabase.from('social_accounts' as any).select('id, platform');

        // Stats per platform
        const newPlatformStats: Record<string, any> = {
            facebook: { followers: 0, engagement: 0, leads: 0, connected: false },
            instagram: { followers: 0, engagement: 0, leads: 0, connected: false },
            youtube: { followers: 0, engagement: 0, leads: 0, connected: false },
            tiktok: { followers: 0, engagement: 0, leads: 0, connected: false }
        };

        // Mark connected platforms
        (accounts as any[])?.forEach(acc => {
            if (newPlatformStats[acc.platform]) {
                newPlatformStats[acc.platform].connected = true;
            }
        });

        // Total Posts Engagement per account/platform
        const { data: posts } = await (supabase
            .from('social_posts' as any)
            .select('account_id, likes_count, comments_count, engagement_count') as any);

        let totalEng = 0;
        (posts as any[])?.forEach(p => {
            const acc = (accounts as any[])?.find(a => a.id === p.account_id);
            const eng = (p.likes_count || 0) + (p.comments_count || 0) + (p.engagement_count || 0);
            totalEng += eng;
            if (acc) {
                newPlatformStats[acc.platform].engagement += eng;
            }
        });

        // Leads per platform
        const { data: allLeads } = await (supabase
            .from('social_leads' as any)
            .select('platform, captured_at') as any);

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        let newToday = 0;

        (allLeads as any[])?.forEach(l => {
            if (newPlatformStats[l.platform]) {
                newPlatformStats[l.platform].leads++;
            }
            if (new Date(l.captured_at) >= startOfDay) {
                newToday++;
            }
        });

        // Followers per account
        const { data: metrics } = await (supabase
            .from('social_metrics' as any)
            .select('account_id, follower_count')
            .order('recorded_at', { ascending: false }) as any);

        const latestFollowers: Record<string, number> = {};
        (metrics as any[])?.forEach(m => {
            if (!latestFollowers[m.account_id]) {
                latestFollowers[m.account_id] = m.follower_count;
                const acc = (accounts as any[])?.find(a => a.id === m.account_id);
                if (acc) {
                    newPlatformStats[acc.platform].followers += m.follower_count;
                }
            }
        });

        const totalFollowers = Object.values(latestFollowers).reduce((a, b) => a + (b as number), 0);

        setPlatformStats(newPlatformStats);
        setStats({
            totalFollowers: totalFollowers || 0,
            totalEngagement: totalEng || 0,
            totalLeads: allLeads?.length || 0,
            newLeadsToday: newToday || 0
        });
    };

    const platforms = [
        { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
        { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
        { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-600' },
        { id: 'tiktok', name: 'TikTok', icon: MessageSquare, color: 'text-black' },
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
                        <p className="text-xs text-muted-foreground">Across all connected accounts</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
                        <Heart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalEngagement.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Likes & Comments</p>
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
                        <div className="text-2xl font-bold">
                            {stats.totalEngagement > 0 ? ((stats.totalLeads / stats.totalEngagement) * 100).toFixed(1) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Leads vs Interactions</p>
                    </CardContent>
                </Card>
            </div>

            {/* Platform Specific Breakdown */}
            <h3 className="text-lg font-semibold mt-8 mb-4">Platform Breakdown</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {platforms.map((p) => {
                    const pStat = platformStats[p.id] || { followers: 0, engagement: 0, leads: 0 };
                    return (
                        <Card key={p.id} className="relative overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <p.icon className={cn("h-5 w-5", p.color)} />
                                    <Badge variant={pStat.followers > 0 ? "default" : "secondary"} className="text-[10px]">
                                        {pStat.followers > 0 ? "Connected" : "Disconnected"}
                                    </Badge>
                                </div>
                                <CardTitle className="text-base mt-2">{p.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Followers</span>
                                        <span className="font-bold">{pStat.followers.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Engagement</span>
                                        <span className="font-bold">{pStat.engagement.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Leads</span>
                                        <span className="font-bold">{pStat.leads}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid gap-4 md:grid-cols-7 mt-8">
                {/* Recent Social Leads */}
                <Card className="md:col-span-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Live Lead Feed</CardTitle>
                        <Badge variant="outline">Recent Comments</Badge>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[350px] pr-4">
                            <div className="space-y-4">
                                {recentLeads.length > 0 ? (
                                    recentLeads.map((lead) => (
                                        <div key={lead.id} className="flex flex-col gap-1 border-b pb-3 last:border-0">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-sm">{lead.commenter_name}</p>
                                                    <Badge variant={lead.intent_score === 'high' ? 'destructive' : lead.intent_score === 'medium' ? 'default' : 'secondary'} className="text-[10px] h-4">
                                                        {lead.intent_score}
                                                    </Badge>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {format(new Date(lead.captured_at), 'MMM d, HH:mm')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 italic">
                                                "{lead.comment_content}"
                                            </p>
                                            <div className="flex items-center gap-1 mt-1 font-medium text-[10px] text-muted-foreground uppercase">
                                                {lead.platform === 'facebook' && <Facebook className="h-3 w-3" />}
                                                {lead.platform === 'instagram' && <Instagram className="h-3 w-3" />}
                                                {lead.platform}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 text-muted-foreground text-sm">
                                        No leads captured yet.
                                        <p className="text-xs mt-1">Connect your accounts and sync to import data.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Quick Actions / Tips */}
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle>Social Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                Growth Strategy
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                Your Instagram engagement is driving 80% of your leads. Focus on posting more Reels to increase reach.
                            </p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg border">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Lead Quality
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                High intent leads typically ask about "price", "location", or "availability". These are flagged automatically for you.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
