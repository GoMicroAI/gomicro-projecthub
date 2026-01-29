import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

export function useTeamMembers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teamMembers = [], isLoading, refetch } = useQuery({
    queryKey: ["teamMembers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!user,
  });

  const inviteTeamMember = useMutation({
    mutationFn: async ({ email, password, name, role }: { email: string; password: string; name: string; role: AppRole }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-team-member`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ email, password, name, role }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create team member");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      toast({ title: "Team member created successfully!" });
    },
    onError: (error) => {
      toast({ title: "Failed to create team member", description: error.message, variant: "destructive" });
    },
  });

  const updateTeamMember = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; role?: AppRole }) => {
      const { data, error } = await supabase
        .from("team_members")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      toast({ title: "Team member updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update team member", description: error.message, variant: "destructive" });
    },
  });

  const deleteTeamMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      toast({ title: "Team member removed successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to remove team member", description: error.message, variant: "destructive" });
    },
  });

  // Get active team members for assignment
  const activeMembers = teamMembers.filter((m) => m.status === "active");

  return {
    teamMembers,
    activeMembers,
    isLoading,
    refetch,
    inviteTeamMember,
    updateTeamMember,
    deleteTeamMember,
  };
}
