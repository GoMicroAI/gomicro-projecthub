import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";
import type { TaskAssignee } from "@/hooks/useAllTaskAssignees";
import { Play } from "lucide-react";

type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"];
type Project = Database["public"]["Tables"]["projects"]["Row"];

interface TeamMemberListProps {
  members: TeamMember[];
  tasks: Task[];
  projects: Project[];
  allAssignees: TaskAssignee[];
  selectedMemberId: string | null;
  onSelectMember: (memberId: string) => void;
  isAdmin: boolean;
  currentUserId?: string;
}

export function TeamMemberList({
  members,
  tasks,
  projects,
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

  const truncateToWords = (text: string, maxWords: number) => {
    const words = text.split(" ");
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(" ") + "...";
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

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 pr-2">
        {members.map((member) => {
          const currentTask = getMemberCurrentTask(member.user_id);
          const isSelected = selectedMemberId === member.id;

          return (
            <Card
              key={member.id}
              className={cn(
                "p-2.5 sm:p-3 transition-all cursor-pointer hover:border-primary/50",
                isSelected && "border-primary bg-primary/5"
              )}
              onClick={() => onSelectMember(member.id)}
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={member.avatar_url || undefined} alt={member.name} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-sm font-medium truncate">{member.name}</h3>
              </div>

              {/* Current task - stacked below name */}
              {currentTask ? (
                <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-md bg-green-500/10 border border-green-500/20 mt-2">
                  <div className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-green-500/20 mt-0.5">
                    <Play className="w-2.5 h-2.5 text-green-600 fill-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-green-600/70 dark:text-green-400/70 leading-tight">
                      {getProjectName(currentTask.project_id)}
                    </p>
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 leading-tight">
                      {truncateToWords(currentTask.title, 3)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-2 py-1 rounded-md bg-muted/50 mt-2 inline-block">
                  <span className="text-xs text-muted-foreground">No active task</span>
                </div>
              )}
            </Card>
          );
        })}

        {members.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No team members yet.</p>
        )}
      </div>
    </ScrollArea>
  );
}
