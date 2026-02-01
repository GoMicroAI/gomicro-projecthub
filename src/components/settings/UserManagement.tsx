import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { InviteDialog } from "@/components/team/InviteDialog";
import { PasswordConfirmDeleteDialog } from "@/components/shared/PasswordConfirmDeleteDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

export function UserManagement() {
  const { user } = useAuth();
  const { teamMembers, isLoading, inviteTeamMember, updateTeamMember, deleteTeamMember } = useTeamMembers();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const handleInvite = async (data: {
    email: string;
    password: string;
    name: string;
    role: AppRole;
  }) => {
    await inviteTeamMember.mutateAsync(data);
  };

  const handleRoleChange = async (memberId: string, newRole: AppRole) => {
    await updateTeamMember.mutateAsync({ id: memberId, role: newRole });
  };

  const handleDeleteClick = (member: TeamMember) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (memberToDelete) {
      await deleteTeamMember.mutateAsync(memberToDelete.id);
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
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

  // Check if this is the current user (prevent self-role change)
  const isCurrentUser = (member: TeamMember) => member.user_id === user?.id;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Add new team members, change roles, or remove existing ones.
            </CardDescription>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)} size="sm" className="w-full sm:w-auto shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamMembers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No team members yet. Add your first team member to get started.
              </p>
            ) : (
              teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={member.avatar_url || undefined} alt={member.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {member.name}
                        {isCurrentUser(member) && (
                          <span className="text-xs text-muted-foreground ml-2">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end sm:justify-start">
                    {/* Role selector - disabled for current user */}
                    {isCurrentUser(member) ? (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "shrink-0",
                          member.role === "admin" && "bg-status-active text-status-active-foreground"
                        )}
                      >
                        {member.role}
                      </Badge>
                    ) : (
                      <Select
                        value={member.role}
                        onValueChange={(value: AppRole) => handleRoleChange(member.id, value)}
                        disabled={updateTeamMember.isPending}
                      >
                        <SelectTrigger className="w-24 h-8 shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0",
                        member.status === "active" 
                          ? "border-green-500 text-green-600" 
                          : "border-yellow-500 text-yellow-600"
                      )}
                    >
                      {member.status}
                    </Badge>
                    {/* Can't delete yourself */}
                    {!isCurrentUser(member) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(member)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSubmit={handleInvite}
      />

      <PasswordConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        description={`Are you sure you want to delete ${memberToDelete?.name}? This action cannot be undone and will remove all their data.`}
        isDeleting={deleteTeamMember.isPending}
      />
    </>
  );
}