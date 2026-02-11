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
    RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function SocialAccounts() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState<string | null>(null);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        const { data } = await supabase
            .from('social_accounts' as any)
            .select('*');
        if (data) setAccounts(data);
    };

    const handleConnect = (platform: string) => {
        toast.info(`Connecting to ${platform}...`, {
            description: "Redirecting to OAuth authorization page."
        });
        // Placeholder for actual OAuth redirect logic
    };

    const handleManualSync = async (accountId: string) => {
        setIsSyncing(accountId);
        // Simulate API fetch delay
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
                                        <LinkIcon className="h-4 w-4 mr-2" /> Connect Account
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

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
