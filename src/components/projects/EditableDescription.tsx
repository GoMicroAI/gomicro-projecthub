import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, X } from "lucide-react";

interface EditableDescriptionProps {
  description: string | null;
  isAdmin: boolean;
  onSave: (description: string) => Promise<void>;
}

export function EditableDescription({
  description,
  isAdmin,
  onSave,
}: EditableDescriptionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(description || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setEditValue(description || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(description || "");
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder="Add a project description..."
          className="resize-none min-h-[80px]"
          autoFocus
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Check className="h-4 w-4 mr-1" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-2">
      <p className="text-muted-foreground flex-1">
        {description || "No description"}
      </p>
      {isAdmin && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={handleEdit}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
