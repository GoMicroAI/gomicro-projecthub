import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CustomTabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; content: string }) => void;
  initialData?: { name: string; content: string | null };
  isEditing?: boolean;
  isPending?: boolean;
}

export function CustomTabDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing = false,
  isPending = false,
}: CustomTabDialogProps) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (open) {
      setName(initialData?.name || "");
      setContent(initialData?.content || "");
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), content });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Tab" : "Add New Details Tab"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tab-name">Tab Name</Label>
            <Input
              id="tab-name"
              placeholder="e.g., Requirements, Notes, Timeline..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tab-content">Content</Label>
            <Textarea
              id="tab-content"
              placeholder="Enter details here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Tab"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
