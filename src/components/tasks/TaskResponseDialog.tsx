import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, MessageSquare, Calendar, User, AlertTriangle } from "lucide-react";

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    due_date: string | null;
    assigned_to: string | null;
    assignment_status?: string | null;
    review_comment?: string | null;
    created_by?: string | null;
}

interface TaskResponseDialogProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
    onResponded: () => void;
}

const priorityColors: Record<string, string> = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
};

export const TaskResponseDialog = ({
    task,
    isOpen,
    onClose,
    onResponded,
}: TaskResponseDialogProps) => {
    const [action, setAction] = useState<"accept" | "reject" | "review" | null>(null);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!action) return;
        if ((action === "reject" || action === "review") && !comment.trim()) {
            toast({
                title: "Comment Required",
                description: action === "reject"
                    ? "Please provide a reason for rejecting this task."
                    : "Please provide your review comment or question.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const updatePayload: Record<string, string | null> = {
                assignment_status:
                    action === "accept"
                        ? "accepted"
                        : action === "reject"
                            ? "rejected"
                            : "review_requested",
                review_comment: comment.trim() || null,
            };

            // If accepting, also move task to in_progress if still todo
            if (action === "accept" && task.status === "todo") {
                updatePayload.status = "in_progress";
            }

            const { error } = await supabase
                .from("tasks")
                .update(updatePayload)
                .eq("id", task.id);

            if (error) throw error;

            const messages: Record<string, string> = {
                accept: "Task accepted! It has been moved to In Progress.",
                reject: "Task rejected. The task creator will be notified.",
                review: "Review requested. The task creator will see your comment.",
            };

            toast({
                title: action === "accept" ? "✅ Task Accepted" : action === "reject" ? "❌ Task Rejected" : "💬 Review Requested",
                description: messages[action],
            });

            onResponded();
            onClose();
        } catch (err: any) {
            console.error("Error responding to task:", err);
            toast({
                title: "Error",
                description: err.message || "Failed to respond to task",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "No due date";
        return new Date(dateString).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Respond to Task Assignment
                    </DialogTitle>
                </DialogHeader>

                {/* Task Details */}
                <div className="space-y-4 py-2">
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                        <div>
                            <p className="font-semibold text-base">{task.title}</p>
                            {task.description && (
                                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 items-center text-sm">
                            <Badge className={priorityColors[task.priority] || "bg-gray-100"} variant="secondary">
                                {task.priority}
                            </Badge>
                            {task.created_by && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>From: {task.created_by}</span>
                                </div>
                            )}
                        </div>

                        {task.due_date && (
                            <div className={`flex items-center gap-1 text-sm font-medium ${isOverdue ? "text-red-600" : "text-muted-foreground"}`}>
                                <Calendar className="h-3 w-3" />
                                <span>Due: {formatDate(task.due_date)}</span>
                                {isOverdue && <span className="text-red-600 ml-1">(Overdue!)</span>}
                            </div>
                        )}
                    </div>

                    {/* Warning about fine */}
                    <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 p-3">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-orange-700 dark:text-orange-300">
                            <strong>Note:</strong> If you accept this task and it is not completed by the due date,
                            a <strong>PKR 500 fine</strong> will be automatically raised and sent to HR for approval.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Select your response:</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setAction("accept")}
                                className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-sm font-medium transition-all ${action === "accept"
                                        ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700"
                                        : "border-border hover:border-green-300 hover:bg-green-50/50"
                                    }`}
                            >
                                <CheckCircle className={`h-5 w-5 ${action === "accept" ? "text-green-600" : "text-muted-foreground"}`} />
                                Accept
                            </button>
                            <button
                                type="button"
                                onClick={() => setAction("review")}
                                className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-sm font-medium transition-all ${action === "review"
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700"
                                        : "border-border hover:border-blue-300 hover:bg-blue-50/50"
                                    }`}
                            >
                                <MessageSquare className={`h-5 w-5 ${action === "review" ? "text-blue-600" : "text-muted-foreground"}`} />
                                Ask Review
                            </button>
                            <button
                                type="button"
                                onClick={() => setAction("reject")}
                                className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-sm font-medium transition-all ${action === "reject"
                                        ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700"
                                        : "border-border hover:border-red-300 hover:bg-red-50/50"
                                    }`}
                            >
                                <XCircle className={`h-5 w-5 ${action === "reject" ? "text-red-600" : "text-muted-foreground"}`} />
                                Reject
                            </button>
                        </div>
                    </div>

                    {/* Comment field for reject/review */}
                    {(action === "reject" || action === "review") && (
                        <div className="space-y-1">
                            <Label htmlFor="comment">
                                {action === "reject" ? "Reason for rejection *" : "Your question or comment *"}
                            </Label>
                            <Textarea
                                id="comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={
                                    action === "reject"
                                        ? "Explain why you're rejecting this task..."
                                        : "What do you need clarification on?"
                                }
                                rows={3}
                            />
                        </div>
                    )}

                    {/* Optional comment for accept */}
                    {action === "accept" && (
                        <div className="space-y-1">
                            <Label htmlFor="comment">Message to creator (optional)</Label>
                            <Textarea
                                id="comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Any notes for the task creator..."
                                rows={2}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!action || isSubmitting}
                        className={
                            action === "accept"
                                ? "bg-green-600 hover:bg-green-700"
                                : action === "reject"
                                    ? "bg-destructive hover:bg-destructive/90"
                                    : action === "review"
                                        ? "bg-blue-600 hover:bg-blue-700"
                                        : ""
                        }
                    >
                        {isSubmitting ? "Submitting..." : action ? `Submit ${action === "accept" ? "Acceptance" : action === "reject" ? "Rejection" : "Review Request"}` : "Select an action"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
