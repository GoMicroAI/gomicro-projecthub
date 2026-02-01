import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban, CheckSquare, Users, ArrowRight, Megaphone } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useUserRole } from "@/hooks/useUserRole";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { AnnouncementsFeed } from "@/components/announcements/AnnouncementsFeed";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];

export default function Dashboard() {
  const { projects, isLoading: projectsLoading, refetch, createProject } = useProjects();
  const { tasks, tasksByStatus, isLoading: tasksLoading } = useTasks();
  const { teamMembers, isLoading: membersLoading } = useTeamMembers();
  const { isAdmin } = useUserRole();
  
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  const handleCreateProject = async (data: {
    name: string;
    description?: string;
    status?: Database["public"]["Enums"]["project_status"];
  }) => {
    await createProject.mutateAsync(data);
  };

  const getTaskCountForProject = (projectId: string) => {
    return tasks.filter((t) => t.project_id === projectId).length;
  };

  const getMemberCurrentTask = (userId: string | null) => {
    if (!userId) return null;
    return tasks.find((t) => t.assigned_to === userId && t.status === "in_progress");
  };

  const getProjectById = (projectId: string) => {
    return projects.find((p) => p.id === projectId);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isLoading = projectsLoading || tasksLoading || membersLoading;

  const taskStats = [
    { status: "todo" as const, count: tasksByStatus.todo.length, label: "To Do" },
    { status: "in_progress" as const, count: tasksByStatus.in_progress.length, label: "In Progress" },
    { status: "blocked" as const, count: tasksByStatus.blocked.length, label: "Blocked" },
    { status: "done" as const, count: tasksByStatus.done.length, label: "Done" },
  ];

  return (
    <AppLayout
      title="Dashboard"
      onRefresh={() => refetch()}
      actions={
        isAdmin && (
          <Button onClick={() => setProjectDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Project
          </Button>
        )
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <ScrollArea className="h-full">
          <div className="space-y-8 pr-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <FolderKanban className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{projects.length}</p>
                    <p className="text-sm text-muted-foreground">Projects</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-status-in-progress/10">
                    <CheckSquare className="h-6 w-6 text-status-in-progress" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{tasks.length}</p>
                    <p className="text-sm text-muted-foreground">Total Tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-status-done/10">
                    <CheckSquare className="h-6 w-6 text-status-done" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{tasksByStatus.done.length}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-muted">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {teamMembers.filter((m) => m.status === "active").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Task Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {taskStats.map((stat) => (
                  <div
                    key={stat.status}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <TaskStatusBadge status={stat.status} />
                      <p className="text-2xl font-bold mt-2">{stat.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-6">
            {/* Projects */}
            <div className="col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Recent Projects</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/projects">
                      View All <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {projects.slice(0, 4).map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        isAdmin={isAdmin}
                        taskCount={getTaskCountForProject(project.id)}
                      />
                    ))}
                  </div>
                  {projects.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No projects yet.{" "}
                      {isAdmin && "Create your first project to get started."}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Team Activity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Team Activity</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/team">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers
                    .filter((m) => m.status === "active")
                    .slice(0, 6)
                    .map((member) => {
                      const currentTask = getMemberCurrentTask(member.user_id);
                      const project = currentTask
                        ? getProjectById(currentTask.project_id)
                        : null;

                      return (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar_url || undefined} alt={member.name} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {member.name}
                            </p>
                            {currentTask ? (
                              <p className="text-xs text-muted-foreground truncate">
                                {project?.name} → {currentTask.title}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No active task
                              </p>
                            )}
                          </div>
                          {currentTask && (
                            <TaskStatusBadge
                              status="in_progress"
                              className="text-xs"
                            />
                          )}
                        </div>
                      );
                    })}
                  {teamMembers.filter((m) => m.status === "active").length ===
                    0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No active team members yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Announcements Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Megaphone className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Announcements</h2>
            </div>
            <AnnouncementsFeed />
          </div>
          </div>
        </ScrollArea>
      )}

      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        onSubmit={handleCreateProject}
      />
    </AppLayout>
  );
}
