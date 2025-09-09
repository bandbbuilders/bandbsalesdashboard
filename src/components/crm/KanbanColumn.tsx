import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface KanbanColumnProps {
  stage: Stage;
  leads: Lead[];
  onLeadClick: (leadId: string) => void;
  onLeadEdit: (leadId: string) => void;
}

export const KanbanColumn = ({ stage, leads, onLeadClick, onLeadEdit }: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({
    id: stage.id,
  });

  return (
    <div className="flex-shrink-0 w-80">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              {stage.name}
            </CardTitle>
            <Badge variant="secondary">{leads.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div
            ref={setNodeRef}
            className="space-y-3 min-h-[200px]"
          >
            <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
              {leads.map((lead) => (
                <KanbanCard
                  key={lead.id}
                  lead={lead}
                  onLeadClick={onLeadClick}
                  onLeadEdit={onLeadEdit}
                />
              ))}
            </SortableContext>
            {leads.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No leads in this stage
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};