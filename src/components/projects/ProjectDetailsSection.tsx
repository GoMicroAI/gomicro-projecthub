import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, X } from "lucide-react";

interface ProjectDetailsSectionProps {
  description: string | null;
  isAdmin: boolean;
  onUpdate: (description: string | null) => Promise<void>;
}

export function ProjectDetailsSection({
  description,
  isAdmin,
  onUpdate,
}: ProjectDetailsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValue, setEditValue] = useState(description || "");

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
      await onUpdate(editValue || null);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="flex flex-col max-h-[calc(100vh-220px)] overflow-hidden">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Project Details</CardTitle>
          {isAdmin && !isEditing && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Pencil className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Check className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {isEditing ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Add project details, notes, or important information..."
            className="min-h-[200px] resize-y"
            autoFocus
          />
        ) : (
          <div className="min-h-[100px]">
            {description ? (
              <p className="text-sm whitespace-pre-wrap">{description}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No details added yet.
                {isAdmin && " Click Edit to add project details."}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
