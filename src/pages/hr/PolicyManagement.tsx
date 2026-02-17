import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Plus, CheckCircle, Clock, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AddPolicyDialog } from "@/components/hr/AddPolicyDialog";
import { useUserRole } from "@/hooks/useUserRole";

interface Policy {
    id: string;
    title: string;
    content: string;
    status: 'pending' | 'confirmed';
    created_at: string;
    created_by: string;
    confirmed_by?: string;
    confirmed_at?: string;
    profiles?: {
        full_name: string;
    };
}

const PolicyManagement = () => {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const { isCeoCoo, role } = useUserRole();
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        fetchPolicies();
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();
            setProfile(data);
        }
    };

    const canConfirm = isCeoCoo || profile?.position === 'CEO/COO' || profile?.department === 'Management';

    const fetchPolicies = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('policies')
                .select(`
          *,
          profiles:policies_created_by_fkey(full_name)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPolicies((data as unknown as Policy[]) || []);
        } catch (error: any) {
            console.error('Error fetching policies:', error);
            toast.error('Failed to load policies');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmPolicy = async (id: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase
                .from('policies')
                .update({
                    status: 'confirmed',
                    confirmed_by: session.user.id,
                    confirmed_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            toast.success('Policy confirmed successfully');
            fetchPolicies();
        } catch (error: any) {
            console.error('Error confirming policy:', error);
            toast.error('Failed to confirm policy');
        }
    };

    const handleDeletePolicy = async (id: string) => {
        if (!confirm('Are you sure you want to delete this policy?')) return;

        try {
            const { error } = await supabase
                .from('policies')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Policy deleted successfully');
            fetchPolicies();
        } catch (error: any) {
            console.error('Error deleting policy:', error);
            toast.error('Failed to delete policy');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Company Policies</h1>
                    <p className="text-muted-foreground">
                        Manage company rules and regulations. Policies must be confirmed by CEO/COO to be visible to all users.
                    </p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Policy
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Policies</CardTitle>
                    <CardDescription>
                        A list of all policies created for the company.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : policies.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No policies found</h3>
                            <p className="text-muted-foreground">Add your first company policy to get started.</p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => setIsAddDialogOpen(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Policy
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Created By</TableHead>
                                        <TableHead>Date Created</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {policies.map((policy) => (
                                        <TableRow key={policy.id}>
                                            <TableCell className="font-medium">{policy.title}</TableCell>
                                            <TableCell>{policy.profiles?.full_name || 'Unknown'}</TableCell>
                                            <TableCell>{format(new Date(policy.created_at), 'MMM d, yyyy')}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={policy.status === 'confirmed' ? 'default' : 'secondary'}
                                                    className={policy.status === 'confirmed' ? 'bg-green-500 hover:bg-green-600' : ''}
                                                >
                                                    {policy.status === 'confirmed' ? (
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                    ) : (
                                                        <Clock className="h-3 w-3 mr-1" />
                                                    )}
                                                    {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                {canConfirm && policy.status === 'pending' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleConfirmPolicy(policy.id)}
                                                    >
                                                        Confirm
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDeletePolicy(policy.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AddPolicyDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSuccess={fetchPolicies}
            />
        </div>
    );
};

export default PolicyManagement;
