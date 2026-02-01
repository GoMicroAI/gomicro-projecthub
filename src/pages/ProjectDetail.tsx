import { useState, useRef, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ArrowLeft, Upload, ListTodo, FolderOpen, FolderPlus, MessageSquare, Info, FileText } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useFiles } from "@/hooks/useFiles";
import { useFolders } from "@/hooks/useFolders";
import { useUserRole } from "@/hooks/useUserRole";
import { useAllTaskAssignees, useTaskAssignees } from "@/hooks/useTaskAssignees";
import { useProjectCustomTabs } from "@/hooks/useProjectCustomTabs";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { ProjectDetailsSection } from "@/components/projects/ProjectDetailsSection";
import { TaskListItem } from "@/components/tasks/TaskListItem";
import { TaskDialogMultiAssign } from "@/components/tasks/TaskDialogMultiAssign";
import { FileListItem } from "@/components/files/FileListItem";
import { FolderItem } from "@/components/files/FolderItem";
import { CreateFolderDialog } from "@/components/files/CreateFolderDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { ProjectChat } from "@/components/chat/ProjectChat";
import { CustomTabDialog } from "@/components/projects/CustomTabDialog";
import { CustomTabContent } from "@/components/projects/CustomTabContent";
import { useProjectMessages } from "@/hooks/useProjectMessages";
import { UserAvatar } from "@/components/shared/UserAvatar";
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
  const { messages } = useProjectMessages(id);
  const { customTabs, createTab, updateTab, deleteTab } = useProjectCustomTabs(id);

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [deletingTask, setDeletingTask] = useState<Task | undefined>();
  const [deletingFile, setDeletingFile] = useState<ProjectFile | undefined>();
  const [deletingFolder, setDeletingFolder] = useState<Folder | undefined>();
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [uploadTargetFolderId, setUploadTargetFolderId] = useState<string | undefined>();
  const [customTabDialogOpen, setCustomTabDialogOpen] = useState(false);
  const [deletingCustomTab, setDeletingCustomTab] = useState<{ id: string; name: string } | undefined>();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    return tab === "chat" ? "tasks" : (tab || "tasks");
  });
  const [chatOpen, setChatOpen] = useState(() => searchParams.get("tab") === "chat");
  
  const folderFileInputRef = useRef<HTMLInputElement>(null);

  // Update tab when URL changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "chat") {
      setChatOpen(true);
    } else if (tab && ["tasks", "files", "details"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const project = projects.find((p) => p.id === id);
  const isLoading = projectsLoading || tasksLoading || filesLoading || foldersLoading;

  // Files not in any folder (root level)
  const rootFiles = files.filter((f) => !f.folder_id);

  // Get latest message
  const latestMessage = messages[0];
  const latestMessageSender = latestMessage 
    ? teamMembers.find((m) => m.user_id === latestMessage.user_id)
    : null;

  // Check if active tab is a custom tab
  const isCustomTab = activeTab.startsWith("custom-");
  const activeCustomTab = isCustomTab 
    ? customTabs.find(t => `custom-${t.id}` === activeTab)
    : null;

  // All tabs for mobile selector
  const allTabs = [
    { value: "tasks", label: `Tasks (${tasks.length})`, icon: ListTodo },
    { value: "files", label: `Files (${files.length})`, icon: FolderOpen },
    { value: "details", label: "Details", icon: Info },
    ...customTabs.map(tab => ({
      value: `custom-${tab.id}`,
      label: tab.name,
      icon: FileText,
    })),
  ];

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

  const handleCreateCustomTab = async (data: { name: string; content: string }) => {
    await createTab.mutateAsync(data);
    setCustomTabDialogOpen(false);
  };

  const handleUpdateCustomTab = async (tabId: string, data: { name?: string; content?: string }) => {
    await updateTab.mutateAsync({ id: tabId, ...data });
  };

  const handleDeleteCustomTab = async () => {
    if (!deletingCustomTab) return;
    await deleteTab.mutateAsync(deletingCustomTab.id);
    setDeletingCustomTab(undefined);
    // Switch to tasks tab after deletion
    if (activeTab === `custom-${deletingCustomTab.id}`) {
      setActiveTab("tasks");
    }
  };

  // Chat view
  if (chatOpen && id) {
    return (
      <AppLayout
        title={`${project?.name || "Project"} - Chat`}
        actions={
          <Button variant="outline" size="sm" onClick={() => setChatOpen(false)}>
            <ArrowLeft className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Back to Project</span>
          </Button>
        }
      >
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <ProjectChat projectId={id} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={project?.name || "Loading..."}
      onRefresh={() => refetch()}
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
        <div className="flex flex-col h-full overflow-hidden">
          {/* Project Info Card with Chat Preview */}
          {activeTab !== "details" && !isCustomTab && (
            <Card className="shrink-0 mb-4">
              <CardContent className="pt-4 md:pt-6">
                <div className="flex flex-col gap-4">
                  {/* Project Header */}
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

                  {/* Chat Preview Bar */}
                  <div 
                    onClick={() => setChatOpen(true)}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border cursor-pointer hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 shrink-0">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium">Project Chat</span>
                        <span className="text-xs text-muted-foreground">
                          {messages.length} messages
                        </span>
                      </div>
                      {latestMessage ? (
                        <div className="flex items-center gap-2">
                          <UserAvatar 
                            userId={latestMessage.user_id} 
                            className="h-5 w-5"
                            fallbackClassName="text-[10px]"
                          />
                          <p className="text-sm text-muted-foreground truncate">
                            <span className="font-medium text-foreground">
                              {latestMessageSender?.name || "Unknown"}:
                            </span>{" "}
                            {latestMessage.content || "Sent an attachment"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No messages yet</p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0">
                      Open <MessageSquare className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs: Tasks, Files, Details, Custom Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              {/* Mobile: Dropdown selector */}
              <div className="sm:hidden w-full">
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allTabs.map((tab) => (
                      <SelectItem key={tab.value} value={tab.value}>
                        <div className="flex items-center gap-2">
                          <tab.icon className="h-4 w-4" />
                          {tab.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop: Tab list with custom tabs */}
              <div className="hidden sm:flex items-center gap-2">
                <TabsList className="w-auto">
                  <TabsTrigger value="tasks" className="gap-2 text-sm">
                    <ListTodo className="h-4 w-4" />
                    Tasks ({tasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="files" className="gap-2 text-sm">
                    <FolderOpen className="h-4 w-4" />
                    Files ({files.length})
                  </TabsTrigger>
                  <TabsTrigger value="details" className="gap-2 text-sm">
                    <Info className="h-4 w-4" />
                    Details
                  </TabsTrigger>
                  {customTabs.map((tab) => (
                    <TabsTrigger 
                      key={tab.id} 
                      value={`custom-${tab.id}`} 
                      className="gap-2 text-sm"
                    >
                      <FileText className="h-4 w-4" />
                      {tab.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {/* Add Details button - visible on desktop */}
                {isAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCustomTabDialogOpen(true)}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Details
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                {/* Mobile: Add Details button */}
                {isAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCustomTabDialogOpen(true)}
                    className="sm:hidden gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Details
                  </Button>
                )}
                
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

            <TabsContent value="tasks" className="mt-0 flex-1 overflow-hidden">
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
                <ScrollArea className="h-full">
                  <div className="space-y-2 pr-4">
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
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="files" className="mt-0 flex-1 overflow-hidden">
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
                <ScrollArea className="h-full">
                  <div className="space-y-2 pr-4">
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
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="details" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="pr-4">
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
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Custom Tab Contents */}
            {customTabs.map((tab) => (
              <TabsContent key={tab.id} value={`custom-${tab.id}`} className="mt-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="pr-4">
                    <CustomTabContent
                      tabId={tab.id}
                      name={tab.name}
                      content={tab.content}
                      isAdmin={isAdmin}
                      onUpdate={(data) => handleUpdateCustomTab(tab.id, data)}
                      onDelete={() => setDeletingCustomTab({ id: tab.id, name: tab.name })}
                      isPending={updateTab.isPending}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
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

      <CustomTabDialog
        open={customTabDialogOpen}
        onOpenChange={setCustomTabDialogOpen}
        onSubmit={handleCreateCustomTab}
        isPending={createTab.isPending}
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

      <DeleteConfirmDialog
        open={!!deletingCustomTab}
        onOpenChange={(open) => !open && setDeletingCustomTab(undefined)}
        title="Delete Tab"
        description={`Are you sure you want to delete the "${deletingCustomTab?.name}" tab? This action cannot be undone.`}
        onConfirm={handleDeleteCustomTab}
        isDeleting={deleteTab.isPending}
      />
    </AppLayout>
  );
}
