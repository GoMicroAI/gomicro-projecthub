import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowLeft, Upload, ListTodo, FolderOpen, FolderPlus } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useFiles } from "@/hooks/useFiles";
import { useFolders } from "@/hooks/useFolders";
import { useUserRole } from "@/hooks/useUserRole";
import { useAllTaskAssignees, useTaskAssignees } from "@/hooks/useTaskAssignees";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { EditableDescription } from "@/components/projects/EditableDescription";
import { TaskListItem } from "@/components/tasks/TaskListItem";
import { TaskDialogMultiAssign } from "@/components/tasks/TaskDialogMultiAssign";
import { FileListItem } from "@/components/files/FileListItem";
import { FolderItem } from "@/components/files/FolderItem";
import { CreateFolderDialog } from "@/components/files/CreateFolderDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type ProjectFile = Database["public"]["Tables"]["files"]["Row"];
type Folder = Database["public"]["Tables"]["folders"]["Row"];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { projects, isLoading: projectsLoading, updateProject } = useProjects();
  const { tasks, isLoading: tasksLoading, refetch, createTask, updateTask, deleteTask } = useTasks(id);
  const { teamMembers } = useTeamMembers();
  const { files, isLoading: filesLoading, uploadFile, deleteFile } = useFiles(id);
  const { folders, isLoading: foldersLoading, createFolder, deleteFolder, renameFolder } = useFolders(id);
  const { isAdmin } = useUserRole();
  const { assigneesByTask } = useAllTaskAssignees(id);
  const { setAssignees } = useTaskAssignees();

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [deletingTask, setDeletingTask] = useState<Task | undefined>();
  const [deletingFile, setDeletingFile] = useState<ProjectFile | undefined>();
  const [deletingFolder, setDeletingFolder] = useState<Folder | undefined>();
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [uploadTargetFolderId, setUploadTargetFolderId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState("tasks");
  
  const folderFileInputRef = useRef<HTMLInputElement>(null);

  const project = projects.find((p) => p.id === id);
  const isLoading = projectsLoading || tasksLoading || filesLoading || foldersLoading;

  // Files not in any folder (root level)
  const rootFiles = files.filter((f) => !f.folder_id);

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

  const handleDescriptionSave = async (description: string) => {
    if (!project) return;
    await updateProject.mutateAsync({
      id: project.id,
      description: description || null,
    });
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, folderId?: string) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    await uploadFile.mutateAsync({ file, projectId: id, folderId });
    e.target.value = "";
    setUploadTargetFolderId(undefined);
  };

  const handleUploadToFolder = (folderId: string) => {
    setUploadTargetFolderId(folderId);
    folderFileInputRef.current?.click();
  };

  const handleDeleteFile = async () => {
    if (!deletingFile) return;
    await deleteFile.mutateAsync(deletingFile);
    setDeletingFile(undefined);
  };

  const handleCreateFolder = async (name: string) => {
    if (!id) return;
    await createFolder.mutateAsync({ name, projectId: id });
  };

  const handleDeleteFolder = async () => {
    if (!deletingFolder) return;
    await deleteFolder.mutateAsync(deletingFolder.id);
    setDeletingFolder(undefined);
  };

  const handleRenameFolder = async (folderId: string, name: string) => {
    await renameFolder.mutateAsync({ folderId, name });
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
                <div className="space-y-2 flex-1 mr-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">{project?.name}</h2>
                    {project && <ProjectStatusBadge status={project.status} />}
                  </div>
                  <EditableDescription
                    description={project?.description || null}
                    isAdmin={isAdmin}
                    onSave={handleDescriptionSave}
                  />
                </div>
                <div className="text-right text-sm text-muted-foreground shrink-0">
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
                    <>
                      <Button variant="outline" onClick={() => setFolderDialogOpen(true)}>
                        <FolderPlus className="h-4 w-4 mr-2" /> New Folder
                      </Button>
                      <label>
                        <Button asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" /> Upload File
                          </span>
                        </Button>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e)}
                          disabled={uploadFile.isPending}
                        />
                      </label>
                    </>
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
              {files.length === 0 && folders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No files or folders yet.</p>
                    {isAdmin && (
                      <div className="flex justify-center gap-2">
                        <Button variant="outline" onClick={() => setFolderDialogOpen(true)}>
                          <FolderPlus className="h-4 w-4 mr-2" /> Create Folder
                        </Button>
                        <label>
                          <Button asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" /> Upload File
                            </span>
                          </Button>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e)}
                            disabled={uploadFile.isPending}
                          />
                        </label>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {/* Folders */}
                  {folders.map((folder) => (
                    <FolderItem
                      key={folder.id}
                      folder={folder}
                      files={files}
                      isAdmin={isAdmin}
                      onDelete={(folder) => setDeletingFolder(folder)}
                      onRename={handleRenameFolder}
                      onUploadToFolder={handleUploadToFolder}
                      onDeleteFile={(file) => setDeletingFile(file)}
                    />
                  ))}
                  
                  {/* Root level files (not in any folder) */}
                  {rootFiles.length > 0 && (
                    <>
                      {folders.length > 0 && (
                        <div className="pt-4 pb-2">
                          <p className="text-sm font-medium text-muted-foreground">Other Files</p>
                        </div>
                      )}
                      {rootFiles.map((file) => (
                        <FileListItem
                          key={file.id}
                          file={file}
                          isAdmin={isAdmin}
                          onDelete={(file) => setDeletingFile(file)}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Hidden input for folder uploads */}
      <input
        ref={folderFileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileUpload(e, uploadTargetFolderId)}
        disabled={uploadFile.isPending}
      />

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

      <CreateFolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        onSubmit={handleCreateFolder}
      />

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

      <DeleteConfirmDialog
        open={!!deletingFolder}
        onOpenChange={(open) => !open && setDeletingFolder(undefined)}
        title="Delete Folder"
        description={`Are you sure you want to delete "${deletingFolder?.name}"? All files in this folder will be moved to the root level.`}
        onConfirm={handleDeleteFolder}
        isDeleting={deleteFolder.isPending}
      />
    </AppLayout>
  );
}
