import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type ProjectFile = Database["public"]["Tables"]["files"]["Row"];

export function useFiles(projectId?: string, taskId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const PAGE_SIZE = 100; // Reasonable limit for files per project

  const { data: files = [], isLoading, refetch } = useQuery({
    queryKey: ["files", projectId, taskId],
    queryFn: async () => {
      let query = supabase
        .from("files")
        .select("*")
        .order("uploaded_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      if (taskId) {
        query = query.eq("task_id", taskId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProjectFile[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes - reduce unnecessary refetches
    gcTime: 1000 * 60 * 10, // 10 minutes cache
  });

  const uploadFile = useMutation({
    mutationFn: async ({
      file,
      projectId,
      taskId,
      folderId,
    }: {
      file: File;
      projectId: string;
      taskId?: string;
      folderId?: string;
    }) => {
      // Validate file size (max 100MB)
      const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size must be less than 100MB");
      }

      const fileName = `${projectId}/${Date.now()}-${file.name}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("project-files")
        .getPublicUrl(fileName);

      // Create file record
      const { data, error } = await supabase
        .from("files")
        .insert({
          project_id: projectId,
          task_id: taskId,
          folder_id: folderId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast({ title: "File uploaded successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to upload file", description: error.message, variant: "destructive" });
    },
  });

  const deleteFile = useMutation({
    mutationFn: async (fileRecord: ProjectFile) => {
      // Extract path from URL
      const url = new URL(fileRecord.file_url);
      const pathParts = url.pathname.split("/storage/v1/object/public/project-files/");
      const filePath = pathParts[1];

      if (filePath) {
        // Delete from storage
        await supabase.storage
          .from("project-files")
          .remove([filePath]);
      }

      // Delete record
      const { error } = await supabase
        .from("files")
        .delete()
        .eq("id", fileRecord.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast({ title: "File deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete file", description: error.message, variant: "destructive" });
    },
  });

  return {
    files,
    isLoading,
    refetch,
    uploadFile,
    deleteFile,
  };
}
