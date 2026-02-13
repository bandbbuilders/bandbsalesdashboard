import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Facebook,
    Instagram,
    Youtube,
    MessageSquare,
    TrendingUp,
    RefreshCw,
    Link as LinkIcon,
    CheckCircle2,
    Trash2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchInstagramMedia, fetchInstagramComments, discoverInstagramAccount, fetchInstagramConversations } from "@/lib/socialApi";

export default function SocialAccounts() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [showManualSetup, setShowManualSetup] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    // Manual setup state
    const [manualName, setManualName] = useState("");
    const [manualAccountId, setManualAccountId] = useState("");
    const [manualToken, setManualToken] = useState("");

    useEffect(() => {
        fetchAccounts();
    }, []);

    // Phase 6: Automated 1-minute sync
    useEffect(() => {
        const interval = setInterval(() => {
            accounts.forEach(acc => {
                if (acc.is_active && acc.platform === 'instagram') {
                    console.log(`Auto-syncing ${acc.platform} account...`);
                    handleManualSync(acc.id, true); // true for background sync
                }
            });
        }, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, [accounts]);

    const fetchAccounts = async () => {
        const { data } = await supabase
            .from('social_accounts' as any)
            .select('*');
        if (data) setAccounts(data);
    };

    const handleDisconnect = async (accountId: string) => {
        setConfirmDelete(null);

        const tid = toast.loading("Disconnecting account...");
        try {
            const { error } = await supabase
                .from('social_accounts' as any)
                .delete()
                .eq('id', accountId);

            if (error) throw error;

            toast.success("Account disconnected!", { id: tid });
            await fetchAccounts();
        } catch (error: any) {
            console.error("Disconnect error:", error);
            toast.error("Failed to disconnect", { id: tid, description: error.message });
        }
    };

    const handleConnect = async (platform: string, isManual = false) => {
        setIsConnecting(true);

        try {
            if (platform === 'instagram' && !isManual) {
                // Try real OAuth first
                const { data: settings } = await (supabase
                    .from("social_settings" as any)
                    .select("app_id, redirect_uri")
                    .eq("platform", "instagram")
                    .single() as any);

                if (settings?.app_id) {
                    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${settings.app_id}&redirect_uri=${settings.redirect_uri}&scope=user_profile,user_media&response_type=code`;
                    window.location.href = authUrl;
                    return;
                }

                // Fall back to manual setup if no app_id configured
                setShowManualSetup(platform);
                return;
            }

            if (!isManual && platform === 'facebook') {
                setShowManualSetup(platform);
                return;
            }

            const toastId = toast.loading(isManual ? `Setting up ${platform}...` : `Connecting to ${platform}...`, {
                description: "Connecting to the platform API."
            });

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            let accountData: any;

            if (isManual) {
                if (!manualName || !manualAccountId || !manualToken) {
                    throw new Error("Please fill in all fields.");
                }
                accountData = {
                    name: manualName,
                    accountId: manualAccountId,
                    token: manualToken,
                    username: manualAccountId.startsWith('@') ? manualAccountId : `@${manualAccountId}`
                };
            } else {
                const mockData: any = {
                    youtube: { name: "B&B Architecture TV", username: "bandb_tv" },
                    tiktok: { name: "B&B Construction Tips", username: "bandb_tips" }
                };
                const mock = mockData[platform] || { name: `${platform} Account`, username: platform };
                accountData = {
                    name: mock.name,
                    accountId: `mock_${platform}_${Date.now()}`,
                    token: "mock_token",
                    username: mock.username
                };
            }

            const { data, error } = await supabase
                .from('social_accounts' as any)
                .insert([{
                    user_id: user.id,
                    platform: platform,
                    account_name: accountData.name,
                    platform_account_id: accountData.accountId,
                    access_token: accountData.token,
                    username: accountData.username,
                    is_active: true,
                    last_synced_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            toast.success(`${accountData.name} connected!`, {
                id: toastId,
                description: "Your social leads are now being synced."
            });

            setShowManualSetup(null);
            setManualName("");
            setManualAccountId("");
            setManualToken("");

            await fetchAccounts();

        } catch (error: any) {
            console.error("Connect error:", error);
            toast.error("Connection failed", {
                description: error.message || "Please try again later."
            });
        } finally {
            setIsConnecting(false);
        }
    };

    const seedMockData = async (accountId: string, platform: string) => {
        const mockLeads = [
            {
                account_id: accountId,
                platform: platform,
                commenter_name: "Ahmed Khan",
                comment_content: "I'm interested in the new project in DHA Phase 6. Can you share the price list?",
                intent_score: "high",
                status: "new"
            },
            {
                account_id: accountId,
                platform: platform,
                commenter_name: "Sara Qureshi",
                comment_content: "Beautiful design! When is the completion date?",
                intent_score: "medium",
                status: "new"
            }
        ];
        await supabase.from('social_leads' as any).insert(mockLeads);
    };

    const handleManualSync = async (accountId: string, isBackground = false) => {
        const account = accounts.find(a => a.id === accountId);
        if (!account) {
            console.warn(`Sync failed: Account ${accountId} not found in state.`);
            return;
        }

        if (!isBackground) setIsSyncing(accountId);
        const tid = !isBackground ? toast.loading(`Syncing ${account.platform} data...`) : null;

        console.log(`Sync started for ${account.platform} (${accountId}). Background: ${isBackground}`);

        try {
            if (account.platform === 'instagram') {
                // 1. Fetch real media and profile
                const media = await fetchInstagramMedia(accountId);
                const profile = await (discoverInstagramAccount(accountId) as any);
                const conversations = await fetchInstagramConversations(accountId);

                console.log(`Fetched for ${account.platform}: ${media.length} media items, ${conversations.length} conversations.`);

                // 2. Save latest metrics (Followers)
                if (profile?.followers !== undefined) {
                    await (supabase
                        .from("social_metrics" as any)
                        .insert({
                            account_id: accountId,
                            follower_count: profile.followers,
                            recorded_at: new Date().toISOString()
                        }) as any);
                }

                // 3. Process Posts & Comments
                for (const item of media) {
                    const mappedMediaType = item.media_type?.toLowerCase() === 'carousel_album' ? 'carousel' : (item.media_type?.toLowerCase() || 'image');

                    await (supabase
                        .from("social_posts" as any)
                        .upsert({
                            account_id: accountId,
                            platform_post_id: item.id,
                            content: item.caption,
                            media_url: item.media_url,
                            media_type: mappedMediaType,
                            posted_at: item.timestamp,
                            likes_count: item.like_count || 0,
                            comments_count: item.comments_count || 0,
                        }, { onConflict: "account_id,platform_post_id" }) as any);

                    const comments = await fetchInstagramComments(item.id, account.access_token);
                    if (comments.length > 0) {
                        console.log(`Found ${comments.length} comments for post ${item.id}`);
                    }

                    for (const comment of comments) {
                        // Detect intent (Simple keywords)
                        const content = comment.text?.toLowerCase() || "";
                        let intent: 'low' | 'medium' | 'high' = 'low';
                        if (content.includes("price") || content.includes("how much") || content.includes("interested") || content.includes("location")) {
                            intent = 'high';
                        } else if (content.includes("info") || content.includes("contact")) {
                            intent = 'medium';
                        }

                        await (supabase
                            .from("social_leads" as any)
                            .upsert({
                                account_id: accountId,
                                platform: "instagram",
                                post_id: item.id,
                                comment_id: comment.id,
                                commenter_name: comment.from?.username || "Instagram User",
                                commenter_username: comment.from?.username,
                                comment_content: comment.text,
                                intent_score: intent,
                                captured_at: comment.timestamp,
                                status: "new"
                            }, { onConflict: "comment_id" }) as any);
                    }
                }

                // 4. Process Conversations (DMs)
                for (const conv of conversations) {
                    const lastMsg = conv.messages?.data?.[0];
                    if (!lastMsg) continue;

                    const participant = conv.participants?.data?.[0]; // Usually the sender

                    // Detect intent in message
                    const msgText = lastMsg.text?.toLowerCase() || "";
                    let msgIntent: 'low' | 'medium' | 'high' = 'low';
                    if (msgText.includes("price") || msgText.includes("buy") || msgText.includes("booking") || msgText.includes("appointment")) {
                        msgIntent = 'high';
                    }

                    await (supabase
                        .from("social_leads" as any)
                        .upsert({
                            account_id: accountId,
                            platform: "instagram",
                            comment_id: `msg_${lastMsg.id}`, // Reuse column for message ID
                            commenter_name: participant?.name || participant?.username || "IG User",
                            commenter_username: participant?.username,
                            comment_content: lastMsg.text,
                            intent_score: msgIntent,
                            captured_at: lastMsg.created_time,
                            status: "new"
                        }, { onConflict: "comment_id" }) as any);
                }

                await (supabase
                    .from("social_accounts" as any)
                    .update({ last_synced_at: new Date().toISOString() })
                    .eq("id", accountId) as any);

                if (!isBackground) toast.success("Instagram sync complete!", { id: tid });
                console.log(`Sync completed for ${account.platform}`);
            } else if (account.platform === 'facebook') {
                const { fetchFacebookMedia, fetchFacebookComments, fetchFacebookConversations } = await import("@/lib/socialApi");

                // 1. Fetch real media and conversations
                const media = await fetchFacebookMedia(accountId);
                const conversations = await fetchFacebookConversations(accountId);

                console.log(`Fetched for ${account.platform}: ${media.length} media items, ${conversations.length} conversations.`);

                // 2. Process Posts & Comments
                for (const item of media) {
                    await (supabase
                        .from("social_posts" as any)
                        .upsert({
                            account_id: accountId,
                            platform_post_id: item.id,
                            content: item.caption,
                            media_url: item.media_url,
                            media_type: item.media_type,
                            posted_at: item.timestamp,
                            likes_count: item.like_count || 0,
                            comments_count: item.comments_count || 0,
                        }, { onConflict: "account_id,platform_post_id" }) as any);

                    const comments = await fetchFacebookComments(item.id, account.access_token);
                    for (const comment of comments) {
                        const content = comment.text?.toLowerCase() || "";
                        let intent: 'low' | 'medium' | 'high' = 'low';
                        if (content.includes("price") || content.includes("how much") || content.includes("interested") || content.includes("location")) {
                            intent = 'high';
                        } else if (content.includes("info") || content.includes("contact")) {
                            intent = 'medium';
                        }

                        await (supabase
                            .from("social_leads" as any)
                            .upsert({
                                account_id: accountId,
                                platform: "facebook",
                                post_id: item.id,
                                comment_id: comment.id,
                                commenter_name: comment.from?.username || "FB User",
                                commenter_username: comment.from?.username,
                                comment_content: comment.text,
                                intent_score: intent,
                                captured_at: comment.timestamp,
                                status: "new"
                            }, { onConflict: "comment_id" }) as any);
                    }
                }

                // 3. Process Conversations
                for (const conv of conversations) {
                    const lastMsg = conv.messages?.data?.[0];
                    if (!lastMsg) continue;
                    const participant = conv.participants?.data?.[0];
                    const msgText = lastMsg.text?.toLowerCase() || "";
                    let msgIntent: 'low' | 'medium' | 'high' = 'low';
                    if (msgText.includes("price") || msgText.includes("buy") || msgText.includes("booking") || msgText.includes("appointment")) {
                        msgIntent = 'high';
                    }

                    await (supabase
                        .from("social_leads" as any)
                        .upsert({
                            account_id: accountId,
                            platform: "facebook",
                            comment_id: `fb_msg_${lastMsg.id}`,
                            commenter_name: participant?.name || "FB User",
                            commenter_username: participant?.id,
                            comment_content: lastMsg.text,
                            intent_score: msgIntent,
                            captured_at: lastMsg.created_time,
                            status: "new"
                        }, { onConflict: "comment_id" }) as any);
                }

                await (supabase
                    .from("social_accounts" as any)
                    .update({ last_synced_at: new Date().toISOString() })
                    .eq("id", accountId) as any);

                if (!isBackground) toast.success("Facebook sync complete!", { id: tid });

                // 2. Process Posts & Comments
                for (const item of media) {
                    await (supabase
                        .from("social_posts" as any)
                        .upsert({
                            account_id: accountId,
                            platform_post_id: item.id,
                            content: item.caption,
                            media_url: item.media_url,
                            media_type: item.media_type,
                            posted_at: item.timestamp,
                            likes_count: item.like_count || 0,
                            comments_count: item.comments_count || 0,
                        }, { onConflict: "account_id,platform_post_id" }) as any);

                    const comments = await fetchFacebookComments(item.id, account.access_token);
                    for (const comment of comments) {
                        const content = comment.text?.toLowerCase() || "";
                        let intent: 'low' | 'medium' | 'high' = 'low';
                        if (content.includes("price") || content.includes("how much") || content.includes("interested") || content.includes("location")) {
                            intent = 'high';
                        } else if (content.includes("info") || content.includes("contact")) {
                            intent = 'medium';
                        }

                        await (supabase
                            .from("social_leads" as any)
                            .upsert({
                                account_id: accountId,
                                platform: "facebook",
                                post_id: item.id,
                                comment_id: comment.id,
                                commenter_name: comment.from?.username || "FB User",
                                commenter_username: comment.from?.username,
                                comment_content: comment.text,
                                intent_score: intent,
                                captured_at: comment.timestamp,
                                status: "new"
                            }, { onConflict: "comment_id" }) as any);
                    }
                }

                // 3. Process Conversations
                for (const conv of conversations) {
                    const lastMsg = conv.messages?.data?.[0];
                    if (!lastMsg) continue;
                    const participant = conv.participants?.data?.[0];
                    const msgText = lastMsg.text?.toLowerCase() || "";
                    let msgIntent: 'low' | 'medium' | 'high' = 'low';
                    if (msgText.includes("price") || msgText.includes("buy") || msgText.includes("booking") || msgText.includes("appointment")) {
                        msgIntent = 'high';
                    }

                    await (supabase
                        .from("social_leads" as any)
                        .upsert({
                            account_id: accountId,
                            platform: "facebook",
                            comment_id: `fb_msg_${lastMsg.id}`,
                            commenter_name: participant?.name || "FB User",
                            commenter_username: participant?.id,
                            comment_content: lastMsg.text,
                            intent_score: msgIntent,
                            captured_at: lastMsg.created_time,
                            status: "new"
                        }, { onConflict: "comment_id" }) as any);
                }

                await (supabase
                    .from("social_accounts" as any)
                    .update({ last_synced_at: new Date().toISOString() })
                    .eq("id", accountId) as any);

                if (!isBackground) toast.success("Facebook sync complete!", { id: tid });
            } else {
                if (!isBackground) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    toast.success("Sync complete", { id: tid });
                }
            }

            // Only refresh accounts if not background, or only every few times to avoid interval thrashing
            if (!isBackground) {
                await fetchAccounts();
            }
        } catch (error: any) {
            console.error("Sync error:", error);
            if (!isBackground && tid) toast.error("Sync failed", { id: tid, description: error.message });
        } finally {
            if (!isBackground) setIsSyncing(null);
        }
    };

    const platforms = [
        { id: 'facebook', name: 'Facebook Business', icon: Facebook, color: 'bg-blue-600' },
        { id: 'instagram', name: 'Instagram Business', icon: Instagram, color: 'bg-pink-600' },
        { id: 'youtube', name: 'YouTube Channel', icon: Youtube, color: 'bg-red-600' },
        { id: 'tiktok', name: 'TikTok for Business', icon: MessageSquare, color: 'bg-black' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                {platforms.map((p) => {
                    const connectedAccount = accounts.find(a => a.platform === p.id);

                    return (
                        <Card key={p.id}>
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                <div className={cn("p-2 rounded-lg text-white", p.color)}>
                                    <p.icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle>{p.name}</CardTitle>
                                    <CardDescription>
                                        {connectedAccount ? `Connected as ${connectedAccount.account_name}` : "Not connected"}
                                    </CardDescription>
                                </div>
                                {connectedAccount ? (
                                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-muted-foreground">
                                        Disconnected
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent className="flex items-center justify-between pt-4">
                                {connectedAccount ? (
                                    <>
                                        <div className="text-xs text-muted-foreground">
                                            Last synced: {connectedAccount.last_synced_at ? new Date(connectedAccount.last_synced_at).toLocaleString() : 'Never'}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleManualSync(connectedAccount.id)}
                                                disabled={isSyncing === connectedAccount.id}
                                            >
                                                <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing === connectedAccount.id && "animate-spin")} />
                                                Sync Now
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setConfirmDelete(connectedAccount.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <Button className="w-full" onClick={() => handleConnect(p.id)}>
                                        <LinkIcon className="h-4 w-4 mr-2" />
                                        {p.id === 'facebook' || p.id === 'instagram' ? 'Manual API Setup' : 'Connect Account'}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Manual Setup Dialog */}
            <Dialog open={!!showManualSetup} onOpenChange={(open) => !open && setShowManualSetup(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Manual API Setup - {showManualSetup?.charAt(0).toUpperCase()}{showManualSetup?.slice(1)}</DialogTitle>
                        <DialogDescription>
                            Enter your Page Access Token and ID from the {showManualSetup} developer portal.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Account Name</Label>
                            <Input id="name" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="e.g. Official Page" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="id" className="text-right">Page ID</Label>
                            <Input id="id" value={manualAccountId} onChange={(e) => setManualAccountId(e.target.value)} placeholder="Enter Page/Account ID" className="col-span-3" autoComplete="off" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="token" className="text-right">Access Token</Label>
                            <Input id="token" type="text" value={manualToken} onChange={(e) => setManualToken(e.target.value)} placeholder="Paste token here" className="col-span-3" autoComplete="off" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowManualSetup(null)}>Cancel</Button>
                        <Button onClick={() => showManualSetup && handleConnect(showManualSetup, true)} disabled={isConnecting}>
                            Save Connection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Disconnect Confirmation Dialog */}
            <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Disconnection</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to disconnect this account? All associated leads and data will be kept but no new data will be synced.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => confirmDelete && handleDisconnect(confirmDelete)}>
                            Confirm Disconnect
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <CardTitle>Sync Settings</CardTitle>
                    <CardDescription>Configure how often the portal fetches data from your social accounts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="font-medium">Automatic Background Sync</p>
                            <p className="text-sm text-muted-foreground">Syncing data every 1 minute while the dashboard is open.</p>
                        </div>
                        <Badge className="bg-green-500">Enabled (Every 1m)</Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
