import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TaskResponseDialog } from "./TaskResponseDialog";
import {
    CheckCircle,
    XCircle,
    MessageSquare,
    Clock,
    Calendar,
    AlertTriangle,
    ClipboardList,
} from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";

interface AssignedTask {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    due_date: string | null;
    assigned_to: string | null;
    assignment_status: string | null;
    review_comment: string | null;
    created_by: string | null;
    created_at: string;
}

interface MyAssignedTasksProps {
    userName: string;
    onTasksChange?: () => void;
}

const TASK_FINE_AMOUNT = 500;

const priorityColors: Record<string, string> = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
};

const assignmentStatusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Awaiting Response", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    accepted: { label: "Accepted", color: "bg-green-100 text-green-700 border-green-200" },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200" },
    review_requested: { label: "Review Requested", color: "bg-blue-100 text-blue-700 border-blue-200" },
};

export const MyAssignedTasks = ({ userName, onTasksChange }: MyAssignedTasksProps) => {
    const [tasks, setTasks] = useState<AssignedTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [respondingTask, setRespondingTask] = useState<AssignedTask | null>(null);
    const [checkingFines, setCheckingFines] = useState(false);
    const { toast } = useToast();

    const fetchMyTasks = useCallback(async () => {
        if (!userName) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("tasks")
                .select("id, title, description, status, priority, due_date, assigned_to, assignment_status, review_comment, created_by, created_at")
                .ilike("assigned_to", `%${userName}%`)
                .neq("status", "done")
                .neq("status", "cancelled")
                .order("due_date", { ascending: true });

            if (error) throw error;
            setTasks((data || []) as unknown as AssignedTask[]);
        } catch (err) {
            console.error("Error fetching assigned tasks:", err);
        } finally {
            setLoading(false);
        }
    }, [userName]);

    // Check for overdue tasks that have been accepted and auto-create fines
    const checkAndCreateOverdueFines = useCallback(async () => {
        if (!userName || checkingFines) return;
        setCheckingFines(true);
        try {
            // Get all accepted tasks for this user that are overdue and not done
            // @ts-ignore - assignment_status column added via migration, not yet in generated types
            const { data: overdueTasks } = await supabase
                .from("tasks")
                .select("id, title, due_date, assigned_to")
                .ilike("assigned_to", `%${userName}%`)
                .filter("assignment_status", "eq", "accepted")
                .neq("status", "done")
                .neq("status", "cancelled")
                .lt("due_date", new Date().toISOString());

            if (!overdueTasks || overdueTasks.length === 0) return;

            // For each overdue task, check if a fine already exists
            for (const task of overdueTasks) {
                const { data: existingFine } = await supabase
                    .from("fines")
                    .select("id")
                    .eq("task_id", task.id)
                    .eq("user_name", userName)
                    .maybeSingle();

                if (!existingFine) {
                    // Create a new fine for the overdue task
                    const { error: fineError } = await supabase.from("fines").insert({
                        user_name: userName,
                        amount: TASK_FINE_AMOUNT,
                        reason: `Overdue Task Fine: "${task.title}" — task was accepted but not completed by due date (${new Date(task.due_date!).toLocaleDateString()})`,
                        date: new Date().toISOString().split("T")[0],
                        status: "pending",
                        task_id: task.id,
                    });

                    if (!fineError) {
                        toast({
                            title: "⚠️ Overdue Task Fine",
                            description: `A PKR ${TASK_FINE_AMOUNT} fine has been created for overdue task: "${task.title}". Pending HR approval.`,
                            variant: "destructive",
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Error checking/creating overdue fines:", err);
        } finally {
            setCheckingFines(false);
        }
    }, [userName, checkingFines, toast]);

    useEffect(() => {
        fetchMyTasks();
    }, [fetchMyTasks]);

    // Check for overdue fines periodically
    useEffect(() => {
        if (!userName) return;
        checkAndCreateOverdueFines();
        const interval = setInterval(checkAndCreateOverdueFines, 5 * 60 * 1000); // every 5 min
        return () => clearInterval(interval);
    }, [userName, checkAndCreateOverdueFines]);

    // Real-time subscription for task assignments
    useEffect(() => {
        if (!userName) return;
        const channel = supabase
            .channel(`my-assigned-tasks-${userName}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "tasks" },
                () => {
                    fetchMyTasks();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userName, fetchMyTasks]);

    const handleResponded = () => {
        fetchMyTasks();
        onTasksChange?.();
        checkAndCreateOverdueFines();
    };

    const pendingTasks = tasks.filter((t) => !t.assignment_status || t.assignment_status === "pending");
    const respondedTasks = tasks.filter((t) => t.assignment_status && t.assignment_status !== "pending");

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground text-sm">
                        Loading your tasks...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (tasks.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ClipboardList className="h-4 w-4 text-primary" />
                        My Assigned Tasks
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        No tasks currently assigned to you.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-base">
                            <ClipboardList className="h-4 w-4 text-primary" />
                            My Assigned Tasks
                        </div>
                        <div className="flex items-center gap-2">
                            {pendingTasks.length > 0 && (
                                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                                    {pendingTasks.length} awaiting response
                                </Badge>
                            )}
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Pending response tasks */}
                    {pendingTasks.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Needs Your Response
                            </p>
                            {pendingTasks.map((task) => {
                                const isOverdue = task.due_date && isPast(new Date(task.due_date));
                                return (
                                    <div
                                        key={task.id}
                                        className={`rounded-lg border p-3 space-y-2 ${isOverdue
                                            ? "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800"
                                            : "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{task.title}</p>
                                                {task.description && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                        {task.description}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge
                                                className={priorityColors[task.priority] || "bg-gray-100"}
                                                variant="secondary"
                                            >
                                                {task.priority}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            {task.created_by && <span>From: {task.created_by}</span>}
                                            {task.due_date && (
                                                <div className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                                                    <Calendar className="h-3 w-3" />
                                                    {isOverdue
                                                        ? `Overdue by ${formatDistanceToNow(new Date(task.due_date))}`
                                                        : `Due ${formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}`}
                                                </div>
                                            )}
                                        </div>

                                        {isOverdue && (
                                            <div className="flex items-center gap-1 text-xs text-red-600">
                                                <AlertTriangle className="h-3 w-3" />
                                                <span>Accepting this overdue task will incur a PKR {TASK_FINE_AMOUNT} fine</span>
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-1">
                                            <Button
                                                size="sm"
                                                className="h-7 text-xs flex-1 bg-green-600 hover:bg-green-700"
                                                onClick={() => setRespondingTask(task)}
                                            >
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Respond
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Already responded tasks */}
                    {respondedTasks.length > 0 && (
                        <div className="space-y-2">
                            {pendingTasks.length > 0 && (
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-4">
                                    Responded Tasks
                                </p>
                            )}
                            {respondedTasks.map((task) => {
                                const statusConfig = assignmentStatusConfig[task.assignment_status || "pending"];
                                const isOverdue = task.due_date && isPast(new Date(task.due_date));
                                return (
                                    <div key={task.id} className="rounded-lg border p-3 space-y-1.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{task.title}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                <Badge
                                                    className={`text-xs border ${statusConfig.color}`}
                                                    variant="outline"
                                                >
                                                    {statusConfig.label}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            {task.due_date && (
                                                <div className={`flex items-center gap-1 ${isOverdue && task.assignment_status === "accepted" ? "text-red-600 font-medium" : ""}`}>
                                                    <Clock className="h-3 w-3" />
                                                    {isOverdue
                                                        ? `Overdue by ${formatDistanceToNow(new Date(task.due_date))}`
                                                        : `Due ${formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}`}
                                                </div>
                                            )}
                                        </div>

                                        {task.review_comment && (
                                            <div className="flex items-start gap-1 text-xs text-muted-foreground bg-muted/50 rounded p-2">
                                                <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                <span className="italic">{task.review_comment}</span>
                                            </div>
                                        )}

                                        {isOverdue && task.assignment_status === "accepted" && (
                                            <div className="flex items-center gap-1 text-xs text-red-600">
                                                <AlertTriangle className="h-3 w-3" />
                                                <span>Overdue — PKR {TASK_FINE_AMOUNT} fine is pending HR approval</span>
                                            </div>
                                        )}

                                        {task.assignment_status === "accepted" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-xs w-full mt-1"
                                                onClick={() => setRespondingTask(task)}
                                            >
                                                Update Response
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {respondingTask && (
                <TaskResponseDialog
                    task={respondingTask}
                    isOpen={!!respondingTask}
                    onClose={() => setRespondingTask(null)}
                    onResponded={handleResponded}
                />
            )}
        </>
    );
};
