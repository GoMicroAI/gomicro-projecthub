import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TaskAssignee {
  id: string;
  task_id: string;
  user_id: string;
  assigned_at: string;
}

export function useAllTaskAssigneesGlobal() {
  const { user } = useAuth();

  const { data: allAssignees = [], isLoading, refetch } = useQuery({
    queryKey: ["all_task_assignees_global"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_assignees")
        .select("*");

      if (error) throw error;
      return data as TaskAssignee[];
    },
    enabled: !!user,
  });

  return { allAssignees, isLoading, refetch };
}
