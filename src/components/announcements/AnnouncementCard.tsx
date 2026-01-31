import { useState } from "react";
import { Announcement, useAnnouncementComments, useAnnouncementReactions } from "@/hooks/useAnnouncements";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Trash2, Paperclip, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ReactionPicker } from "./ReactionPicker";
import { CommentItem } from "./CommentItem";

interface AnnouncementCardProps {
  announcement: Announcement;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function AnnouncementCard({ announcement, onDelete, isDeleting }: AnnouncementCardProps) {
  const { user } = useAuth();
  const { comments, isLoading: commentsLoading, addComment } = useAnnouncementComments(announcement.id);
  const { groupedReactions, userReactions, toggleReaction } = useAnnouncementReactions(announcement.id);
  
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() && !attachmentFile) return;
    
    await addComment.mutateAsync({
      content: commentText,
      parentId: replyingTo || undefined,
      attachmentFile: attachmentFile || undefined,
    });
    
    setCommentText("");
    setAttachmentFile(null);
    setReplyingTo(null);
  };

  const isOwn = announcement.user_id === user?.id;
  const topLevelComments = comments.filter((c) => !c.parent_id);

  return (
    <Card>
      <CardHeader className="pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarImage src={announcement.author_avatar_url || undefined} alt={announcement.author_name || "User"} />
              <AvatarFallback className="text-xs sm:text-sm">{getInitials(announcement.author_name || "?")}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm sm:text-base">{announcement.author_name}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {format(new Date(announcement.created_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
          {isOwn && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDelete(announcement.id)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
        {/* Content */}
        <p className="whitespace-pre-wrap text-sm sm:text-base">{announcement.content}</p>

        {/* Image */}
        {announcement.image_url && (
          <a href={announcement.image_url} target="_blank" rel="noopener noreferrer">
            <img
              src={announcement.image_url}
              alt="Announcement"
              className="max-w-full max-h-64 sm:max-h-96 rounded-lg object-cover"
              loading="lazy"
              decoding="async"
            />
          </a>
        )}

        {/* Reactions */}
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(groupedReactions).map(([emoji, users]) => (
            <Button
              key={emoji}
              variant="outline"
              size="sm"
              onClick={() => toggleReaction.mutate(emoji)}
              className={cn(
                "h-8 px-2",
                userReactions.includes(emoji) && "bg-primary/10 border-primary"
              )}
            >
              <span className="mr-1">{emoji}</span>
              <span className="text-xs">{users.length}</span>
            </Button>
          ))}
          <ReactionPicker onSelect={(emoji) => toggleReaction.mutate(emoji)} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            {comments.length > 0 ? `${comments.length} Comments` : "Comment"}
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-4 pt-4 border-t">
            {commentsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <>
                {topLevelComments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    replies={comments.filter((c) => c.parent_id === comment.id)}
                    onReply={() => setReplyingTo(comment.id)}
                    getInitials={getInitials}
                  />
                ))}
              </>
            )}

            {/* Add Comment */}
            <div className="space-y-2">
              {replyingTo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Replying to comment</span>
                  <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                    Cancel
                  </Button>
                </div>
              )}
              
              {attachmentFile && (
                <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                  <Paperclip className="h-4 w-4" />
                  <span className="truncate">{attachmentFile.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => setAttachmentFile(null)}>
                    Remove
                  </Button>
                </div>
              )}
              
              <div className="flex items-start gap-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-h-[60px] resize-none"
                />
                  <div className="flex flex-col gap-1">
                  <label>
                    <Button variant="outline" size="icon" asChild title="Attach file (max 100MB)">
                      <span><Paperclip className="h-4 w-4" /></span>
                    </Button>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
                          if (file.size > MAX_FILE_SIZE) {
                            alert("File size must be less than 100MB");
                            e.target.value = "";
                            return;
                          }
                          setAttachmentFile(file);
                        }
                      }}
                    />
                  </label>
                  <Button
                    size="icon"
                    onClick={handleSubmitComment}
                    disabled={addComment.isPending || (!commentText.trim() && !attachmentFile)}
                  >
                    {addComment.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
