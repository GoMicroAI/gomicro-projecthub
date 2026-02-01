import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProjects } from "@/hooks/useProjects";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

interface CompletedTasksTabProps {
  tasks: Task[];
}

export function CompletedTasksTab({ tasks }: CompletedTasksTabProps) {
  const { projects } = useProjects();

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  const doneTasks = tasks.filter((t) => t.status === "done");

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <h3 className="font-medium text-sm text-muted-foreground mb-2">
          Completed Tasks ({doneTasks.length})
        </h3>
        {doneTasks.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[45%]">Task</TableHead>
                  <TableHead className="w-[30%]">Project</TableHead>
                  <TableHead className="w-[25%]">Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doneTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {getProjectName(task.project_id)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(task.updated_at), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No completed tasks yet.
          </p>
        )}
      </div>
    </ScrollArea>
  );
}
