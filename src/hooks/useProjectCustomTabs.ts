import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface ProjectCustomTab {
  id: string;
  project_id: string;
  name: string;
  content: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export function useProjectCustomTabs(projectId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: customTabs = [], isLoading, refetch } = useQuery({
    queryKey: ["project-custom-tabs", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_custom_tabs")
        .select("*")
        .eq("project_id", projectId)
        .order("position", { ascending: true })
        .limit(50);

      if (error) throw error;
      return data as ProjectCustomTab[];
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-custom-tabs-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_custom_tabs",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["project-custom-tabs", projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  const createTab = useMutation({
    mutationFn: async ({ name, content = "" }: { name: string; content?: string }) => {
      if (!projectId) throw new Error("Project ID required");
      
      // Get max position
      const maxPosition = customTabs.length > 0 
        ? Math.max(...customTabs.map(t => t.position)) + 1 
        : 0;

      const { data, error } = await supabase
        .from("project_custom_tabs")
        .insert({
          project_id: projectId,
          name,
          content,
          position: maxPosition,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-custom-tabs", projectId] });
    },
  });

  const updateTab = useMutation({
    mutationFn: async ({ id, name, content }: { id: string; name?: string; content?: string }) => {
      const updates: Partial<ProjectCustomTab> = {};
      if (name !== undefined) updates.name = name;
      if (content !== undefined) updates.content = content;

      const { data, error } = await supabase
        .from("project_custom_tabs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-custom-tabs", projectId] });
    },
  });

  const deleteTab = useMutation({
    mutationFn: async (tabId: string) => {
      const { error } = await supabase
        .from("project_custom_tabs")
        .delete()
        .eq("id", tabId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-custom-tabs", projectId] });
    },
  });

  return {
    customTabs,
    isLoading,
    refetch,
    createTab,
    updateTab,
    deleteTab,
  };
}
