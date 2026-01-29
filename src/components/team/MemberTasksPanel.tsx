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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Pause, CheckCircle, AlertCircle, X } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
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
    const { user } = useAuth();

    // Check if the current user is viewing their own tasks
    const isOwnProfile = user?.id === member.user_id;
    // Users can modify if they are admin OR viewing their own assigned tasks
    const canModifyTasks = isAdmin || isOwnProfile;

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
                <AvatarImage src={member.avatar_url || undefined} alt={member.name} />
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
            <div className="p-4 space-y-6">
              {/* Group tasks by status */}
              {(() => {
                const tasksByStatus = {
                  in_progress: memberTasks.filter((t) => t.status === "in_progress"),
                  blocked: memberTasks.filter((t) => t.status === "blocked"),
                  done: memberTasks.filter((t) => t.status === "done"),
                  todo: memberTasks.filter((t) => t.status === "todo"),
                };

                const sections: { key: TaskStatus; title: string; emptyText: string; bgClass: string; borderClass: string }[] = [
                  { key: "in_progress", title: "Current Tasks", emptyText: "No active tasks", bgClass: "bg-status-in-progress/10", borderClass: "border-status-in-progress" },
                  { key: "blocked", title: "Blocked", emptyText: "No blocked tasks", bgClass: "bg-status-blocked/10", borderClass: "border-status-blocked" },
                  { key: "done", title: "Done", emptyText: "No completed tasks", bgClass: "bg-status-done/10", borderClass: "border-status-done" },
                  { key: "todo", title: "To Do (Assigned)", emptyText: "No pending tasks", bgClass: "bg-status-todo/10", borderClass: "border-status-todo" },
                ];

                return sections.map((section) => {
                  const sectionTasks = tasksByStatus[section.key];
                  const StatusIcon = statusConfig[section.key].icon;

                  return (
                    <div key={section.key} className={cn("rounded-lg border-l-4 p-3", section.bgClass, section.borderClass)}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <StatusIcon className="h-4 w-4" />
                          {section.title}
                        </h3>
                        <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                          {sectionTasks.length}
                        </span>
                      </div>

                      {sectionTasks.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">{section.emptyText}</p>
                      ) : (
                        <div className="space-y-2">
                          {sectionTasks.map((task) => (
                            <Card key={task.id} className="bg-background">
                              <CardContent className="p-3">
                                <div className="flex items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">{task.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {getProjectName(task.project_id)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap justify-end">
                                    {canModifyTasks && section.key !== "in_progress" && section.key !== "done" && (
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
                                    {canModifyTasks && (
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
                          ))}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}

              {memberTasks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No tasks assigned to this member.
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }
);

MemberTasksPanel.displayName = "MemberTasksPanel";
