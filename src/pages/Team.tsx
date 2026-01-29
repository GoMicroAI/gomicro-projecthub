import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Trash2 } from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useUserRole } from "@/hooks/useUserRole";
import { InviteDialog } from "@/components/team/InviteDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import type { Database } from "@/integrations/supabase/types";

type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];

export default function Team() {
  const { teamMembers, isLoading, refetch, inviteTeamMember, deleteTeamMember } = useTeamMembers();
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { isAdmin } = useUserRole();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<TeamMember | undefined>();

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

  const getProjectById = (projectId: string) => {
    return projects.find((p) => p.id === projectId);
  };

  const handleInvite = async (data: {
    email: string;
    password: string;
    name: string;
    role: Database["public"]["Enums"]["app_role"];
  }) => {
    await inviteTeamMember.mutateAsync(data);
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    await deleteTeamMember.mutateAsync(deletingMember.id);
    setDeletingMember(undefined);
  };

  return (
    <AppLayout
      title="Team Members"
      onRefresh={() => refetch()}
      actions={
        isAdmin && (
          <Button onClick={() => setInviteDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Member
          </Button>
        )
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {teamMembers.map((member) => {
            const currentTask = getMemberCurrentTask(member.user_id);
            const project = currentTask ? getProjectById(currentTask.project_id) : null;

            return (
              <Card key={member.id} className="group">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-lg bg-primary/10 text-primary">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{member.name}</h3>
                        <Badge
                          variant="secondary"
                          className={
                            member.role === "admin"
                              ? "bg-status-active text-status-active-foreground"
                              : ""
                          }
                        >
                          {member.role}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            member.status === "active"
                              ? "border-status-done text-status-done"
                              : "border-status-paused text-status-paused"
                          }
                        >
                          {member.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      {currentTask ? (
                        <div className="text-sm bg-muted/50 rounded-lg px-3 py-2">
                          <span className="text-muted-foreground">Working on: </span>
                          <span className="font-medium">{project?.name}</span>
                          <span className="text-muted-foreground"> → </span>
                          <span>{currentTask.title}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No active task</p>
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => setDeletingMember(member)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && teamMembers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No team members yet.{" "}
            {isAdmin && "Invite your first team member to get started."}
          </p>
        </div>
      )}

      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSubmit={handleInvite}
      />

      <DeleteConfirmDialog
        open={!!deletingMember}
        onOpenChange={(open) => !open && setDeletingMember(undefined)}
        title="Remove Team Member"
        description={`Are you sure you want to remove "${deletingMember?.name}" from the team? They will lose access to all projects.`}
        onConfirm={handleDeleteMember}
        isDeleting={deleteTeamMember.isPending}
      />
    </AppLayout>
  );
}
