import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useTeamMembers } from "@/hooks/useTeamMembers";

interface UserAvatarProps {
  userId?: string | null;
  name?: string;
  avatarUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({ userId, name, avatarUrl, className, fallbackClassName }: UserAvatarProps) {
  const { teamMembers } = useTeamMembers();

  // If userId is provided, look up the member's info
  const member = userId ? teamMembers.find((m) => m.user_id === userId) : null;
  const displayName = name || member?.name || "?";
  const displayAvatar = avatarUrl ?? member?.avatar_url;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Avatar className={cn("h-8 w-8", className)}>
      <AvatarImage src={displayAvatar || undefined} alt={displayName} />
      <AvatarFallback className={cn("text-xs", fallbackClassName)}>
        {getInitials(displayName)}
      </AvatarFallback>
    </Avatar>
  );
}
