import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Stage {
  id: string;
  name: string;
  color: string;
  order_position: number;
}

interface StageManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: Stage[];
  onStagesUpdate: () => void;
}

const STAGE_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Yellow", value: "#f59e0b" },
  { name: "Red", value: "#ef4444" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Gray", value: "#6b7280" },
];

export const StageManager = ({ open, onOpenChange, stages, onStagesUpdate }: StageManagerProps) => {
  const [newStageName, setNewStageName] = useState("");
  const [selectedColor, setSelectedColor] = useState(STAGE_COLORS[0].value);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddStage = async () => {
    if (!newStageName.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('lead_stages')
        .insert({
          name: newStageName.trim(),
          color: selectedColor,
          order_position: stages.length
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stage added successfully"
      });

      setNewStageName("");
      setSelectedColor(STAGE_COLORS[0].value);
      onStagesUpdate();
    } catch (error) {
      console.error('Error adding stage:', error);
      toast({
        title: "Error",
        description: "Failed to add stage",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('lead_stages')
        .delete()
        .eq('id', stageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stage deleted successfully"
      });

      onStagesUpdate();
    } catch (error) {
      console.error('Error deleting stage:', error);
      toast({
        title: "Error",
        description: "Failed to delete stage",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Stages</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Stage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add New Stage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="stageName">Stage Name</Label>
                <Input
                  id="stageName"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  placeholder="Enter stage name"
                />
              </div>

              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {STAGE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedColor === color.value ? 'border-foreground' : 'border-muted'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setSelectedColor(color.value)}
                    />
                  ))}
                </div>
              </div>

              <Button onClick={handleAddStage} disabled={loading || !newStageName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Stage
              </Button>
            </CardContent>
          </Card>

          {/* Existing Stages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Existing Stages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No stages created yet</p>
                ) : (
                  stages.map((stage) => (
                    <div
                      key={stage.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="font-medium">{stage.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStage(stage.id)}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
