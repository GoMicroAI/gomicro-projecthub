import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface WorkHistoryEntry {
  id: string;
  user_id: string;
  date: string;
  time: string;
  task_summary: string;
  created_at: string;
  updated_at: string;
}

export function useWorkHistory(userId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workHistory = [], isLoading } = useQuery({
    queryKey: ["workHistory", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("work_history")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .order("time", { ascending: false });

      if (error) throw error;
      return data as WorkHistoryEntry[];
    },
    enabled: !!user && !!userId,
  });

  const addEntry = useMutation({
    mutationFn: async (taskSummary: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("work_history")
        .insert({
          user_id: user.id,
          task_summary: taskSummary,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workHistory"] });
      toast({ title: "Work entry added" });
    },
    onError: (error) => {
      toast({ title: "Failed to add entry", description: error.message, variant: "destructive" });
    },
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, taskSummary }: { id: string; taskSummary: string }) => {
      const { data, error } = await supabase
        .from("work_history")
        .update({ task_summary: taskSummary })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workHistory"] });
      toast({ title: "Entry updated" });
    },
    onError: (error) => {
      toast({ title: "Failed to update entry", description: error.message, variant: "destructive" });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("work_history")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workHistory"] });
      toast({ title: "Entry deleted" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete entry", description: error.message, variant: "destructive" });
    },
  });

  return {
    workHistory,
    isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
  };
}
