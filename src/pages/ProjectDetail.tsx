import { useState, useRef, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowLeft, Upload, ListTodo, FolderOpen, FolderPlus, MessageSquare, Info } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useFiles } from "@/hooks/useFiles";
import { useFolders } from "@/hooks/useFolders";
import { useUserRole } from "@/hooks/useUserRole";
import { useAllTaskAssignees, useTaskAssignees } from "@/hooks/useTaskAssignees";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";

import { ProjectDetailsSection } from "@/components/projects/ProjectDetailsSection";
import { TaskListItem } from "@/components/tasks/TaskListItem";
import { TaskDialogMultiAssign } from "@/components/tasks/TaskDialogMultiAssign";
import { FileListItem } from "@/components/files/FileListItem";
import { FolderItem } from "@/components/files/FolderItem";
import { CreateFolderDialog } from "@/components/files/CreateFolderDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { ProjectChat } from "@/components/chat/ProjectChat";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type ProjectFile = Database["public"]["Tables"]["files"]["Row"];
type Folder = Database["public"]["Tables"]["folders"]["Row"];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
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
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "tasks");
  
  const folderFileInputRef = useRef<HTMLInputElement>(null);

  // Update tab when URL changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["tasks", "files", "chat", "details"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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
      fixedHeight={activeTab === "chat"}
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/projects">
            <ArrowLeft className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Back</span>
          </Link>
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className={`${activeTab === "chat" ? "flex flex-col flex-1 min-h-0 gap-4" : "space-y-4 md:space-y-6"}`}>
          {/* Project Info - Hidden on chat tab for more space */}
          {activeTab !== "chat" && activeTab !== "details" && (
            <Card>
              <CardContent className="pt-4 md:pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg md:text-xl font-semibold">{project?.name}</h2>
                    {project && <ProjectStatusBadge status={project.status} />}
                  </div>
                  <div className="text-left sm:text-right text-xs md:text-sm text-muted-foreground shrink-0">
                    <p>Created {project && format(new Date(project.created_at), "MMM d, yyyy")}</p>
                    <p>{tasks.length} tasks • {files.length} files</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs: Tasks & Files */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className={`w-full ${activeTab === "chat" ? "flex-1 flex flex-col min-h-0" : ""}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="tasks" className="flex-1 sm:flex-initial gap-1 sm:gap-2 text-xs sm:text-sm">
                  <ListTodo className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Tasks</span> ({tasks.length})
                </TabsTrigger>
                <TabsTrigger value="files" className="flex-1 sm:flex-initial gap-1 sm:gap-2 text-xs sm:text-sm">
                  <FolderOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Files</span> ({files.length})
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex-1 sm:flex-initial gap-1 sm:gap-2 text-xs sm:text-sm">
                  <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Chat</span>
                </TabsTrigger>
                <TabsTrigger value="details" className="flex-1 sm:flex-initial gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Details</span>
                </TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                {/* Add Task - Admin only */}
                {isAdmin && activeTab === "tasks" && (
                  <Button size="sm" onClick={() => setTaskDialogOpen(true)} className="flex-1 sm:flex-initial">
                    <Plus className="h-4 w-4 mr-1 sm:mr-2" /> 
                    <span className="sm:inline">Add Task</span>
                  </Button>
                )}
                {/* Files actions */}
                {activeTab === "files" && (
                  <>
                    {/* New Folder - Admin only */}
                    {isAdmin && (
                      <Button variant="outline" size="sm" onClick={() => setFolderDialogOpen(true)}>
                        <FolderPlus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">New Folder</span>
                      </Button>
                    )}
                    {/* Upload - All users can upload */}
                    <label>
                      <Button size="sm" asChild>
                        <span>
                          <Upload className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Upload</span>
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
                    <p className="text-muted-foreground mb-2">No files or folders yet.</p>
                    <p className="text-xs text-muted-foreground mb-4">Max file size: 100MB</p>
                    <div className="flex justify-center gap-2">
                      {isAdmin && (
                        <Button variant="outline" onClick={() => setFolderDialogOpen(true)}>
                          <FolderPlus className="h-4 w-4 mr-2" /> Create Folder
                        </Button>
                      )}
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

            <TabsContent value="chat" className="mt-0 flex-1 flex flex-col min-h-0">
              {id && <ProjectChat projectId={id} />}
            </TabsContent>

            <TabsContent value="details" className="mt-0">
              {project && (
                <ProjectDetailsSection
                  description={project.description}
                  isAdmin={isAdmin}
                  onUpdate={async (description) => {
                    await updateProject.mutateAsync({
                      id: project.id,
                      description,
                    });
                  }}
                />
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
