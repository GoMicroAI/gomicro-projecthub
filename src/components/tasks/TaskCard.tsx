import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "./PriorityBadge";
import { Edit, Trash2, Calendar, Cpu } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];

interface TaskCardProps {
  task: Task;
  isAdmin: boolean;
  assignee?: TeamMember;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onClick?: (task: Task) => void;
}

export function TaskCard({
  task,
  isAdmin,
  assignee,
  onEdit,
  onDelete,
  onClick,
}: TaskCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      className="group cursor-pointer hover:shadow-md transition-shadow bg-card"
      onClick={() => onClick?.(task)}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {task.task_type === "rnd" && (
              <div className="flex items-center gap-1.5 mb-1">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-purple-500/10 text-purple-600 border-purple-300">
                  <Cpu className="h-2.5 w-2.5 mr-0.5" />
                  R&D
                </Badge>
              </div>
            )}
            <h4 className="text-sm font-medium line-clamp-2">{task.title}</h4>
          </div>
          {isAdmin && (
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(task);
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(task);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex items-center justify-between gap-2">
          <PriorityBadge priority={task.priority} className="text-xs py-0.5" />
          <div className="flex items-center gap-2">
            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), "MMM d")}
              </div>
            )}
            {assignee && (
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-muted">
                  {getInitials(assignee.name)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
