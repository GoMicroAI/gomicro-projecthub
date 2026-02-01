import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, FileText } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type TaskStatus = Database["public"]["Enums"]["task_status"];

interface TaskAssignee {
  id: string;
  task_id: string;
  user_id: string;
  assigned_at: string;
}

interface ActiveTasksTabProps {
  tasks: Task[];
  memberAssignees: TaskAssignee[];
  canModify: boolean;
}

export function ActiveTasksTab({ tasks, memberAssignees, canModify }: ActiveTasksTabProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { updateTask } = useTasks();
  const { projects } = useProjects();

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  const getAssignedDate = (taskId: string) => {
    const assignee = memberAssignees.find((a) => a.task_id === taskId);
    return assignee?.assigned_at || null;
  };

  const formatStatusDate = (task: Task) => {
    if (task.status === "in_progress") {
      return "—";
    }
    if (task.status === "blocked") {
      return format(new Date(task.updated_at), "MMM d, yyyy");
    }
    const assignedAt = getAssignedDate(task.id);
    if (assignedAt) {
      return format(new Date(assignedAt), "MMM d, yyyy");
    }
    return format(new Date(task.created_at), "MMM d, yyyy");
  };

  const getDateLabel = (status: string) => {
    switch (status) {
      case "blocked":
        return "Blocked Since";
      case "in_progress":
        return "—";
      default:
        return "Assigned";
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await updateTask.mutateAsync({ id: taskId, status: newStatus });
  };

  const handleMakeCurrentTask = async (taskId: string) => {
    await updateTask.mutateAsync({ id: taskId, status: "in_progress" });
  };

  // Filter active tasks (exclude done)
  const activeTasks = tasks.filter((t) => t.status !== "done");

  const tasksByStatus = {
    in_progress: activeTasks.filter((t) => t.status === "in_progress"),
    blocked: activeTasks.filter((t) => t.status === "blocked"),
    todo: activeTasks.filter((t) => t.status === "todo"),
  };

  const sections: { key: string; title: string }[] = [
    { key: "in_progress", title: "In Progress" },
    { key: "blocked", title: "Blocked" },
    { key: "todo", title: "Assigned (To Do)" },
  ];

  const activeTaskCount = activeTasks.length;

  return (
    <>
      <ScrollArea className="h-full">
        <div className="p-4 space-y-6">
          {sections.map((section) => {
            const sectionTasks = tasksByStatus[section.key as keyof typeof tasksByStatus];
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
                        <TableHead className="w-[35%]">Task</TableHead>
                        <TableHead className="w-[20%]">Project</TableHead>
                        <TableHead className="w-[15%]">
                          {section.key === "in_progress" ? "Date" : getDateLabel(section.key)}
                        </TableHead>
                        <TableHead className="w-[30%] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sectionTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{task.title}</span>
                              {task.description && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => setSelectedTask(task)}
                                >
                                  <FileText className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {getProjectName(task.project_id)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatStatusDate(task)}
                          </TableCell>
                          <TableCell className="text-right">
                            {canModify && (
                              <div className="flex items-center justify-end gap-2">
                                {section.key !== "in_progress" && (
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
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          })}

          {activeTaskCount === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No active tasks.
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Task Description Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {selectedTask?.description || "No description available."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
