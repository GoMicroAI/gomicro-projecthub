import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  todo: {
    label: "To Do",
    className: "bg-status-todo text-status-todo-foreground",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-status-in-progress text-status-in-progress-foreground",
  },
  blocked: {
    label: "Blocked",
    className: "bg-status-blocked text-status-blocked-foreground",
  },
  done: {
    label: "Done",
    className: "bg-status-done text-status-done-foreground",
  },
};

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge className={cn(config.className, "border-0", className)}>
      {config.label}
    </Badge>
  );
}
