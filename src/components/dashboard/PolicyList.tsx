import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { FileText, ChevronRight, BookOpen, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface Policy {
    id: string;
    title: string;
    content: string;
    created_at: string;
    status: string;
}

export const PolicyList = () => {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPolicies = async () => {
            try {
                const { data, error } = await supabase
                    .from("policies" as any)
                    .select("*")
                    .eq("status", "confirmed")
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setPolicies((data as any) || []);
            } catch (error) {
                console.error("Error fetching policies:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPolicies();
    }, []);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Company Policies</CardTitle>
                    <CardDescription>Loading policies...</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (policies.length === 0) {
        return null; // Don't show the card if there are no policies
    }

    return (
        <>
            <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            Company Policies
                        </CardTitle>
                        <CardDescription>Stay updated with our latest rules and guidelines.</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                        {policies.length} {policies.length === 1 ? 'Policy' : 'Policies'}
                    </Badge>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-3">
                            {policies.map((policy) => (
                                <div
                                    key={policy.id}
                                    className="group flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all cursor-pointer"
                                    onClick={() => setSelectedPolicy(policy)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                                                {policy.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(policy.created_at), "MMM d, yyyy")}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Dialog open={!!selectedPolicy} onOpenChange={(open) => !open && setSelectedPolicy(null)}>
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader className="pb-4 border-b">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs font-normal">Company Policy</Badge>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                                Effective: {selectedPolicy && format(new Date(selectedPolicy.created_at), "MMMM d, yyyy")}
                            </span>
                        </div>
                        <DialogTitle className="text-2xl font-bold text-primary">
                            {selectedPolicy?.title}
                        </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-1 mt-4 pr-4">
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground/90 leading-relaxed">
                            {selectedPolicy?.content}
                        </div>
                    </ScrollArea>
                    <div className="pt-6 border-t mt-4 flex justify-end">
                        <Button onClick={() => setSelectedPolicy(null)}>Close Policy</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
