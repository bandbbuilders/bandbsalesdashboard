import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddReminderProps {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddReminder = ({ leadId, open, onOpenChange }: AddReminderProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    due_time: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Combine date and time
      const dueDateTime = new Date(`${formData.due_date}T${formData.due_time}`);
      
      // For now, we'll use a mock user ID. In a real app, this would come from auth
      const mockUserId = "11111111-1111-1111-1111-111111111111";

      const { error } = await supabase
        .from('reminders')
        .insert({
          lead_id: leadId,
          user_id: mockUserId,
          title: formData.title,
          description: formData.description || null,
          due_date: dueDateTime.toISOString(),
          reminder_type: 'follow_up'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reminder created successfully"
      });

      setFormData({ title: "", description: "", due_date: "", due_time: "" });
      onOpenChange(false);
      window.location.reload(); // Refresh to show new reminder
    } catch (error) {
      console.error('Error adding reminder:', error);
      toast({
        title: "Error",
        description: "Failed to create reminder",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Reminder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Follow up with lead"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_time">Due Time *</Label>
              <Input
                id="due_time"
                type="time"
                value={formData.due_time}
                onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create Reminder"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};