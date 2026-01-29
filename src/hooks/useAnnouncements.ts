import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Announcement {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_email?: string;
}

export interface AnnouncementComment {
  id: string;
  announcement_id: string;
  user_id: string;
  content: string;
  attachment_url: string | null;
  attachment_name: string | null;
  parent_id: string | null;
  created_at: string;
  author_name?: string;
  author_email?: string;
}

export interface AnnouncementReaction {
  id: string;
  user_id: string;
  announcement_id: string | null;
  comment_id: string | null;
  emoji: string;
  created_at: string;
}

const PAGE_SIZE = 10;

export function useAnnouncements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch announcements with pagination
  const { data: announcements = [], isLoading, refetch } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (error) throw error;

      // Get author info
      const userIds = [...new Set(data.map((a) => a.user_id))];
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id, name, email")
        .in("user_id", userIds);

      const memberMap = new Map(
        members?.map((m) => [m.user_id, { name: m.name, email: m.email }]) || []
      );

      return data.map((ann) => ({
        ...ann,
        author_name: memberMap.get(ann.user_id)?.name || "Unknown",
        author_email: memberMap.get(ann.user_id)?.email || "",
      })) as Announcement[];
    },
    enabled: !!user,
  });

  // Create announcement
  const createAnnouncement = useMutation({
    mutationFn: async ({ content, imageFile }: { content: string; imageFile?: File }) => {
      if (!user) throw new Error("Not authenticated");

      let image_url: string | null = null;

      if (imageFile) {
        const fileName = `announcements/${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("project-files")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("project-files")
          .getPublicUrl(fileName);

        image_url = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from("announcements")
        .insert({ user_id: user.id, content, image_url })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Announcement posted!" });
    },
    onError: (error) => {
      toast({ title: "Failed to post", description: error.message, variant: "destructive" });
    },
  });

  // Delete announcement
  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Announcement deleted" });
    },
  });

  // Setup realtime
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("announcements-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["announcements"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    announcements,
    isLoading,
    refetch,
    createAnnouncement,
    deleteAnnouncement,
  };
}

export function useAnnouncementComments(announcementId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["announcement-comments", announcementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcement_comments")
        .select("*")
        .eq("announcement_id", announcementId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id, name, email")
        .in("user_id", userIds);

      const memberMap = new Map(
        members?.map((m) => [m.user_id, { name: m.name, email: m.email }]) || []
      );

      return data.map((comment) => ({
        ...comment,
        author_name: memberMap.get(comment.user_id)?.name || "Unknown",
        author_email: memberMap.get(comment.user_id)?.email || "",
      })) as AnnouncementComment[];
    },
    enabled: !!user && !!announcementId,
  });

  const addComment = useMutation({
    mutationFn: async ({
      content,
      parentId,
      attachmentFile,
    }: {
      content: string;
      parentId?: string;
      attachmentFile?: File;
    }) => {
      if (!user) throw new Error("Not authenticated");

      let attachment_url: string | null = null;
      let attachment_name: string | null = null;

      if (attachmentFile) {
        const fileName = `announcements/comments/${Date.now()}-${attachmentFile.name}`;
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
        .from("announcement_comments")
        .insert({
          announcement_id: announcementId,
          user_id: user.id,
          content,
          parent_id: parentId || null,
          attachment_url,
          attachment_name,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcement-comments", announcementId] });
    },
    onError: (error) => {
      toast({ title: "Failed to comment", description: error.message, variant: "destructive" });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("announcement_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcement-comments", announcementId] });
    },
  });

  // Realtime for comments
  useEffect(() => {
    if (!user || !announcementId) return;

    const channel = supabase
      .channel(`comments-${announcementId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcement_comments",
          filter: `announcement_id=eq.${announcementId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["announcement-comments", announcementId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, announcementId, queryClient]);

  return { comments, isLoading, addComment, deleteComment };
}

export function useAnnouncementReactions(announcementId?: string, commentId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = announcementId
    ? ["announcement-reactions", announcementId]
    : ["comment-reactions", commentId];

  const { data: reactions = [] } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase.from("announcement_reactions").select("*");

      if (announcementId) {
        query = query.eq("announcement_id", announcementId);
      } else if (commentId) {
        query = query.eq("comment_id", commentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AnnouncementReaction[];
    },
    enabled: !!user && (!!announcementId || !!commentId),
  });

  const toggleReaction = useMutation({
    mutationFn: async (emoji: string) => {
      if (!user) throw new Error("Not authenticated");

      // Check if reaction exists
      let existingQuery = supabase
        .from("announcement_reactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("emoji", emoji);

      if (announcementId) {
        existingQuery = existingQuery.eq("announcement_id", announcementId);
      } else if (commentId) {
        existingQuery = existingQuery.eq("comment_id", commentId);
      }

      const { data: existing } = await existingQuery.single();

      if (existing) {
        // Remove reaction
        await supabase.from("announcement_reactions").delete().eq("id", existing.id);
      } else {
        // Add reaction
        await supabase.from("announcement_reactions").insert({
          user_id: user.id,
          announcement_id: announcementId || null,
          comment_id: commentId || null,
          emoji,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = [];
    acc[r.emoji].push(r.user_id);
    return acc;
  }, {} as Record<string, string[]>);

  const userReactions = reactions
    .filter((r) => r.user_id === user?.id)
    .map((r) => r.emoji);

  return { reactions, groupedReactions, userReactions, toggleReaction };
}
