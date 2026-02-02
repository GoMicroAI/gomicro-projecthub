import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ProjectLink {
  id: string;
  project_id: string;
  title: string;
  url: string;
  created_by: string | null;
  created_at: string;
}

export function useProjectLinks(projectId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["project-links", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("project_links")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectLink[];
    },
    enabled: !!user && !!projectId,
  });

  const createLink = useMutation({
    mutationFn: async ({ title, url, projectId }: { title: string; url: string; projectId: string }) => {
      const { data, error } = await supabase
        .from("project_links")
        .insert({
          project_id: projectId,
          title,
          url,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-links"] });
      toast({ title: "Link added successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to add link", description: error.message, variant: "destructive" });
    },
  });

  const deleteLink = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from("project_links")
        .delete()
        .eq("id", linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-links"] });
      toast({ title: "Link deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete link", description: error.message, variant: "destructive" });
    },
  });

  return {
    links,
    isLoading,
    createLink,
    deleteLink,
  };
}
