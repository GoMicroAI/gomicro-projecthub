 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 
 interface TaskReporter {
   id: string;
   task_id: string;
   user_id: string;
   assigned_at: string;
 }
 
 export function useTaskReporters(taskId?: string) {
   const { user } = useAuth();
   const queryClient = useQueryClient();
 
   const { data: reporters = [], isLoading } = useQuery({
     queryKey: ["task-reporters", taskId],
     queryFn: async () => {
       if (!taskId) return [];
       const { data, error } = await supabase
         .from("task_reporters")
         .select("*")
         .eq("task_id", taskId);
 
       if (error) throw error;
       return data as TaskReporter[];
     },
     enabled: !!user && !!taskId,
   });
 
   const setReporters = useMutation({
     mutationFn: async ({ taskId, userIds }: { taskId: string; userIds: string[] }) => {
       // Delete existing reporters
       await supabase.from("task_reporters").delete().eq("task_id", taskId);
 
       // Insert new reporters
       if (userIds.length > 0) {
         const { error } = await supabase.from("task_reporters").insert(
           userIds.map((userId) => ({ task_id: taskId, user_id: userId }))
         );
         if (error) throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["task-reporters"] });
       queryClient.invalidateQueries({ queryKey: ["all-task-reporters"] });
     },
   });
 
   return {
     reporters,
     reporterUserIds: reporters.map((r) => r.user_id),
     isLoading,
     setReporters,
   };
 }
 
 // Hook to fetch all task reporters at once (for list views)
 export function useAllTaskReporters() {
   const { user } = useAuth();
 
   const { data: allReporters = [], isLoading } = useQuery({
     queryKey: ["all-task-reporters"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("task_reporters")
         .select("*");
 
       if (error) throw error;
       return data as TaskReporter[];
     },
     enabled: !!user,
     staleTime: 1000 * 60,
   });
 
   const getReportersForTask = (taskId: string) => {
     return allReporters.filter((r) => r.task_id === taskId).map((r) => r.user_id);
   };
 
   return {
     allReporters,
     getReportersForTask,
     isLoading,
   };
 }