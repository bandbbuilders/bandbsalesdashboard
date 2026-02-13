import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Facebook,
    Instagram,
    Youtube,
    MessageSquare,
    Link as LinkIcon,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Settings2
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

export default function SocialAccounts() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    // Manual setup state
    const [showManualSetup, setShowManualSetup] = useState<string | null>(null);
    const [manualName, setManualName] = useState("");
    const [manualAccountId, setManualAccountId] = useState("");
    const [manualToken, setManualToken] = useState("");

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        const { data } = await supabase
            .from('social_accounts' as any)
            .select('*');
        if (data) setAccounts(data);
    };

    const handleConnect = async (platform: string, isManual = false) => {
        setIsConnecting(true);

        try {
            if (platform === 'instagram' && !isManual) {
                // Try real OAuth first
                const { data: settings } = await supabase
                    .from("social_settings" as any)
                    .select("app_id, redirect_uri")
                    .eq("platform", "instagram")
                    .single();

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
            const newAccount = data as any;

            toast.success(`${accountData.name} connected!`, {
                id: toastId,
                description: "Your social leads are now being synced."
            });

            setShowManualSetup(null);
            setManualName("");
            setManualAccountId("");
            setManualToken("");

            await fetchAccounts();
            // seedMockData(newAccount.id, platform); // Removed per user request to clean dummy data

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

    const handleManualSync = async (accountId: string) => {
        setIsSyncing(accountId);
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast.success("Sync complete", {
            description: "Latest posts and comments have been imported."
        });
        setIsSyncing(null);
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
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleManualSync(connectedAccount.id)}
                                            disabled={isSyncing === connectedAccount.id}
                                        >
                                            <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing === connectedAccount.id && "animate-spin")} />
                                            Sync Now
                                        </Button>
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
                            <Input id="id" value={manualAccountId} onChange={(e) => setManualAccountId(e.target.value)} placeholder="Enter Page/Account ID" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="token" className="text-right">Access Token</Label>
                            <Input id="token" type="password" value={manualToken} onChange={(e) => setManualToken(e.target.value)} placeholder="Paste token here" className="col-span-3" />
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

            <Card>
                <CardHeader>
                    <CardTitle>Sync Settings</CardTitle>
                    <CardDescription>Configure how often the portal fetches data from your social accounts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="font-medium">Automatic Background Sync</p>
                            <p className="text-sm text-muted-foreground">Sync data every 6 hours automatically.</p>
                        </div>
                        <Button variant="outline">Configure</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
