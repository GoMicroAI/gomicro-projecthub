import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const channelRef = useRef<string | null>(null);

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

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    // Use a unique channel name per mount to avoid React StrictMode reuse issues
    const channelName = `task-assignees-realtime-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    channelRef.current = channelName;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task_assignees",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["all_task_assignees_global"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user, queryClient]);

  return { allAssignees, isLoading, refetch };
}
