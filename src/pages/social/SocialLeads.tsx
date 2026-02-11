import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    Filter,
    ExternalLink,
    Mail,
    CheckCircle2,
    Facebook,
    Instagram,
    Youtube,
    MessageSquare
} from "lucide-react";
import { format } from "date-fns";

export default function SocialLeads() {
    const [leads, setLeads] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        const { data } = await supabase
            .from('social_leads' as any)
            .select('*')
            .order('captured_at', { ascending: false });
        if (data) setLeads(data);
    };

    const filteredLeads = leads.filter(lead =>
        lead.commenter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.commenter_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.comment_content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search leads..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" /> Filter
                    </Button>
                    <Button variant="outline" size="sm">
                        Export CSV
                    </Button>
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Commenter</TableHead>
                            <TableHead>Platform</TableHead>
                            <TableHead>Comment</TableHead>
                            <TableHead>Intent</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLeads.length > 0 ? (
                            filteredLeads.map((lead) => (
                                <TableRow key={lead.id}>
                                    <TableCell>
                                        <div className="font-medium">{lead.commenter_name}</div>
                                        <div className="text-xs text-muted-foreground">@{lead.commenter_username}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {lead.platform === 'facebook' && <Facebook className="h-4 w-4 text-blue-600" />}
                                            {lead.platform === 'instagram' && <Instagram className="h-4 w-4 text-pink-600" />}
                                            {lead.platform === 'youtube' && <Youtube className="h-4 w-4 text-red-600" />}
                                            {lead.platform === 'tiktok' && <MessageSquare className="h-4 w-4 text-black" />}
                                            <span className="capitalize text-xs">{lead.platform}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px]">
                                        <p className="text-xs line-clamp-2 truncate" title={lead.comment_content}>
                                            {lead.comment_content}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={lead.intent_score === 'high' ? 'destructive' : lead.intent_score === 'medium' ? 'default' : 'secondary'}>
                                            {lead.intent_score}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {lead.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {format(new Date(lead.captured_at), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Contact">
                                                <Mail className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Mark Converted">
                                                <CheckCircle2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" title="View Post">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No leads found matching your criteria.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
