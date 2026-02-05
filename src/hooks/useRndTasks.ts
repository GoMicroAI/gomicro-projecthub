 import { useEffect } from "react";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { useToast } from "@/hooks/use-toast";
 import type { Database } from "@/integrations/supabase/types";
 
 type Task = Database["public"]["Tables"]["tasks"]["Row"];
 type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];
 
 export function useRndTasks() {
   const { user } = useAuth();
   const { toast } = useToast();
   const queryClient = useQueryClient();
 
   const { data: rndTasks = [], isLoading, refetch } = useQuery({
     queryKey: ["rnd-tasks"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("tasks")
         .select("*")
         .eq("task_type", "rnd")
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       return data as Task[];
     },
     enabled: !!user,
     staleTime: 1000 * 60 * 1,
     gcTime: 1000 * 60 * 5,
   });
 
   // Subscribe to realtime changes for R&D tasks
   useEffect(() => {
     if (!user) return;
 
     const channel = supabase
       .channel("rnd-tasks-realtime")
       .on(
         "postgres_changes",
         {
           event: "*",
           schema: "public",
           table: "tasks",
         },
         () => {
           queryClient.invalidateQueries({ queryKey: ["rnd-tasks"] });
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [user, queryClient]);
 
   const updateTask = useMutation({
     mutationFn: async ({ id, ...updates }: { id: string } & TaskUpdate) => {
       const { data, error } = await supabase
         .from("tasks")
         .update(updates)
         .eq("id", id)
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["rnd-tasks"] });
       queryClient.invalidateQueries({ queryKey: ["tasks"] });
       toast({ title: "Task updated successfully" });
     },
     onError: (error) => {
       toast({ title: "Failed to update task", description: error.message, variant: "destructive" });
     },
   });
 
   const deleteTask = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from("tasks")
         .delete()
         .eq("id", id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["rnd-tasks"] });
       queryClient.invalidateQueries({ queryKey: ["tasks"] });
       toast({ title: "Task deleted successfully" });
     },
     onError: (error) => {
       toast({ title: "Failed to delete task", description: error.message, variant: "destructive" });
     },
   });
 
   return {
     rndTasks,
     isLoading,
     refetch,
     updateTask,
     deleteTask,
   };
 }