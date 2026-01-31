import { AnnouncementComment, useAnnouncementReactions } from "@/hooks/useAnnouncements";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Reply, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ReactionPicker } from "./ReactionPicker";

interface CommentItemProps {
  comment: AnnouncementComment;
  replies?: AnnouncementComment[];
  onReply: () => void;
  getInitials: (name: string) => string;
  isReply?: boolean;
}

export function CommentItem({ comment, replies = [], onReply, getInitials, isReply = false }: CommentItemProps) {
  const { user } = useAuth();
  const { groupedReactions, userReactions, toggleReaction } = useAnnouncementReactions(undefined, comment.id);

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

  return (
    <div className={cn("space-y-2", isReply && "ml-8 pl-4 border-l")}>
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author_avatar_url || undefined} alt={comment.author_name || "User"} />
          <AvatarFallback className="text-xs">{getInitials(comment.author_name || "?")}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{comment.author_name}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(comment.created_at), "MMM d, h:mm a")}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          
          {/* Attachment */}
          {comment.attachment_url && (
            <div className="mt-2">
              {isImage(comment.attachment_url) ? (
                <a href={comment.attachment_url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={comment.attachment_url}
                    alt={comment.attachment_name || "Attachment"}
                    className="max-w-xs max-h-32 rounded object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
              ) : (
                <a
                  href={comment.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary underline"
                >
                  <FileText className="h-4 w-4" />
                  {comment.attachment_name || "Attachment"}
                </a>
              )}
            </div>
          )}

          {/* Reactions and Reply */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {Object.entries(groupedReactions).map(([emoji, users]) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                onClick={() => toggleReaction.mutate(emoji)}
                className={cn(
                  "h-6 px-1.5 text-xs",
                  userReactions.includes(emoji) && "bg-primary/10"
                )}
              >
                <span className="mr-0.5">{emoji}</span>
                <span>{users.length}</span>
              </Button>
            ))}
            <ReactionPicker onSelect={(emoji) => toggleReaction.mutate(emoji)} size="sm" />
            {!isReply && (
              <Button variant="ghost" size="sm" onClick={onReply} className="h-6 px-2 text-xs gap-1">
                <Reply className="h-3 w-3" />
                Reply
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          onReply={onReply}
          getInitials={getInitials}
          isReply
        />
      ))}
    </div>
  );
}
