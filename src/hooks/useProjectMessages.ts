import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface ProjectMessage {
  id: string;
  project_id: string;
  user_id: string;
  content: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
  sender_name?: string;
  sender_email?: string;
  sender_avatar_url?: string | null;
}

const PAGE_SIZE = 20;

// Cache for team members to avoid repeated fetches
const memberCache = new Map<string, { name: string; email: string; avatar_url: string | null }>();

async function enrichMessagesWithSenders(messages: any[]): Promise<ProjectMessage[]> {
  if (messages.length === 0) return [];

  const userIds = [...new Set(messages.map((m) => m.user_id))];
  const uncachedUserIds = userIds.filter((id) => !memberCache.has(id));

  // Only fetch uncached members
  if (uncachedUserIds.length > 0) {
    const { data: members } = await supabase
      .from("team_members")
      .select("user_id, name, email, avatar_url")
      .in("user_id", uncachedUserIds);

    members?.forEach((m) => {
      memberCache.set(m.user_id, { name: m.name, email: m.email, avatar_url: m.avatar_url });
    });
  }

  return messages.map((msg) => ({
    ...msg,
    sender_name: memberCache.get(msg.user_id)?.name || "Unknown",
    sender_email: memberCache.get(msg.user_id)?.email || "",
    sender_avatar_url: memberCache.get(msg.user_id)?.avatar_url || null,
  }));
}

export function useProjectMessages(projectId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasMore, setHasMore] = useState(true);
  const [allMessages, setAllMessages] = useState<ProjectMessage[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch initial messages with aggressive caching
  const { data: initialMessages = [], isLoading, refetch } = useQuery({
    queryKey: ["project-messages", projectId, "initial"],
    queryFn: async () => {
      if (!projectId) return [];

      const { data: messages, error } = await supabase
        .from("project_messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (error) throw error;

      const enrichedMessages = await enrichMessagesWithSenders(messages);
      setHasMore(messages.length === PAGE_SIZE);
      return enrichedMessages.reverse();
    },
    enabled: !!projectId && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes - data considered fresh
    gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache
  });

  // Update allMessages when initialMessages changes
  useEffect(() => {
    if (initialMessages.length > 0) {
      setAllMessages(initialMessages);
    }
  }, [initialMessages]);

  // Load more (older) messages
  const loadMore = async () => {
    if (!projectId || !hasMore || isLoadingMore || allMessages.length === 0) return;

    setIsLoadingMore(true);
    const oldestMessage = allMessages[0];

    try {
      const { data: messages, error } = await supabase
        .from("project_messages")
        .select("*")
        .eq("project_id", projectId)
        .lt("created_at", oldestMessage.created_at)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (error) throw error;

      const enrichedMessages = await enrichMessagesWithSenders(messages);
      setHasMore(messages.length === PAGE_SIZE);
      setAllMessages((prev) => [...enrichedMessages.reverse(), ...prev]);
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };


  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({
      content,
      attachmentFile,
    }: {
      content?: string;
      attachmentFile?: File;
    }) => {
      if (!projectId || !user) throw new Error("Missing project or user");

      let attachment_url: string | null = null;
      let attachment_name: string | null = null;

      // Upload attachment if provided
      if (attachmentFile) {
        const fileName = `${projectId}/chat/${Date.now()}-${attachmentFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("project-files")
          .upload(fileName, attachmentFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("project-files")
          .getPublicUrl(fileName);

        attachment_url = urlData.publicUrl;
        attachment_name = attachmentFile.name;
      }

      const { data, error } = await supabase
        .from("project_messages")
        .insert({
          project_id: projectId,
          user_id: user.id,
          content: content || null,
          attachment_url,
          attachment_name,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!projectId || !user) return;

    const channel = supabase
      .channel(`project-messages-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_messages",
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          const newMsg = payload.new as ProjectMessage;

          // Get sender info
          const { data: member } = await supabase
            .from("team_members")
            .select("name, email, avatar_url")
            .eq("user_id", newMsg.user_id)
            .single();

          const enrichedMsg = {
            ...newMsg,
            sender_name: member?.name || "Unknown",
            sender_email: member?.email || "",
            sender_avatar_url: member?.avatar_url || null,
          };

          setAllMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === enrichedMsg.id)) return prev;
            return [...prev, enrichedMsg];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "project_messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const deletedId = payload.old.id;
          setAllMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, user]);

  return {
    messages: allMessages,
    isLoading,
    hasMore,
    isLoadingMore,
    loadMore,
    sendMessage,
    refetch,
  };
}
