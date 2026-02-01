import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListTodo, CheckCircle2, ClipboardList } from "lucide-react";
import { ActiveTasksTab } from "./tabs/ActiveTasksTab";
import { CompletedTasksTab } from "./tabs/CompletedTasksTab";
import { WorkHistoryTab } from "./tabs/WorkHistoryTab";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Database } from "@/integrations/supabase/types";

type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"];

interface TaskAssignee {
  id: string;
  task_id: string;
  user_id: string;
  assigned_at: string;
}

interface MyTasksViewProps {
  member: TeamMember;
  tasks: Task[];
  allAssignees: TaskAssignee[];
}

export function MyTasksView({ member, tasks, allAssignees }: MyTasksViewProps) {
  const [activeTab, setActiveTab] = useState("active");
  const isMobile = useIsMobile();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get task IDs assigned to this member via task_assignees junction table
  const memberAssignees = allAssignees.filter((a) => a.user_id === member.user_id);
  const assignedTaskIds = memberAssignees.map((a) => a.task_id);
  const memberTasks = tasks.filter((t) => assignedTaskIds.includes(t.id));

  const tabs = [
    { value: "active", label: "Active Tasks", icon: ListTodo },
    { value: "completed", label: "Completed", icon: CheckCircle2 },
    { value: "worklog", label: "Work History", icon: ClipboardList },
  ];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={member.avatar_url || undefined} alt={member.name} />
            <AvatarFallback className="text-lg bg-primary/10 text-primary">
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">My Tasks</CardTitle>
            <p className="text-sm text-muted-foreground">{member.email}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* Mobile: Select dropdown */}
          {isMobile ? (
            <div className="p-4 pb-0">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tabs.map((tab) => (
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
          ) : (
            /* Desktop: Tabs */
            <div className="border-b px-4 pt-4">
              <TabsList className="w-full justify-start">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <TabsContent value="active" className="h-full m-0">
              <ActiveTasksTab
                tasks={memberTasks}
                memberAssignees={memberAssignees}
                canModify={true}
              />
            </TabsContent>

            <TabsContent value="completed" className="h-full m-0">
              <CompletedTasksTab tasks={memberTasks} />
            </TabsContent>

            <TabsContent value="worklog" className="h-full m-0">
              <WorkHistoryTab userId={member.user_id || ""} canModify={true} />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
