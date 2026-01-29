import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type TaskStatus = Database["public"]["Enums"]["task_status"];
type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];

interface KanbanBoardProps {
  tasksByStatus: Record<TaskStatus, Task[]>;
  teamMembers: TeamMember[];
  isAdmin: boolean;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onTaskClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

const columns: { status: TaskStatus; title: string; className: string }[] = [
  { status: "todo", title: "To Do", className: "bg-status-todo/10 border-status-todo" },
  { status: "in_progress", title: "In Progress", className: "bg-status-in-progress/10 border-status-in-progress" },
  { status: "blocked", title: "Blocked", className: "bg-status-blocked/10 border-status-blocked" },
  { status: "done", title: "Done", className: "bg-status-done/10 border-status-done" },
];

export function KanbanBoard({
  tasksByStatus,
  teamMembers,
  isAdmin,
  onEditTask,
  onDeleteTask,
  onTaskClick,
  onStatusChange,
}: KanbanBoardProps) {
  const getAssignee = (assignedTo: string | null) => {
    if (!assignedTo) return undefined;
    return teamMembers.find((m) => m.user_id === assignedTo);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (!isAdmin) return;
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    if (!isAdmin) return;
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId && onStatusChange) {
      onStatusChange(taskId, status);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-4 min-h-[500px]">
      {columns.map((column) => (
        <div
          key={column.status}
          className={cn(
            "rounded-lg border-t-4 p-3",
            column.className
          )}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.status)}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">{column.title}</h3>
            <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
              {tasksByStatus[column.status]?.length || 0}
            </span>
          </div>
          <div className="space-y-2">
            {tasksByStatus[column.status]?.map((task) => (
              <div
                key={task.id}
                draggable={isAdmin}
                onDragStart={(e) => handleDragStart(e, task.id)}
                className={isAdmin ? "cursor-grab active:cursor-grabbing" : ""}
              >
                <TaskCard
                  task={task}
                  isAdmin={isAdmin}
                  assignee={getAssignee(task.assigned_to)}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onClick={onTaskClick}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
