import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useTasks } from "@/hooks/useTasks";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { useAllTaskAssigneesGlobal } from "@/hooks/useAllTaskAssignees";
import { InviteDialog } from "@/components/team/InviteDialog";
import { TeamMemberList } from "@/components/team/TeamMemberList";
import { MemberTasksPanel } from "@/components/team/MemberTasksPanel";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import type { Database } from "@/integrations/supabase/types";

export default function Team() {
  const { teamMembers, isLoading, refetch, inviteTeamMember } = useTeamMembers();
  const { tasks, refetch: refetchTasks } = useTasks();
  const { allAssignees, refetch: refetchAssignees } = useAllTaskAssigneesGlobal();
  const { isAdmin } = useUserRole();
  const { user } = useAuth();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const selectedMember = teamMembers.find((m) => m.id === selectedMemberId);
  
  // For non-admins, check if they're viewing their own profile
  const isViewingOwnProfile = selectedMember?.user_id === user?.id;
  // Non-admins can only view task panel for themselves
  const canViewTaskPanel = isAdmin || isViewingOwnProfile;

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
    const member = teamMembers.find((m) => m.id === memberId);
    // Non-admins can only select themselves
    if (!isAdmin && member?.user_id !== user?.id) {
      return; // Don't allow selection
    }
    setSelectedMemberId(memberId);
  };

  return (
    <AppLayout
      title="Team"
      onRefresh={handleRefresh}
      actions={
        isAdmin && (
          <Button onClick={() => setInviteDialogOpen(true)} size="sm" className="md:size-default">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Add Member</span>
          </Button>
        )
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="md:hidden h-[calc(100dvh-140px)]">
            {selectedMember && canViewTaskPanel ? (
              <div className="h-full flex flex-col">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMemberId(null)}
                  className="self-start mb-2"
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
              <div className="h-full overflow-auto">
                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                  Team Members ({teamMembers.length})
                </h2>
                <TeamMemberList
                  members={teamMembers}
                  tasks={tasks}
                  allAssignees={allAssignees}
                  selectedMemberId={selectedMemberId}
                  onSelectMember={handleSelectMember}
                  isAdmin={isAdmin}
                  currentUserId={user?.id}
                />
              </div>
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block h-[calc(100dvh-140px)]">
            <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
              {/* Team Member List */}
              <ResizablePanel defaultSize={35} minSize={25}>
                <div className="h-full p-4 overflow-auto">
                  <h2 className="text-sm font-medium text-muted-foreground mb-3">
                    Team Members ({teamMembers.length})
                  </h2>
                  <TeamMemberList
                    members={teamMembers}
                    tasks={tasks}
                    allAssignees={allAssignees}
                    selectedMemberId={selectedMemberId}
                    onSelectMember={handleSelectMember}
                    isAdmin={isAdmin}
                    currentUserId={user?.id}
                  />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Member Tasks Panel */}
              <ResizablePanel defaultSize={65} minSize={40}>
                <div className="h-full">
                  {selectedMember && canViewTaskPanel ? (
                    <MemberTasksPanel
                      member={selectedMember}
                      tasks={tasks}
                      allAssignees={allAssignees}
                      onClose={() => setSelectedMemberId(null)}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <p>
                        {isAdmin 
                          ? "Select a team member to view their tasks" 
                          : "Click on your name to view your tasks"}
                      </p>
                    </div>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </>
      )}

      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSubmit={handleInvite}
      />
    </AppLayout>
  );
}
