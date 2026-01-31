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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, X } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
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

const statusLabels: Record<TaskStatus, string> = {
  todo: "Assigned",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
};

export const MemberTasksPanel = forwardRef<HTMLDivElement, MemberTasksPanelProps>(
  ({ member, tasks, allAssignees, onClose }, ref) => {
    const { updateTask } = useTasks();
    const { projects } = useProjects();
    const { isAdmin } = useUserRole();
    const { user } = useAuth();

    const isOwnProfile = user?.id === member.user_id;
    const canModifyTasks = isAdmin || isOwnProfile;

    // Get task IDs assigned to this member via task_assignees junction table
    const memberAssignees = allAssignees.filter((a) => a.user_id === member.user_id);
    const assignedTaskIds = memberAssignees.map((a) => a.task_id);

    // Get tasks assigned to this member
    const memberTasks = tasks.filter((t) => assignedTaskIds.includes(t.id));

    // Get assignment date for a task
    const getAssignedDate = (taskId: string) => {
      const assignee = memberAssignees.find((a) => a.task_id === taskId);
      return assignee?.assigned_at || null;
    };

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

    // Format date based on status
    const formatStatusDate = (task: Task) => {
      if (task.status === "in_progress") {
        return "—";
      }
      if (task.status === "done") {
        return format(new Date(task.updated_at), "MMM d, yyyy");
      }
      if (task.status === "blocked") {
        return format(new Date(task.updated_at), "MMM d, yyyy");
      }
      // For todo/assigned, show assigned date
      const assignedAt = getAssignedDate(task.id);
      if (assignedAt) {
        return format(new Date(assignedAt), "MMM d, yyyy");
      }
      return format(new Date(task.created_at), "MMM d, yyyy");
    };

    // Get date label based on status
    const getDateLabel = (status: TaskStatus) => {
      switch (status) {
        case "done":
          return "Completed";
        case "blocked":
          return "Blocked Since";
        case "in_progress":
          return "—";
        default:
          return "Assigned";
      }
    };

    // Group tasks by status in specific order
    const tasksByStatus = {
      in_progress: memberTasks.filter((t) => t.status === "in_progress"),
      blocked: memberTasks.filter((t) => t.status === "blocked"),
      done: memberTasks.filter((t) => t.status === "done"),
      todo: memberTasks.filter((t) => t.status === "todo"),
    };

    const sections: { key: TaskStatus; title: string }[] = [
      { key: "in_progress", title: "In Progress" },
      { key: "blocked", title: "Blocked" },
      { key: "done", title: "Done" },
      { key: "todo", title: "Assigned (To Do)" },
    ];

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
              {sections.map((section) => {
                const sectionTasks = tasksByStatus[section.key];
                if (sectionTasks.length === 0) return null;

                return (
                  <div key={section.key}>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">
                      {section.title} ({sectionTasks.length})
                    </h3>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-[40%]">Task</TableHead>
                            <TableHead className="w-[25%]">Project</TableHead>
                            <TableHead className="w-[15%]">
                              {section.key === "in_progress" ? "Date" : getDateLabel(section.key)}
                            </TableHead>
                            {canModifyTasks && (
                              <TableHead className="w-[20%] text-right">Actions</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sectionTasks.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell className="font-medium">{task.title}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {getProjectName(task.project_id)}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {formatStatusDate(task)}
                              </TableCell>
                              {canModifyTasks && (
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {section.key !== "in_progress" && section.key !== "done" && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleMakeCurrentTask(task.id)}
                                        className="h-7 px-2"
                                      >
                                        <Play className="h-3 w-3" />
                                      </Button>
                                    )}
                                    <Select
                                      value={task.status}
                                      onValueChange={(value) =>
                                        handleStatusChange(task.id, value as TaskStatus)
                                      }
                                    >
                                      <SelectTrigger className="w-[100px] h-7 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="todo">Assigned</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="blocked">Blocked</SelectItem>
                                        <SelectItem value="done">Done</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}

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
