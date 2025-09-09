import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  budget: number;
  stage: string;
  source: string;
  created_at: string;
  assigned_to: string;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  order_position: number;
}

interface KanbanBoardProps {
  leads: Lead[];
  stages: Stage[];
  onLeadUpdate: () => void;
  onStageUpdate: () => void;
}

export const KanbanBoard = ({ leads, stages, onLeadUpdate, onStageUpdate }: KanbanBoardProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const lead = leads.find(l => l.id === active.id);
    setDraggedLead(lead || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setDraggedLead(null);
      return;
    }

    const leadId = active.id as string;
    const newStageId = over.id as string;
    
    // Find the stage name from the stage id
    const newStage = stages.find(s => s.id === newStageId);
    if (!newStage) {
      setActiveId(null);
      setDraggedLead(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .update({ stage: newStage.name.toLowerCase().replace(' ', '_') })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead stage updated successfully"
      });

      onLeadUpdate();
    } catch (error) {
      console.error('Error updating lead stage:', error);
      toast({
        title: "Error",
        description: "Failed to update lead stage",
        variant: "destructive"
      });
    }

    setActiveId(null);
    setDraggedLead(null);
  };

  const getLeadsForStage = (stageName: string) => {
    return leads.filter(lead => 
      lead.stage.toLowerCase().replace('_', ' ') === stageName.toLowerCase()
    );
  };

  // Create default stages if none exist
  const defaultStages = stages.length > 0 ? stages : [
    { id: 'new', name: 'New', color: '#3b82f6', order_position: 0 },
    { id: 'contacted', name: 'Contacted', color: '#f59e0b', order_position: 1 },
    { id: 'qualified', name: 'Qualified', color: '#8b5cf6', order_position: 2 },
    { id: 'proposal', name: 'Proposal', color: '#10b981', order_position: 3 },
    { id: 'closed_won', name: 'Closed Won', color: '#10b981', order_position: 4 },
    { id: 'closed_lost', name: 'Closed Lost', color: '#ef4444', order_position: 5 },
  ];

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {defaultStages.map((stage) => {
          const stageLeads = getLeadsForStage(stage.name);
          
          return (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              leads={stageLeads}
              onLeadClick={(leadId) => navigate(`/crm/leads/${leadId}`)}
              onLeadEdit={(leadId) => navigate(`/crm/leads/${leadId}/edit`)}
            />
          );
        })}
      </div>
      
      <DragOverlay>
        {activeId && draggedLead ? (
          <KanbanCard lead={draggedLead} onLeadClick={() => {}} onLeadEdit={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};