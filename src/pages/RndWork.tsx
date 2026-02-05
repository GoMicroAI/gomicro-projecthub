 import { useState, useMemo } from "react";
 import { AppLayout } from "@/components/layout/AppLayout";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Avatar, AvatarFallback } from "@/components/ui/avatar";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
 import { PriorityBadge } from "@/components/tasks/PriorityBadge";
 import { TaskDialogMultiAssign } from "@/components/tasks/TaskDialogMultiAssign";
 import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
 import { useRndTasks } from "@/hooks/useRndTasks";
 import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAllTaskAssigneesGlobal } from "@/hooks/useAllTaskAssignees";
 import { useProjects } from "@/hooks/useProjects";
 import { useUserRole } from "@/hooks/useUserRole";
 import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";
 import { Download, RefreshCw, FlaskConical, Edit, Trash2 } from "lucide-react";
 import { Navigate } from "react-router-dom";
 import * as XLSX from "xlsx";
 import { ExportDialog } from "@/components/rnd/ExportDialog";
 import type { Database } from "@/integrations/supabase/types";
 
 type Task = Database["public"]["Tables"]["tasks"]["Row"];
 
 export default function RndWork() {
   const { isAdmin, isLoading: roleLoading } = useUserRole();
   const { rndTasks, isLoading, refetch, updateTask, deleteTask } = useRndTasks();
   const { teamMembers } = useTeamMembers();
   const { projects } = useProjects();
  const { allAssignees } = useAllTaskAssigneesGlobal();
 
   const [dateFilter, setDateFilter] = useState<string>("all");
   const [editingTask, setEditingTask] = useState<Task | null>(null);
   const [deletingTask, setDeletingTask] = useState<Task | null>(null);
   const [showExportDialog, setShowExportDialog] = useState(false);

  // Build assignees by task ID map
  const assigneesByTaskId = useMemo(() => {
    const map: Record<string, string[]> = {};
    allAssignees.forEach((a) => {
      if (!map[a.task_id]) map[a.task_id] = [];
      map[a.task_id].push(a.user_id);
    });
    return map;
  }, [allAssignees]);
 
   // Date filter options
   const dateFilterOptions = useMemo(() => {
     const options = [{ value: "all", label: "All Time" }];
     const now = new Date();
     
     // Add last 12 months
     for (let i = 0; i < 12; i++) {
       const date = subMonths(now, i);
       options.push({
         value: format(date, "yyyy-MM"),
         label: format(date, "MMMM yyyy"),
       });
     }
     
     return options;
   }, []);
 
   // Filter tasks by date
   const filteredTasks = useMemo(() => {
     if (dateFilter === "all") return rndTasks;
 
     const [year, month] = dateFilter.split("-").map(Number);
     const filterDate = new Date(year, month - 1);
     const start = startOfMonth(filterDate);
     const end = endOfMonth(filterDate);
 
     return rndTasks.filter((task) => {
       const taskDate = new Date(task.created_at);
       return taskDate >= start && taskDate <= end;
     });
   }, [rndTasks, dateFilter]);
 
   const getProjectName = (projectId: string) => {
     return projects.find((p) => p.id === projectId)?.name || "Unknown Project";
   };
 
   const getAssigneeNames = (taskId: string) => {
     const assigneeIds = assigneesByTaskId[taskId] || [];
     return assigneeIds
       .map((id) => teamMembers.find((m) => m.user_id === id)?.name)
       .filter(Boolean)
       .join(", ") || "Unassigned";
   };
 
   const getInitials = (name: string) => {
     return name
       .split(" ")
       .map((n) => n[0])
       .join("")
       .toUpperCase()
       .slice(0, 2);
   };
 
   const handleExportExcel = (startDate: Date | null, endDate: Date | null) => {
     let tasksToExport = rndTasks;
 
     // Filter by date range if specified
     if (startDate && endDate) {
       tasksToExport = rndTasks.filter((task) => {
         const taskDate = new Date(task.created_at);
         return isWithinInterval(taskDate, { start: startDate, end: endDate });
       });
     }
 
     if (tasksToExport.length === 0) {
       return;
     }
 
     const data = tasksToExport.map((task) => ({
       "Date": format(new Date(task.created_at), "MMM d, yyyy"),
       "Time": format(new Date(task.created_at), "HH:mm"),
       "Project": getProjectName(task.project_id),
       "Title": task.title,
       "Description": task.description || "-",
       "Assigned To": getAssigneeNames(task.id),
       "Status": task.status.replace("_", " ").toUpperCase(),
       "Priority": task.priority.toUpperCase(),
       "Due Date": task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "-",
     }));
 
     const worksheet = XLSX.utils.json_to_sheet(data);
     const workbook = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(workbook, worksheet, "R&D Work Log");
 
     const colWidths = [
       { wch: 15 }, // Date
       { wch: 8 },  // Time
       { wch: 20 }, // Project
       { wch: 30 }, // Title
       { wch: 50 }, // Description
       { wch: 25 }, // Assigned To
       { wch: 12 }, // Status
       { wch: 10 }, // Priority
       { wch: 15 }, // Due Date
     ];
     worksheet["!cols"] = colWidths;
 
     let fileName = "rnd-work-log-all.xlsx";
     if (startDate && endDate) {
       fileName = `rnd-work-log-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.xlsx`;
     }
 
     XLSX.writeFile(workbook, fileName);
   };
 
   const handleUpdateTask = async (data: { 
    title?: string; 
     description?: string; 
    status?: string; 
    priority?: string;
    task_type?: string;
     due_date?: string;
     assignees: string[];
   }) => {
     if (!editingTask) return;
     await updateTask.mutateAsync({ 
       id: editingTask.id, 
      title: data.title || editingTask.title,
       description: data.description,
      status: (data.status || editingTask.status) as Task["status"],
      priority: (data.priority || editingTask.priority) as Task["priority"],
      task_type: (data.task_type || editingTask.task_type) as Task["task_type"],
       due_date: data.due_date || null,
     });
     setEditingTask(null);
   };
 
   const handleDeleteTask = async () => {
     if (!deletingTask) return;
     await deleteTask.mutateAsync(deletingTask.id);
     setDeletingTask(null);
   };
 
   // Redirect non-admins
   if (!roleLoading && !isAdmin) {
     return <Navigate to="/projects" replace />;
   }
 
   if (roleLoading) {
     return (
      <AppLayout title="R&D Work Log">
         <div className="flex items-center justify-center h-full">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
         </div>
       </AppLayout>
     );
   }
 
   return (
    <AppLayout title="R&D Work Log">
      <div className="h-full flex flex-col">
         {/* Header */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
           <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
              <FlaskConical className="h-5 w-5 text-accent-foreground" />
             </div>
             <div>
               <h1 className="text-2xl font-bold">R&D Work Log</h1>
               <p className="text-sm text-muted-foreground">
                 Track and manage all R&D tasks across projects
               </p>
             </div>
           </div>
           
           <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" onClick={() => refetch()}>
               <RefreshCw className="h-4 w-4 mr-1" />
               Refresh
             </Button>
           </div>
         </div>
 
         {/* Filters and Export */}
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
           <div className="flex items-center gap-2">
             <Select value={dateFilter} onValueChange={setDateFilter}>
               <SelectTrigger className="w-[180px]">
                 <SelectValue placeholder="Filter by date" />
               </SelectTrigger>
               <SelectContent>
                 {dateFilterOptions.map((option) => (
                   <SelectItem key={option.value} value={option.value}>
                     {option.label}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
             <Badge variant="secondary" className="text-xs">
               {filteredTasks.length} tasks
             </Badge>
           </div>
 
           <Button onClick={() => setShowExportDialog(true)} disabled={rndTasks.length === 0}>
             <Download className="h-4 w-4 mr-2" />
             Export to Excel
           </Button>
         </div>
 
         {/* Task Table */}
         <div className="flex-1 border rounded-lg overflow-hidden">
           {isLoading ? (
             <div className="flex items-center justify-center h-full">
               <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
             </div>
           ) : filteredTasks.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
               <FlaskConical className="h-12 w-12 mb-4 opacity-50" />
               <p className="text-lg font-medium">No R&D tasks found</p>
               <p className="text-sm">R&D tasks from projects will appear here</p>
             </div>
           ) : (
             <ScrollArea className="h-full">
               <Table>
                 <TableHeader>
                   <TableRow className="bg-muted/50">
                     <TableHead className="w-[120px]">Date & Time</TableHead>
                     <TableHead className="w-[150px]">Project</TableHead>
                     <TableHead className="min-w-[200px]">Task</TableHead>
                     <TableHead className="w-[150px]">Assigned To</TableHead>
                     <TableHead className="w-[100px]">Status</TableHead>
                     <TableHead className="w-[80px]">Priority</TableHead>
                     <TableHead className="w-[80px] text-right">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredTasks.map((task) => {
                     const assigneeIds = assigneesByTaskId[task.id] || [];
                     const assignees = assigneeIds
                       .map((id) => teamMembers.find((m) => m.user_id === id))
                       .filter(Boolean);
 
                     return (
                       <TableRow key={task.id}>
                         <TableCell className="text-sm">
                           <div className="font-medium">
                             {format(new Date(task.created_at), "MMM d, yyyy")}
                           </div>
                           <div className="text-xs text-muted-foreground">
                             {format(new Date(task.created_at), "HH:mm")}
                           </div>
                         </TableCell>
                         <TableCell>
                           <Badge variant="outline" className="text-xs">
                             {getProjectName(task.project_id)}
                           </Badge>
                         </TableCell>
                         <TableCell>
                           <div className="font-medium">{task.title}</div>
                           {task.description && (
                             <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                               {task.description}
                             </p>
                           )}
                         </TableCell>
                         <TableCell>
                           {assignees.length > 0 ? (
                             <div className="flex items-center gap-1">
                               <div className="flex -space-x-2">
                                 {assignees.slice(0, 3).map((member) => (
                                   <Avatar key={member!.id} className="h-6 w-6 border-2 border-background">
                                     <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                                       {getInitials(member!.name)}
                                     </AvatarFallback>
                                   </Avatar>
                                 ))}
                               </div>
                               {assignees.length > 3 && (
                                 <span className="text-xs text-muted-foreground">
                                   +{assignees.length - 3}
                                 </span>
                               )}
                             </div>
                           ) : (
                             <span className="text-xs text-muted-foreground">Unassigned</span>
                           )}
                         </TableCell>
                         <TableCell>
                           <TaskStatusBadge status={task.status} />
                         </TableCell>
                         <TableCell>
                           <PriorityBadge priority={task.priority} />
                         </TableCell>
                         <TableCell className="text-right">
                           <div className="flex items-center justify-end gap-1">
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-7 w-7"
                               onClick={() => setEditingTask(task)}
                             >
                               <Edit className="h-3.5 w-3.5" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-7 w-7 text-destructive hover:text-destructive"
                               onClick={() => setDeletingTask(task)}
                             >
                               <Trash2 className="h-3.5 w-3.5" />
                             </Button>
                           </div>
                         </TableCell>
                       </TableRow>
                     );
                   })}
                 </TableBody>
               </Table>
             </ScrollArea>
           )}
         </div>
       </div>
 
       {/* Edit Task Dialog */}
       {editingTask && (
         <TaskDialogMultiAssign
           open={!!editingTask}
           onOpenChange={(open) => !open && setEditingTask(null)}
           task={editingTask}
           projectId={editingTask.project_id}
           teamMembers={teamMembers}
           currentAssignees={assigneesByTaskId[editingTask.id] || []}
           onSubmit={handleUpdateTask}
         />
       )}
 
       {/* Delete Confirmation */}
       <DeleteConfirmDialog
         open={!!deletingTask}
         onOpenChange={(open) => !open && setDeletingTask(null)}
         title="Delete Task"
         description={`Are you sure you want to delete "${deletingTask?.title}"? This action cannot be undone.`}
         onConfirm={handleDeleteTask}
       />
       
       {/* Export Dialog */}
       <ExportDialog
         open={showExportDialog}
         onOpenChange={setShowExportDialog}
         onExport={handleExportExcel}
       />
     </AppLayout>
   );
 }