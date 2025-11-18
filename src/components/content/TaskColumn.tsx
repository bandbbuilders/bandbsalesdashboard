import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "./TaskCard";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  platform: string;
  due_date: string | null;
  assigned_to: string | null;
  created_by?: string | null;
}

interface Status {
  id: string;
  name: string;
  color: string;
}

interface TaskColumnProps {
  status: Status;
  tasks: Task[];
  onTaskUpdate: () => void;
}

export function TaskColumn({ status, tasks, onTaskUpdate }: TaskColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status.id,
  });

  return (
    <div className="flex-shrink-0 w-80">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              {status.name}
            </CardTitle>
            <Badge variant="secondary">{tasks.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div
            ref={setNodeRef}
            className="space-y-3 min-h-[200px]"
          >
            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onUpdate={onTaskUpdate} />
              ))}
            </SortableContext>
            {tasks.length === 0 && (
              <div className="text-center text-muted-foreground py-8 text-sm">
                No tasks in this stage
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
