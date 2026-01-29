import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type TaskPriority = Database["public"]["Enums"]["task_priority"];

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  low: {
    label: "Low",
    className: "bg-priority-low text-priority-low-foreground",
  },
  medium: {
    label: "Medium",
    className: "bg-priority-medium text-priority-medium-foreground",
  },
  high: {
    label: "High",
    className: "bg-priority-high text-priority-high-foreground",
  },
  urgent: {
    label: "Urgent",
    className: "bg-priority-urgent text-priority-urgent-foreground",
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <Badge className={cn(config.className, "border-0", className)}>
      {config.label}
    </Badge>
  );
}
