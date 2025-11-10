import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  platform: string;
  due_date: string | null;
}

interface TaskCardProps {
  task: Task;
  onUpdate: () => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'hsl(340 75% 55%)',
  facebook: 'hsl(221 44% 41%)',
  tiktok: 'hsl(0 0% 0%)',
  youtube: 'hsl(0 100% 50%)',
  linkedin: 'hsl(201 100% 35%)'
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'hsl(var(--muted))',
  medium: 'hsl(var(--warning))',
  high: 'hsl(var(--destructive))'
};

export function TaskCard({ task }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-move hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          <div>
            <h4 className="font-medium text-sm">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{ borderColor: PLATFORM_COLORS[task.platform] }}
            >
              {task.platform}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs"
              style={{ borderColor: PRIORITY_COLORS[task.priority] }}
            >
              {task.priority}
            </Badge>
          </div>

          {task.due_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {format(new Date(task.due_date), 'MMM dd')}
            </div>
          )}

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            <span>0 comments</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
