import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "./PriorityBadge";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { Edit, Trash2, Calendar, ExternalLink, FlaskConical, Code } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];

interface TaskListItemProps {
  task: Task;
  isAdmin: boolean;
  assignees: TeamMember[];
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  showProjectLink?: boolean;
  projectName?: string;
}

export function TaskListItem({
  task,
  isAdmin,
  assignees,
  onEdit,
  onDelete,
  showProjectLink = false,
  projectName,
}: TaskListItemProps) {
  const navigate = useNavigate();
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors gap-3">
      {/* Task Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {task.task_type === "rnd" ? (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-purple-500/10 text-purple-600 border-purple-300">
              <FlaskConical className="h-2.5 w-2.5 mr-0.5" />
              R&D
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-600 border-blue-300">
              <Code className="h-2.5 w-2.5 mr-0.5" />
              Dev
            </Badge>
          )}
          <h4 className="font-medium truncate text-sm sm:text-base">{task.title}</h4>
          <TaskStatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
        {task.description && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
            {task.description}
          </p>
        )}
        
        {/* Mobile: Due date and assignees */}
        <div className="flex items-center gap-3 mt-2 sm:hidden">
          {task.due_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(task.due_date), "MMM d")}
            </div>
          )}
          {assignees.length > 0 && (
            <div className="flex -space-x-1.5">
              {assignees.slice(0, 3).map((member) => (
                <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {assignees.length > 3 && (
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-[10px] bg-muted">
                    +{assignees.length - 3}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Right side items */}
      <div className="hidden sm:flex items-center gap-3 shrink-0">
        {task.due_date && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {format(new Date(task.due_date), "MMM d")}
          </div>
        )}

        {assignees.length > 0 && (
          <div className="flex -space-x-2">
            {assignees.slice(0, 3).map((member) => (
              <Avatar key={member.id} className="h-7 w-7 border-2 border-background">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {assignees.length > 3 && (
              <Avatar className="h-7 w-7 border-2 border-background">
                <AvatarFallback className="text-xs bg-muted">
                  +{assignees.length - 3}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        )}

        {showProjectLink && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => navigate(`/projects/${task.project_id}`)}
            title={projectName ? `Go to ${projectName}` : "Go to project"}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            {projectName || "Project"}
          </Button>
        )}

        {isAdmin && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit?.(task)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete?.(task)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Mobile: Action buttons */}
      <div className="flex sm:hidden gap-1 self-end">
        {showProjectLink && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => navigate(`/projects/${task.project_id}`)}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            Project
          </Button>
        )}
        {isAdmin && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit?.(task)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete?.(task)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
