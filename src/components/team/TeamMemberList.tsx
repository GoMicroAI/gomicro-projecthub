import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"];

interface TeamMemberListProps {
  members: TeamMember[];
  tasks: Task[];
  selectedMemberId: string | null;
  onSelectMember: (memberId: string) => void;
}

export function TeamMemberList({
  members,
  tasks,
  selectedMemberId,
  onSelectMember,
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
    return tasks.find((t) => t.assigned_to === userId && t.status === "in_progress");
  };

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const currentTask = getMemberCurrentTask(member.user_id);
        const isSelected = selectedMemberId === member.id;

        return (
          <Card
            key={member.id}
            className={cn(
              "p-4 cursor-pointer transition-all hover:border-primary/50",
              isSelected && "border-primary bg-primary/5"
            )}
            onClick={() => onSelectMember(member.id)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm bg-primary/10 text-primary">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{member.name}</h3>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      member.role === "admin"
                        ? "bg-status-active text-status-active-foreground"
                        : ""
                    )}
                  >
                    {member.role}
                  </Badge>
                </div>
                {currentTask ? (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    <span className="text-status-active">●</span> {currentTask.title}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-0.5">No active task</p>
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
