import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LatestMessage {
  project_id: string;
  content: string | null;
  sender_name: string;
  created_at: string;
}

export function useLatestProjectMessages(projectIds: string[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["latest-project-messages", projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return new Map<string, LatestMessage>();

      // Get the latest message for each project
      const { data: messages, error } = await supabase
        .from("project_messages")
        .select("id, project_id, content, user_id, created_at")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by project and take the first (latest) message
      const latestByProject = new Map<string, typeof messages[0]>();
      for (const msg of messages) {
        if (!latestByProject.has(msg.project_id)) {
          latestByProject.set(msg.project_id, msg);
        }
      }

      // Get sender names
      const userIds = [...new Set([...latestByProject.values()].map((m) => m.user_id))];
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id, name")
        .in("user_id", userIds);

      const memberMap = new Map(members?.map((m) => [m.user_id, m.name]) || []);

      // Build the result map
      const result = new Map<string, LatestMessage>();
      for (const [projectId, msg] of latestByProject) {
        result.set(projectId, {
          project_id: projectId,
          content: msg.content,
          sender_name: memberMap.get(msg.user_id) || "Unknown",
          created_at: msg.created_at,
        });
      }

      return result;
    },
    enabled: !!user && projectIds.length > 0,
  });
}
