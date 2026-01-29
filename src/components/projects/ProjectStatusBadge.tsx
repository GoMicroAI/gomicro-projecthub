import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-status-active text-status-active-foreground",
  },
  paused: {
    label: "Paused",
    className: "bg-status-paused text-status-paused-foreground",
  },
  completed: {
    label: "Completed",
    className: "bg-status-completed text-status-completed-foreground",
  },
};

export function ProjectStatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge className={cn(config.className, "border-0", className)}>
      {config.label}
    </Badge>
  );
}
