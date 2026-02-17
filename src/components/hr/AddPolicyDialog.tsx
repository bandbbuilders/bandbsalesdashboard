import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface AddPolicyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export const AddPolicyDialog = ({ open, onOpenChange, onSuccess }: AddPolicyDialogProps) => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            setIsSubmitting(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("You must be logged in to add a policy");
                return;
            }

            const { error } = await supabase.from("policies" as any).insert({
                title,
                content,
                created_by: session.user.id,
                status: "pending",
            });

            if (error) throw error;

            toast.success("Policy added successfully. Waiting for COO confirmation.");
            setTitle("");
            setContent("");
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error adding policy:", error);
            toast.error(error.message || "Failed to add policy");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add New Policy</DialogTitle>
                        <DialogDescription>
                            Create a new company policy. This will be visible to all users once confirmed by the COO.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Policy Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Code of Conduct, Travel Policy"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="content">Policy Content</Label>
                            <Textarea
                                id="content"
                                placeholder="Describe the policy details, rules, and regulations..."
                                className="min-h-[200px]"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Adding..." : "Add Policy"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
