import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft, Upload, FileText, Trash2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useFiles } from "@/hooks/useFiles";
import { useUserRole } from "@/hooks/useUserRole";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type ProjectFile = Database["public"]["Tables"]["files"]["Row"];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { tasks, tasksByStatus, isLoading: tasksLoading, refetch, createTask, updateTask, deleteTask } = useTasks(id);
  const { teamMembers } = useTeamMembers();
  const { files, isLoading: filesLoading, uploadFile, deleteFile } = useFiles(id);
  const { isAdmin } = useUserRole();

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [deletingTask, setDeletingTask] = useState<Task | undefined>();
  const [deletingFile, setDeletingFile] = useState<ProjectFile | undefined>();

  const project = projects.find((p) => p.id === id);
  const isLoading = projectsLoading || tasksLoading || filesLoading;

  if (!project && !projectsLoading) {
    return (
      <AppLayout title="Project Not Found">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">This project doesn't exist or has been deleted.</p>
          <Button asChild>
            <Link to="/projects">Back to Projects</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleCreateTask = async (data: {
    title: string;
    description?: string;
    status?: Database["public"]["Enums"]["task_status"];
    priority?: Database["public"]["Enums"]["task_priority"];
    assigned_to?: string;
    due_date?: string;
  }) => {
    if (!id) return;
    await createTask.mutateAsync({
      project_id: id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assigned_to: data.assigned_to || undefined,
      due_date: data.due_date || undefined,
    });
  };

  const handleUpdateTask = async (data: {
    title: string;
    description?: string;
    status?: Database["public"]["Enums"]["task_status"];
    priority?: Database["public"]["Enums"]["task_priority"];
    assigned_to?: string;
    due_date?: string;
  }) => {
    if (!editingTask) return;
    await updateTask.mutateAsync({
      id: editingTask.id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assigned_to: data.assigned_to || null,
      due_date: data.due_date || null,
    });
    setEditingTask(undefined);
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;
    await deleteTask.mutateAsync(deletingTask.id);
    setDeletingTask(undefined);
  };

  const handleStatusChange = async (taskId: string, newStatus: Database["public"]["Enums"]["task_status"]) => {
    await updateTask.mutateAsync({ id: taskId, status: newStatus });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    await uploadFile.mutateAsync({ file, projectId: id });
    e.target.value = "";
  };

  const handleDeleteFile = async () => {
    if (!deletingFile) return;
    await deleteFile.mutateAsync(deletingFile);
    setDeletingFile(undefined);
  };

  return (
    <AppLayout
      title={project?.name || "Loading..."}
      onRefresh={() => refetch()}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Link>
          </Button>
          {isAdmin && (
            <>
              <label>
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" /> Upload File
                  </span>
                </Button>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploadFile.isPending}
                />
              </label>
              <Button onClick={() => setTaskDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Task
              </Button>
            </>
          )}
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">{project?.name}</h2>
                    {project && <ProjectStatusBadge status={project.status} />}
                  </div>
                  <p className="text-muted-foreground">
                    {project?.description || "No description"}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>Created {project && format(new Date(project.created_at), "MMM d, yyyy")}</p>
                  <p>{tasks.length} tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kanban Board */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Tasks</h3>
            <KanbanBoard
              tasksByStatus={tasksByStatus}
              teamMembers={teamMembers}
              isAdmin={isAdmin}
              onEditTask={(task) => {
                setEditingTask(task);
                setTaskDialogOpen(true);
              }}
              onDeleteTask={(task) => setDeletingTask(task)}
              onStatusChange={handleStatusChange}
            />
          </div>

          {/* Files */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Files</CardTitle>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No files uploaded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium hover:underline"
                          >
                            {file.file_name}
                          </a>
                          <p className="text-xs text-muted-foreground">
                            Uploaded {format(new Date(file.uploaded_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingFile(file)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {id && (
        <TaskDialog
          open={taskDialogOpen}
          onOpenChange={(open) => {
            setTaskDialogOpen(open);
            if (!open) setEditingTask(undefined);
          }}
          task={editingTask}
          projectId={id}
          teamMembers={teamMembers}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        />
      )}

      <DeleteConfirmDialog
        open={!!deletingTask}
        onOpenChange={(open) => !open && setDeletingTask(undefined)}
        title="Delete Task"
        description={`Are you sure you want to delete "${deletingTask?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteTask}
        isDeleting={deleteTask.isPending}
      />

      <DeleteConfirmDialog
        open={!!deletingFile}
        onOpenChange={(open) => !open && setDeletingFile(undefined)}
        title="Delete File"
        description={`Are you sure you want to delete "${deletingFile?.file_name}"? This action cannot be undone.`}
        onConfirm={handleDeleteFile}
        isDeleting={deleteFile.isPending}
      />
    </AppLayout>
  );
}
