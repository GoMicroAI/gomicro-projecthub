import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { useAllTaskAssigneesGlobal } from "@/hooks/useAllTaskAssignees";
import { InviteDialog } from "@/components/team/InviteDialog";
import { TeamMemberList } from "@/components/team/TeamMemberList";
import { MemberTasksPanel } from "@/components/team/MemberTasksPanel";
import { MyTasksView } from "@/components/team/MyTasksView";
import type { Database } from "@/integrations/supabase/types";

export default function Team() {
  const { teamMembers, isLoading, refetch, inviteTeamMember } = useTeamMembers();
  const { tasks, refetch: refetchTasks } = useTasks();
  const { projects } = useProjects();
  const { allAssignees, refetch: refetchAssignees } = useAllTaskAssigneesGlobal();
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  const { user } = useAuth();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Filter out only the main admin (sivam.common@gmail.com) from the team list
  const visibleMembers = teamMembers.filter((m) => m.email !== "sivam.common@gmail.com");

  // Find current user's team member record
  const currentUserMember = teamMembers.find((m) => m.user_id === user?.id);

  const selectedMember = visibleMembers.find((m) => m.id === selectedMemberId);

  const handleInvite = async (data: {
    email: string;
    password: string;
    name: string;
    role: Database["public"]["Enums"]["app_role"];
  }) => {
    await inviteTeamMember.mutateAsync(data);
  };

  const handleRefresh = () => {
    refetch();
    refetchTasks();
    refetchAssignees();
  };

  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
  };

  // Show loading while role is being determined
  if (isLoading || isRoleLoading) {
    return (
      <AppLayout title={isAdmin ? "Team" : "My Tasks"}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  // Non-admin users: Show only "My Tasks" view
  if (!isAdmin && currentUserMember) {
    return (
      <AppLayout title="My Work" onRefresh={handleRefresh}>
        <div className="h-full overflow-hidden">
          <MyTasksView
            member={currentUserMember}
            tasks={tasks}
            allAssignees={allAssignees}
          />
        </div>
      </AppLayout>
    );
  }

  // Admin view: Full team management
  return (
    <AppLayout
      title="Team"
      onRefresh={handleRefresh}
      actions={
        <Button onClick={() => setInviteDialogOpen(true)} size="sm" className="md:size-default">
          <Plus className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Add Member</span>
        </Button>
      }
    >
      {/* Mobile View */}
      <div className="md:hidden h-full overflow-hidden">
        {selectedMember ? (
          <div className="h-full flex flex-col">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMemberId(null)}
              className="self-start mb-2 shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Team
            </Button>
            <div className="flex-1 overflow-hidden">
              <MemberTasksPanel
                member={selectedMember}
                tasks={tasks}
                allAssignees={allAssignees}
                onClose={() => setSelectedMemberId(null)}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col overflow-hidden">
            <h2 className="text-sm font-medium text-muted-foreground mb-3 shrink-0">
              Team Members ({visibleMembers.length})
            </h2>
            <div className="flex-1 overflow-hidden">
              <TeamMemberList
                members={visibleMembers}
                tasks={tasks}
                projects={projects}
                allAssignees={allAssignees}
                selectedMemberId={selectedMemberId}
                onSelectMember={handleSelectMember}
                isAdmin={true}
                currentUserId={user?.id}
              />
            </div>
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex h-full overflow-hidden rounded-lg border">
        {/* Team Member List - Fixed 30% width */}
        <div className="w-[30%] min-w-[280px] h-full flex flex-col p-4 overflow-hidden border-r">
          <h2 className="text-sm font-medium text-muted-foreground mb-3 shrink-0">
            Team Members ({visibleMembers.length})
          </h2>
          <div className="flex-1 overflow-hidden">
            <TeamMemberList
              members={visibleMembers}
              tasks={tasks}
              projects={projects}
              allAssignees={allAssignees}
              selectedMemberId={selectedMemberId}
              onSelectMember={handleSelectMember}
              isAdmin={true}
              currentUserId={user?.id}
            />
          </div>
        </div>

        {/* Member Tasks Panel - Fixed 70% width */}
        <div className="w-[70%] h-full overflow-hidden">
          {selectedMember ? (
            <MemberTasksPanel
              member={selectedMember}
              tasks={tasks}
              allAssignees={allAssignees}
              onClose={() => setSelectedMemberId(null)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p>Select a team member to view their tasks</p>
            </div>
          )}
        </div>
      </div>

      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSubmit={handleInvite}
      />
    </AppLayout>
  );
}
