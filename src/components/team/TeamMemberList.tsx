import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";
import type { TaskAssignee } from "@/hooks/useAllTaskAssignees";
import { Play } from "lucide-react";

type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"];

interface TeamMemberListProps {
  members: TeamMember[];
  tasks: Task[];
  allAssignees: TaskAssignee[];
  selectedMemberId: string | null;
  onSelectMember: (memberId: string) => void;
  isAdmin: boolean;
  currentUserId?: string;
}

export function TeamMemberList({
  members,
  tasks,
  allAssignees,
  selectedMemberId,
  onSelectMember,
  isAdmin,
  currentUserId,
}: TeamMemberListProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getMemberCurrentTask = (userId: string | null) => {
    if (!userId) return null;
    // Find task IDs assigned to this user via junction table
    const assignedTaskIds = allAssignees
      .filter((a) => a.user_id === userId)
      .map((a) => a.task_id);
    // Find in-progress task
    return tasks.find(
      (t) => assignedTaskIds.includes(t.id) && t.status === "in_progress"
    );
  };

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const currentTask = getMemberCurrentTask(member.user_id);
        const isSelected = selectedMemberId === member.id;
        const isOwnProfile = member.user_id === currentUserId;
        // Non-admins can only click on their own profile
        const isClickable = isAdmin || isOwnProfile;

        return (
          <Card
            key={member.id}
            className={cn(
              "p-3 sm:p-4 transition-all",
              isClickable ? "cursor-pointer hover:border-primary/50" : "cursor-default opacity-80",
              isSelected && "border-primary bg-primary/5",
              isOwnProfile && !isAdmin && "ring-1 ring-primary/30"
            )}
            onClick={() => isClickable && onSelectMember(member.id)}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              {/* Avatar and name row */}
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={member.avatar_url || undefined} alt={member.name} />
                  <AvatarFallback className="text-sm bg-primary/10 text-primary">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium truncate">
                    {member.name}
                    {isOwnProfile && !isAdmin && (
                      <span className="text-xs text-muted-foreground ml-1">(You)</span>
                    )}
                  </h3>
                </div>
              </div>

              {/* Current task - highlighted section */}
              <div className="flex-1 min-w-0 sm:ml-auto sm:max-w-[60%]">
                {currentTask ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-500/10 border border-green-500/20">
                    <div className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20">
                      <Play className="w-3 h-3 text-green-600 fill-green-600" />
                    </div>
                    <span className="text-sm font-medium text-green-700 dark:text-green-400 truncate">
                      {currentTask.title}
                    </span>
                  </div>
                ) : (
                  <div className="px-3 py-2 rounded-md bg-muted/50">
                    <span className="text-sm text-muted-foreground">No active task</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}

      {members.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No team members yet.</p>
      )}
    </div>
  );
}
