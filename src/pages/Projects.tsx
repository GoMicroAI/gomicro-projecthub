import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useUserRole } from "@/hooks/useUserRole";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  image_url?: string | null;
};

export default function Projects() {
  const { projects, isLoading, refetch, createProject, updateProject, deleteProject } = useProjects();
  const { tasks } = useTasks();
  const { teamMembers } = useTeamMembers();
  const { isAdmin } = useUserRole();
  
  const [search, setSearch] = useState("");
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [deletingProject, setDeletingProject] = useState<Project | undefined>();

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const getTaskCountForProject = (projectId: string) => {
    return tasks.filter((t) => t.project_id === projectId).length;
  };

  const handleCreateProject = async (data: {
    name: string;
    description?: string;
    status?: Database["public"]["Enums"]["project_status"];
    image_url?: string | null;
  }) => {
    await createProject.mutateAsync(data);
  };

  const handleUpdateProject = async (data: {
    name: string;
    description?: string;
    status?: Database["public"]["Enums"]["project_status"];
    image_url?: string | null;
  }) => {
    if (!editingProject) return;
    await updateProject.mutateAsync({ id: editingProject.id, ...data });
    setEditingProject(undefined);
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;
    await deleteProject.mutateAsync(deletingProject.id);
    setDeletingProject(undefined);
  };

  return (
    <AppLayout
      title="Projects"
      onRefresh={() => refetch()}
      actions={
        isAdmin && (
          <Button onClick={() => setProjectDialogOpen(true)} size="sm" className="md:size-default">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">New Project</span>
          </Button>
        )
      }
    >
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project as Project}
              isAdmin={isAdmin}
              teamMembers={teamMembers}
              taskCount={getTaskCountForProject(project.id)}
              onEdit={(p) => {
                setEditingProject(p);
                setProjectDialogOpen(true);
              }}
              onDelete={(p) => setDeletingProject(p)}
            />
          ))}
        </div>
      )}

      {!isLoading && filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {search
              ? "No projects match your search."
              : "No projects yet. " +
                (isAdmin ? "Create your first project to get started." : "")}
          </p>
        </div>
      )}

      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={(open) => {
          setProjectDialogOpen(open);
          if (!open) setEditingProject(undefined);
        }}
        project={editingProject}
        onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
      />

      <DeleteConfirmDialog
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(undefined)}
        title="Delete Project"
        description={`Are you sure you want to delete "${deletingProject?.name}"? This will also delete all associated tasks and files. This action cannot be undone.`}
        onConfirm={handleDeleteProject}
        isDeleting={deleteProject.isPending}
      />
    </AppLayout>
  );
}
