import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, Facebook, Instagram, Youtube, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function SocialConversations() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('social_leads' as any)
                .select('*')
                .order('captured_at', { ascending: false });

            if (data) setLeads(data);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLeads = leads.filter(lead =>
        lead.commenter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.comment_content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-3 h-[calc(100vh-250px)]">
            <Card className="md:col-span-1 flex flex-col overflow-hidden">
                <CardHeader className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search chats..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {filteredLeads.length > 0 ? (
                            filteredLeads.map((lead) => (
                                <button
                                    key={lead.id}
                                    className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex flex-col gap-1 border-b last:border-0"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-sm truncate">{lead.commenter_name}</span>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {lead.captured_at ? format(new Date(lead.captured_at), 'MMM d') : 'Recent'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {lead.comment_content}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                        {lead.platform === 'facebook' && <Facebook className="h-3 w-3 text-blue-600" />}
                                        {lead.platform === 'instagram' && <Instagram className="h-3 w-3 text-pink-600" />}
                                        <Badge variant="outline" className="text-[9px] h-4 py-0 leading-none capitalize">
                                            {lead.platform}
                                        </Badge>
                                        <Badge variant="secondary" className="text-[9px] h-4 py-0 leading-none">
                                            {lead.comment_id?.startsWith('msg_') ? 'Message' : 'Comment'}
                                        </Badge>
                                        {lead.intent_score === 'high' && (
                                            <Badge className="bg-orange-500 text-[9px] h-4 py-0 leading-none">Hot Lead</Badge>
                                        )}
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-10 text-muted-foreground text-sm">
                                No conversations found.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </Card>

            <Card className="md:col-span-2 flex flex-col overflow-hidden">
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                    <h3 className="text-lg font-medium">Select a conversation</h3>
                    <p className="text-sm max-w-xs">
                        Choose a lead from the list to view their full comment thread and start a response.
                    </p>
                </div>
            </Card>
        </div>
    );
}
