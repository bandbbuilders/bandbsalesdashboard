import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Edit, GripVertical } from "lucide-react";

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

interface KanbanCardProps {
  lead: Lead;
  onLeadClick: (leadId: string) => void;
  onLeadEdit: (leadId: string) => void;
}

export const KanbanCard = ({ lead, onLeadClick, onLeadEdit }: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
      {...attributes}
      {...listeners}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium">{lead.name}</CardTitle>
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">{lead.company}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1 text-xs">
          <p><span className="font-medium">Email:</span> {lead.email || 'N/A'}</p>
          <p><span className="font-medium">Phone:</span> {lead.phone || 'N/A'}</p>
          <p><span className="font-medium">Budget:</span> {lead.budget ? `PKR ${lead.budget.toLocaleString()}` : 'N/A'}</p>
          <p><span className="font-medium">Source:</span> {lead.source || 'N/A'}</p>
        </div>
        
        <div className="flex gap-1 mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs h-7"
            onClick={(e) => {
              e.stopPropagation();
              onLeadClick(lead.id);
            }}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1 text-xs h-7"
            onClick={(e) => {
              e.stopPropagation();
              onLeadEdit(lead.id);
            }}
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};