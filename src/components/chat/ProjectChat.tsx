import { useState, useRef, useEffect } from "react";
import { useProjectMessages, ProjectMessage } from "@/hooks/useProjectMessages";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Paperclip, Image, FileText, Loader2, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ProjectChatProps {
  projectId: string;
}

export function ProjectChat({ projectId }: ProjectChatProps) {
  const { user } = useAuth();
  const {
    messages,
    isLoading,
    hasMore,
    isLoadingMore,
    loadMore,
    sendMessage,
  } = useProjectMessages(projectId);

  const [messageText, setMessageText] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() && !attachmentFile) return;

    await sendMessage.mutateAsync({
      content: messageText.trim() || undefined,
      attachmentFile: attachmentFile || undefined,
    });

    setMessageText("");
    setAttachmentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 border rounded-lg bg-card overflow-hidden">
      {/* Load More Button */}
      {hasMore && (
        <div className="p-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="w-full"
          >
            {isLoadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ChevronUp className="h-4 w-4 mr-2" />
            )}
            Load older messages
          </Button>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.user_id === user?.id}
                getInitials={getInitials}
                isImage={isImage}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Attachment Preview */}
      {attachmentFile && (
        <div className="px-4 py-2 border-t bg-muted/50">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            <span className="truncate">{attachmentFile.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAttachmentFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Remove
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={sendMessage.isPending || (!messageText.trim() && !attachmentFile)}
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: ProjectMessage;
  isOwn: boolean;
  getInitials: (name: string) => string;
  isImage: (url: string) => boolean;
}

function MessageBubble({ message, isOwn, getInitials, isImage }: MessageBubbleProps) {
  return (
    <div className={cn("flex gap-3", isOwn && "flex-row-reverse")}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-xs">
          {getInitials(message.sender_name || "?")}
        </AvatarFallback>
      </Avatar>
      <div className={cn("flex flex-col max-w-[70%]", isOwn && "items-end")}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">{message.sender_name}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.created_at), "MMM d, h:mm a")}
          </span>
        </div>
        <div
          className={cn(
            "rounded-lg px-3 py-2",
            isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          {message.content && <p className="text-sm whitespace-pre-wrap">{message.content}</p>}
          {message.attachment_url && (
            <div className="mt-2">
              {isImage(message.attachment_url) ? (
                <a href={message.attachment_url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={message.attachment_url}
                    alt={message.attachment_name || "Attachment"}
                    className="max-w-full max-h-48 rounded object-cover"
                  />
                </a>
              ) : (
                <a
                  href={message.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-2 text-sm underline",
                    isOwn ? "text-primary-foreground" : "text-foreground"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  {message.attachment_name || "Attachment"}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
