import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useWorkHistory } from "@/hooks/useWorkHistory";
import { format } from "date-fns";

interface WorkHistoryTabProps {
  userId: string;
  canModify: boolean;
}

export function WorkHistoryTab({ userId, canModify }: WorkHistoryTabProps) {
  const { workHistory, isLoading, addEntry, updateEntry, deleteEntry } = useWorkHistory(userId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<{ id: string; summary: string } | null>(null);
  const [newSummary, setNewSummary] = useState("");

  const handleAddEntry = async () => {
    if (!newSummary.trim()) return;
    await addEntry.mutateAsync(newSummary.trim());
    setNewSummary("");
    setIsAddDialogOpen(false);
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry || !editingEntry.summary.trim()) return;
    await updateEntry.mutateAsync({ id: editingEntry.id, taskSummary: editingEntry.summary.trim() });
    setEditingEntry(null);
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteEntry.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-muted-foreground">
              Daily Work Log ({workHistory.length})
            </h3>
            {canModify && (
              <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Entry
              </Button>
            )}
          </div>

          {workHistory.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[20%]">Date</TableHead>
                    <TableHead className="w-[15%]">Time</TableHead>
                    <TableHead className="w-[50%]">Task Summary</TableHead>
                    {canModify && <TableHead className="w-[15%] text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(entry.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {entry.time.slice(0, 5)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <p className="whitespace-pre-wrap">{entry.task_summary}</p>
                      </TableCell>
                      {canModify && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                setEditingEntry({ id: entry.id, summary: entry.task_summary })
                              }
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteEntry(entry.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No work history entries yet.
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Add Entry Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Work Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Date and time will be recorded automatically.
            </p>
            <Textarea
              placeholder="What did you work on today?"
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEntry} disabled={!newSummary.trim() || addEntry.isPending}>
              {addEntry.isPending ? "Adding..." : "Add Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Work Entry</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editingEntry?.summary || ""}
              onChange={(e) =>
                setEditingEntry((prev) => (prev ? { ...prev, summary: e.target.value } : null))
              }
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEntry(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEntry} disabled={updateEntry.isPending}>
              {updateEntry.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
