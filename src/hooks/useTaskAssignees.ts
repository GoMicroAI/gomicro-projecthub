import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TaskAssignee {
  id: string;
  task_id: string;
  user_id: string;
  assigned_at: string;
}

export function useTaskAssignees(taskId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assignees = [], isLoading } = useQuery({
    queryKey: ["task_assignees", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const { data, error } = await supabase
        .from("task_assignees")
        .select("*")
        .eq("task_id", taskId);
      if (error) throw error;
      return data as TaskAssignee[];
    },
    enabled: !!user && !!taskId,
  });

  const setAssignees = useMutation({
    mutationFn: async ({ taskId, userIds }: { taskId: string; userIds: string[] }) => {
      // Delete existing assignees
      await supabase.from("task_assignees").delete().eq("task_id", taskId);
      
      // Insert new assignees
      if (userIds.length > 0) {
        const { error } = await supabase.from("task_assignees").insert(
          userIds.map((userId) => ({ task_id: taskId, user_id: userId }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task_assignees"] });
      queryClient.invalidateQueries({ queryKey: ["all_task_assignees"] });
    },
  });

  return { assignees, isLoading, setAssignees };
}

export function useAllTaskAssignees(projectId?: string) {
  const { user } = useAuth();

  const { data: assigneesByTask = {}, isLoading } = useQuery({
    queryKey: ["all_task_assignees", projectId],
    queryFn: async () => {
      // First get all tasks for this project
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id")
        .eq("project_id", projectId!);
      
      if (tasksError) throw tasksError;
      
      const taskIds = tasks.map((t) => t.id);
      if (taskIds.length === 0) return {};

      const { data, error } = await supabase
        .from("task_assignees")
        .select("*")
        .in("task_id", taskIds);
      
      if (error) throw error;

      // Group by task_id
      const grouped: Record<string, TaskAssignee[]> = {};
      (data as TaskAssignee[]).forEach((a) => {
        if (!grouped[a.task_id]) grouped[a.task_id] = [];
        grouped[a.task_id].push(a);
      });
      return grouped;
    },
    enabled: !!user && !!projectId,
  });

  return { assigneesByTask, isLoading };
}
