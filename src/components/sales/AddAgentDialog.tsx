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
import { useToast } from "@/hooks/use-toast";

interface AddAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgentAdded: (agent: { id: string; full_name: string; email: string | null }) => void;
}

export const AddAgentDialog = ({ open, onOpenChange, onAgentAdded }: AddAgentDialogProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter the agent's name",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("sales_agents")
        .insert({
          full_name: fullName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
        })
        .select("id, full_name, email")
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sales agent added successfully",
      });

      onAgentAdded(data);
      onOpenChange(false);
      
      // Reset form
      setFullName("");
      setEmail("");
      setPhone("");
    } catch (error: any) {
      console.error("Error adding agent:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add sales agent",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Sales Agent</DialogTitle>
          <DialogDescription>
            Create a new sales agent profile
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="agentName">Full Name *</Label>
              <Input
                id="agentName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter agent's full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agentEmail">Email</Label>
              <Input
                id="agentEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter agent's email (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agentPhone">Phone</Label>
              <Input
                id="agentPhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter agent's phone (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Adding..." : "Add Agent"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
