import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface CommissionEntry {
  id: string;
  recipient_name: string;
  recipient_type: 'agent' | 'dealer' | 'coo';
  total_amount: number;
  notes?: string;
}

interface CommissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: string;
  saleAmount: number;
}

export const CommissionDialog = ({ open, onOpenChange, saleId, saleAmount }: CommissionDialogProps) => {
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<CommissionEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && saleId) {
      fetchCommissions();
    }
  }, [open, saleId]);

  const fetchCommissions = async () => {
    try {
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('sale_id', saleId);

      if (error) throw error;

      if (data && data.length > 0) {
        setCommissions(data.map(c => ({
          id: c.id,
          recipient_name: c.recipient_name,
          recipient_type: c.recipient_type as 'agent' | 'dealer' | 'coo',
          total_amount: parseFloat(c.total_amount.toString()),
          notes: c.notes || '',
        })));
      } else {
        // Initialize with one empty entry
        setCommissions([{
          id: crypto.randomUUID(),
          recipient_name: '',
          recipient_type: 'agent',
          total_amount: 0,
          notes: '',
        }]);
      }
    } catch (error) {
      console.error('Error fetching commissions:', error);
    }
  };

  const addCommissionEntry = () => {
    setCommissions([...commissions, {
      id: crypto.randomUUID(),
      recipient_name: '',
      recipient_type: 'agent',
      total_amount: 0,
      notes: '',
    }]);
  };

  const removeCommissionEntry = (id: string) => {
    setCommissions(commissions.filter(c => c.id !== id));
  };

  const updateCommission = (id: string, field: keyof CommissionEntry, value: any) => {
    setCommissions(commissions.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const handleSave = async () => {
    // Validate
    const invalidEntries = commissions.filter(c => 
      !c.recipient_name.trim() || c.total_amount <= 0
    );

    if (invalidEntries.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all recipient names and amounts",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Delete existing commissions for this sale
      await supabase
        .from('commissions')
        .delete()
        .eq('sale_id', saleId);

      // Insert new commissions
      const commissionsToInsert = commissions.map(c => ({
        sale_id: saleId,
        recipient_name: c.recipient_name.trim(),
        recipient_type: c.recipient_type,
        total_amount: c.total_amount,
        amount_70_percent: c.total_amount * 0.7,
        amount_30_percent: c.total_amount * 0.3,
        notes: c.notes?.trim() || null,
      }));

      const { error } = await supabase
        .from('commissions')
        .insert(commissionsToInsert);

      if (error) throw error;

      toast({
        title: "Commissions Saved",
        description: "Commission details have been updated successfully",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving commissions:', error);
      toast({
        title: "Error",
        description: "Failed to save commission details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Commissions</DialogTitle>
          <DialogDescription>
            Add or edit commission details for this sale. 70% will be released on downpayment completion, 30% after 2 installments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground">
            Sale Amount: <span className="font-semibold">PKR {saleAmount.toLocaleString()}</span>
          </div>

          {commissions.map((commission, index) => (
            <div key={commission.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Commission Entry #{index + 1}</h4>
                {commissions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCommissionEntry(commission.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Recipient Name *</Label>
                  <Input
                    value={commission.recipient_name}
                    onChange={(e) => updateCommission(commission.id, 'recipient_name', e.target.value)}
                    placeholder="Enter name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Recipient Type *</Label>
                  <Select
                    value={commission.recipient_type}
                    onValueChange={(value) => updateCommission(commission.id, 'recipient_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="dealer">Dealer</SelectItem>
                      <SelectItem value="coo">COO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Total Commission Amount (PKR) *</Label>
                  <Input
                    type="number"
                    value={commission.total_amount || ''}
                    onChange={(e) => updateCommission(commission.id, 'total_amount', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    70% = PKR {(commission.total_amount * 0.7).toLocaleString()} | 
                    30% = PKR {(commission.total_amount * 0.3).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={commission.notes || ''}
                    onChange={(e) => updateCommission(commission.id, 'notes', e.target.value)}
                    placeholder="Additional notes"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addCommissionEntry}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Commission Entry
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Save Commissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
