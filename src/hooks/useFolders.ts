import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Folder = Database["public"]["Tables"]["folders"]["Row"];

export function useFolders(projectId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: folders = [], isLoading, refetch } = useQuery({
    queryKey: ["folders", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("project_id", projectId)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Folder[];
    },
    enabled: !!user && !!projectId,
  });

  const createFolder = useMutation({
    mutationFn: async ({
      name,
      projectId,
      parentId,
      details,
    }: {
      name: string;
      projectId: string;
      parentId?: string;
      details?: string;
    }) => {
      const { data, error } = await supabase
        .from("folders")
        .insert({
          name,
          project_id: projectId,
          parent_id: parentId,
          created_by: user?.id,
          details,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast({ title: "Folder created successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to create folder", description: error.message, variant: "destructive" });
    },
  });

  const deleteFolder = useMutation({
    mutationFn: async (folderId: string) => {
      const { error } = await supabase
        .from("folders")
        .delete()
        .eq("id", folderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast({ title: "Folder deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete folder", description: error.message, variant: "destructive" });
    },
  });

  const renameFolder = useMutation({
    mutationFn: async ({ folderId, name }: { folderId: string; name: string }) => {
      const { data, error } = await supabase
        .from("folders")
        .update({ name })
        .eq("id", folderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast({ title: "Folder renamed successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to rename folder", description: error.message, variant: "destructive" });
    },
  });

  return {
    folders,
    isLoading,
    refetch,
    createFolder,
    deleteFolder,
    renameFolder,
  };
}
