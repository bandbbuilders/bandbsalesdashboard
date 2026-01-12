import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

// Generate consistent colors for tags
const tagColors = [
  "bg-red-500 text-white",
  "bg-blue-500 text-white",
  "bg-green-500 text-white",
  "bg-yellow-500 text-black",
  "bg-purple-500 text-white",
  "bg-pink-500 text-white",
  "bg-indigo-500 text-white",
  "bg-orange-500 text-white",
  "bg-teal-500 text-white",
  "bg-cyan-500 text-white",
  "bg-lime-500 text-black",
  "bg-amber-500 text-black",
  "bg-emerald-500 text-white",
  "bg-rose-500 text-white",
  "bg-violet-500 text-white",
];

const getTagColor = (tag: string): string => {
  // Generate a consistent index based on the tag string
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % tagColors.length;
  return tagColors[index];
};

export const KanbanCard = ({ lead, onLeadClick, onLeadEdit }: KanbanCardProps) => {
  const [tags, setTags] = useState<string[]>([]);
  
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

  useEffect(() => {
    const fetchTags = async () => {
      const { data } = await supabase
        .from('lead_tags')
        .select('tag')
        .eq('lead_id', lead.id);
      
      if (data) {
        setTags(data.map(t => t.tag));
      }
    };
    fetchTags();
  }, [lead.id]);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="hover:shadow-md transition-shadow"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
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
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <Badge 
                  key={tag} 
                  className={`text-[10px] px-1.5 py-0 ${getTagColor(tag)}`}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </div>
      
      <CardContent className="pt-0">
        <div className="flex gap-1">
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