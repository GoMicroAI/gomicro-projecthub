import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Cpu } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(["todo", "in_progress", "blocked", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  task_type: z.enum(["development", "rnd"]),
  due_date: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskDialogMultiAssignProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  projectId: string;
  teamMembers: TeamMember[];
  currentAssignees?: string[];
  currentReporters?: string[];
  onSubmit: (data: TaskFormData & { assignees: string[]; reporters: string[] }) => Promise<void>;
}

export function TaskDialogMultiAssign({
  open,
  onOpenChange,
  task,
  projectId: _projectId,
  teamMembers,
  currentAssignees = [],
  currentReporters = [],
  onSubmit,
}: TaskDialogMultiAssignProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(currentAssignees);
  const [selectedReporters, setSelectedReporters] = useState<string[]>(currentReporters);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || "todo",
      priority: task?.priority || "medium",
      task_type: task?.task_type || "development",
      due_date: task?.due_date || undefined,
    },
  });

  // Reset form when task changes
  useEffect(() => {
    if (open) {
      form.reset({
        title: task?.title || "",
        description: task?.description || "",
        status: task?.status || "todo",
        priority: task?.priority || "medium",
        task_type: task?.task_type || "development",
        due_date: task?.due_date || undefined,
      });
      setSelectedAssignees(currentAssignees);
      setSelectedReporters(currentReporters);
    }
  }, [open, task, form, currentAssignees, currentReporters]);

  const handleSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({ ...data, assignees: selectedAssignees, reporters: selectedReporters });
      form.reset();
      setSelectedAssignees([]);
      setSelectedReporters([]);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleReporter = (userId: string) => {
    setSelectedReporters((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const activeMembers = teamMembers.filter((m) => m.status === "active");
  const adminMembers = activeMembers.filter((m) => m.role === "admin");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Add Task"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="space-y-4 flex-1 overflow-auto px-1">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Task details and description"
                        className="resize-none min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="task_type"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <FormControl>
                        <Switch
                          checked={field.value === "rnd"}
                          onCheckedChange={(checked) => field.onChange(checked ? "rnd" : "development")}
                        />
                      </FormControl>
                      <div className={`flex items-center gap-2 transition-colors ${field.value === "rnd" ? "text-foreground" : "text-muted-foreground"}`}>
                        <Cpu className="h-4 w-4" />
                        <span className="text-sm font-medium">R&D</span>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Assign Members</Label>
                <ScrollArea className="h-[100px] sm:h-[120px] border rounded-md p-2 sm:p-3">
                  <div className="space-y-2">
                    {activeMembers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No team members available</p>
                    ) : (
                      activeMembers.map((member) => {
                        const memberId = member.user_id || member.id;
                        return (
                          <div key={member.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`member-${member.id}`}
                              checked={selectedAssignees.includes(memberId)}
                              onCheckedChange={() => toggleAssignee(memberId)}
                            />
                            <label
                              htmlFor={`member-${member.id}`}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {member.name}
                            </label>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-2">
                <Label>Report To</Label>
                <ScrollArea className="h-[80px] sm:h-[100px] border rounded-md p-2 sm:p-3">
                  <div className="space-y-2">
                    {adminMembers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No admins available</p>
                    ) : (
                      adminMembers.map((member) => {
                        const memberId = member.user_id || member.id;
                        return (
                          <div key={member.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`reporter-${member.id}`}
                              checked={selectedReporters.includes(memberId)}
                              onCheckedChange={() => toggleReporter(memberId)}
                            />
                            <label
                              htmlFor={`reporter-${member.id}`}
                              className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                            >
                              {member.name}
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                Admin
                              </Badge>
                            </label>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : task ? "Update" : "Add Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
