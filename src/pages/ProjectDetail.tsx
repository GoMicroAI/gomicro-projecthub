import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowLeft, Upload, ListTodo, FolderOpen } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useFiles } from "@/hooks/useFiles";
import { useUserRole } from "@/hooks/useUserRole";
import { useAllTaskAssignees, useTaskAssignees } from "@/hooks/useTaskAssignees";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { TaskListItem } from "@/components/tasks/TaskListItem";
import { TaskDialogMultiAssign } from "@/components/tasks/TaskDialogMultiAssign";
import { FileListItem } from "@/components/files/FileListItem";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type ProjectFile = Database["public"]["Tables"]["files"]["Row"];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { tasks, isLoading: tasksLoading, refetch, createTask, updateTask, deleteTask } = useTasks(id);
  const { teamMembers } = useTeamMembers();
  const { files, isLoading: filesLoading, uploadFile, deleteFile } = useFiles(id);
  const { isAdmin } = useUserRole();
  const { assigneesByTask } = useAllTaskAssignees(id);
  const { setAssignees } = useTaskAssignees();

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [deletingTask, setDeletingTask] = useState<Task | undefined>();
  const [deletingFile, setDeletingFile] = useState<ProjectFile | undefined>();
  const [activeTab, setActiveTab] = useState("tasks");

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

  const getAssigneesForTask = (taskId: string) => {
    const taskAssignees = assigneesByTask[taskId] || [];
    const userIds = taskAssignees.map((a) => a.user_id);
    return teamMembers.filter((m) => userIds.includes(m.user_id || m.id));
  };

  const getAssigneeIdsForTask = (taskId: string) => {
    const taskAssignees = assigneesByTask[taskId] || [];
    return taskAssignees.map((a) => a.user_id);
  };

  const handleCreateTask = async (data: {
    title: string;
    description?: string;
    status?: Database["public"]["Enums"]["task_status"];
    priority?: Database["public"]["Enums"]["task_priority"];
    due_date?: string;
    assignees: string[];
  }) => {
    if (!id) return;
    const result = await createTask.mutateAsync({
      project_id: id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      due_date: data.due_date || undefined,
    });
    
    // Set assignees for the new task
    if (data.assignees.length > 0) {
      await setAssignees.mutateAsync({
        taskId: result.id,
        userIds: data.assignees,
      });
    }
  };

  const handleUpdateTask = async (data: {
    title: string;
    description?: string;
    status?: Database["public"]["Enums"]["task_status"];
    priority?: Database["public"]["Enums"]["task_priority"];
    due_date?: string;
    assignees: string[];
  }) => {
    if (!editingTask) return;
    await updateTask.mutateAsync({
      id: editingTask.id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      due_date: data.due_date || null,
    });
    
    // Update assignees
    await setAssignees.mutateAsync({
      taskId: editingTask.id,
      userIds: data.assignees,
    });
    
    setEditingTask(undefined);
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;
    await deleteTask.mutateAsync(deletingTask.id);
    setDeletingTask(undefined);
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
                  <p>{tasks.length} tasks • {files.length} files</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs: Tasks & Files */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="tasks" className="gap-2">
                  <ListTodo className="h-4 w-4" />
                  Tasks ({tasks.length})
                </TabsTrigger>
                <TabsTrigger value="files" className="gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Files ({files.length})
                </TabsTrigger>
              </TabsList>
              
              {isAdmin && (
                <div className="flex gap-2">
                  {activeTab === "tasks" && (
                    <Button onClick={() => setTaskDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Add Task
                    </Button>
                  )}
                  {activeTab === "files" && (
                    <label>
                      <Button asChild>
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
                  )}
                </div>
              )}
            </div>

            <TabsContent value="tasks" className="mt-0">
              {tasks.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No tasks yet.</p>
                    {isAdmin && (
                      <Button onClick={() => setTaskDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Add First Task
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <TaskListItem
                      key={task.id}
                      task={task}
                      isAdmin={isAdmin}
                      assignees={getAssigneesForTask(task.id)}
                      onEdit={(task) => {
                        setEditingTask(task);
                        setTaskDialogOpen(true);
                      }}
                      onDelete={(task) => setDeletingTask(task)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="files" className="mt-0">
              {files.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No files uploaded yet.</p>
                    {isAdmin && (
                      <label>
                        <Button asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" /> Upload First File
                          </span>
                        </Button>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={uploadFile.isPending}
                        />
                      </label>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <FileListItem
                      key={file.id}
                      file={file}
                      isAdmin={isAdmin}
                      onDelete={(file) => setDeletingFile(file)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {id && (
        <TaskDialogMultiAssign
          open={taskDialogOpen}
          onOpenChange={(open) => {
            setTaskDialogOpen(open);
            if (!open) setEditingTask(undefined);
          }}
          task={editingTask}
          projectId={id}
          teamMembers={teamMembers}
          currentAssignees={editingTask ? getAssigneeIdsForTask(editingTask.id) : []}
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
