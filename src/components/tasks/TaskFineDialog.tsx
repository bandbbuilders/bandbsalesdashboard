import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, ShieldAlert } from "lucide-react";

// Zain Sarwar (COO) - exempt from all fines
const ZAIN_SARWAR_NAME = "zain sarwar";

interface Task {
  id: string;
  title: string;
  assigned_to: string | null;
}

interface TaskFineDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
}

export const TaskFineDialog = ({ isOpen, onClose, task }: TaskFineDialogProps) => {
  const [amount, setAmount] = useState<number>(500);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExempt, setIsExempt] = useState(false);
  const { toast } = useToast();

  // Check if assigned person is exempt from fines (COO/CEO)
  useEffect(() => {
    const checkExemption = async () => {
      if (!task.assigned_to) {
        setIsExempt(false);
        return;
      }
      
      // Check if name is Zain Sarwar
      if (task.assigned_to.toLowerCase().trim() === ZAIN_SARWAR_NAME) {
        setIsExempt(true);
        return;
      }
      
      // Check if user has ceo_coo role
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("full_name", task.assigned_to)
        .maybeSingle();
      
      if (profile?.user_id) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", profile.user_id)
          .maybeSingle();
        
        setIsExempt(roleData?.role === "ceo_coo");
      } else {
        setIsExempt(false);
      }
    };
    
    if (isOpen) {
      checkExemption();
    }
  }, [task.assigned_to, isOpen]);

  const handleSubmit = async () => {
    if (!task.assigned_to) {
      toast({
        title: "Error",
        description: "Task has no assigned person to fine",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the fine",
        variant: "destructive",
      });
      return;
    }

    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Fine amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("fines").insert({
        user_name: task.assigned_to,
        amount,
        reason: `Task Fine: ${task.title} - ${reason}`,
        date: new Date().toISOString().split("T")[0],
        status: "pending",
        task_id: task.id,
      });

      if (error) throw error;

      toast({
        title: "Fine Created",
        description: `Rs ${amount} fine created for ${task.assigned_to}. Pending HR approval.`,
      });

      onClose();
      setAmount(500);
      setReason("");
    } catch (error: any) {
      console.error("Error creating fine:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create fine",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Create Task Fine
          </DialogTitle>
        </DialogHeader>

        {isExempt ? (
          <div className="py-6 text-center space-y-3">
            <ShieldAlert className="h-12 w-12 text-primary mx-auto" />
            <p className="font-medium text-lg">Cannot Fine This Person</p>
            <p className="text-sm text-muted-foreground">
              {task.assigned_to} is a CEO/COO and is exempt from fines.
            </p>
            <Button variant="outline" onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Task</Label>
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {task.title}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Executive</Label>
                <p className="text-sm font-medium bg-muted p-2 rounded">
                  {task.assigned_to || "No one assigned"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Fine Amount (Rs)</Label>
                <Input
                  id="amount"
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Fine</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Missed deadline, Poor quality work..."
                  rows={3}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                This fine will be sent to HR for approval before being applied.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !task.assigned_to}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isSubmitting ? "Creating..." : "Create Fine"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
