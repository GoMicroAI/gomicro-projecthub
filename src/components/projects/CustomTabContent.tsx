import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Edit, Save, X, Trash2 } from "lucide-react";

interface CustomTabContentProps {
  tabId: string;
  name: string;
  content: string | null;
  isAdmin: boolean;
  onUpdate: (data: { name?: string; content?: string }) => void;
  onDelete: () => void;
  isPending?: boolean;
}

export function CustomTabContent({
  tabId,
  name,
  content,
  isAdmin,
  onUpdate,
  onDelete,
  isPending = false,
}: CustomTabContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editContent, setEditContent] = useState(content || "");

  const handleSave = () => {
    onUpdate({ name: editName, content: editContent });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(name);
    setEditContent(content || "");
    setIsEditing(false);
  };

  if (isEditing && isAdmin) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="text-lg font-semibold h-9"
              placeholder="Tab name"
            />
            <div className="flex gap-1 shrink-0">
              <Button size="sm" onClick={handleSave} disabled={isPending || !editName.trim()}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Enter details here..."
            rows={12}
            className="resize-none"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{name}</CardTitle>
          {isAdmin && (
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {content ? (
          <div className="whitespace-pre-wrap text-sm text-muted-foreground">
            {content}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No content yet. {isAdmin && "Click Edit to add details."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
