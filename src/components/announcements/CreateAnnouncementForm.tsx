import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, Send, Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamMembers } from "@/hooks/useTeamMembers";

interface CreateAnnouncementFormProps {
  onSubmit: (data: { content: string; imageFile?: File }) => Promise<void>;
  isPending: boolean;
}

export function CreateAnnouncementForm({ onSubmit, isPending }: CreateAnnouncementFormProps) {
  const { user } = useAuth();
  const { teamMembers } = useTeamMembers();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMember = teamMembers.find((m) => m.user_id === user?.id);
  const userName = currentMember?.name || "You";
  const avatarUrl = currentMember?.avatar_url;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) return;
    await onSubmit({ content: content.trim(), imageFile: imageFile || undefined });
    setContent("");
    clearImage();
  };

  return (
    <Card>
      <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="flex gap-2 sm:gap-3">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
            <AvatarImage src={avatarUrl || undefined} alt={userName} />
            <AvatarFallback className="text-xs sm:text-sm">{getInitials(userName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2 sm:space-y-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share an announcement with your team..."
              className="min-h-[60px] sm:min-h-[80px] resize-none text-sm sm:text-base"
            />

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-[150px] sm:max-w-xs max-h-24 sm:max-h-32 rounded-lg object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6"
                  onClick={clearImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <Image className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Add Image</span>
                </Button>
              </div>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isPending || (!content.trim() && !imageFile)}
                className="gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
                Post
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
