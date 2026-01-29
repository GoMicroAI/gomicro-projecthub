import { forwardRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Play, Pause, CheckCircle, AlertCircle, X } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"];
type TaskStatus = Database["public"]["Enums"]["task_status"];

interface TaskAssignee {
  id: string;
  task_id: string;
  user_id: string;
  assigned_at: string;
}

interface MemberTasksPanelProps {
  member: TeamMember;
  tasks: Task[];
  allAssignees: TaskAssignee[];
  onClose: () => void;
}

const statusConfig: Record<TaskStatus, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  todo: { label: "To Do", icon: Pause, className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", icon: Play, className: "bg-status-active text-status-active-foreground" },
  blocked: { label: "Blocked", icon: AlertCircle, className: "bg-status-paused text-status-paused-foreground" },
  done: { label: "Done", icon: CheckCircle, className: "bg-status-done text-status-done-foreground" },
};

export const MemberTasksPanel = forwardRef<HTMLDivElement, MemberTasksPanelProps>(
  ({ member, tasks, allAssignees, onClose }, ref) => {
    const { updateTask } = useTasks();
    const { projects } = useProjects();
    const { isAdmin } = useUserRole();

    // Get task IDs assigned to this member via task_assignees junction table
    const assignedTaskIds = allAssignees
      .filter((a) => a.user_id === member.user_id)
      .map((a) => a.task_id);

    // Get tasks assigned to this member
    const memberTasks = tasks.filter((t) => assignedTaskIds.includes(t.id));
    const currentTask = memberTasks.find((t) => t.status === "in_progress");

    const getInitials = (name: string) => {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    };

    const getProjectName = (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      return project?.name || "Unknown Project";
    };

    const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
      await updateTask.mutateAsync({ id: taskId, status: newStatus });
    };

    const handleMakeCurrentTask = async (taskId: string) => {
      await updateTask.mutateAsync({ id: taskId, status: "in_progress" });
    };

    return (
      <Card ref={ref} className="h-full flex flex-col">
        <CardHeader className="border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{member.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Current Task Section */}
              {currentTask && (
                <div className="pb-4 border-b">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Current Task
                  </h3>
                  <Card className="border-status-active bg-status-active/5">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{currentTask.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {getProjectName(currentTask.project_id)}
                          </p>
                        </div>
                        {isAdmin && (
                          <Select
                            value={currentTask.status}
                            onValueChange={(value) =>
                              handleStatusChange(currentTask.id, value as TaskStatus)
                            }
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="blocked">Blocked</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* All Assigned Tasks */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  All Assigned Tasks ({memberTasks.length})
                </h3>

                {memberTasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No tasks assigned to this member.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {memberTasks.map((task) => {
                      const status = statusConfig[task.status];
                      const StatusIcon = status.icon;
                      const isCurrent = task.status === "in_progress";

                      return (
                        <Card
                          key={task.id}
                          className={cn(
                            "transition-colors",
                            isCurrent && "border-status-active"
                          )}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  "mt-0.5 p-1.5 rounded-md",
                                  status.className
                                )}
                              >
                                <StatusIcon className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{task.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {getProjectName(task.project_id)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {isAdmin && !isCurrent && task.status !== "done" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMakeCurrentTask(task.id)}
                                    className="text-xs h-7"
                                  >
                                    <Play className="h-3 w-3 mr-1" />
                                    Start
                                  </Button>
                                )}
                                {isAdmin && (
                                  <Select
                                    value={task.status}
                                    onValueChange={(value) =>
                                      handleStatusChange(task.id, value as TaskStatus)
                                    }
                                  >
                                    <SelectTrigger className="w-[110px] h-7 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="todo">To Do</SelectItem>
                                      <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="blocked">Blocked</SelectItem>
                                      <SelectItem value="done">Done</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }
);

MemberTasksPanel.displayName = "MemberTasksPanel";
