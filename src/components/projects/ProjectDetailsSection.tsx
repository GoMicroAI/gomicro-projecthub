import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Check, X, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type ProjectStatus = Database["public"]["Enums"]["project_status"];

interface ProjectDetailsSectionProps {
  project: Project;
  isAdmin: boolean;
  onUpdate: (updates: {
    name?: string;
    description?: string | null;
    status?: ProjectStatus;
  }) => Promise<void>;
}

export function ProjectDetailsSection({
  project,
  isAdmin,
  onUpdate,
}: ProjectDetailsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValues, setEditValues] = useState({
    name: project.name,
    description: project.description || "",
    status: project.status,
  });

  const handleEdit = () => {
    setEditValues({
      name: project.name,
      description: project.description || "",
      status: project.status,
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValues({
      name: project.name,
      description: project.description || "",
      status: project.status,
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        name: editValues.name,
        description: editValues.description || null,
        status: editValues.status,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Project Information</CardTitle>
            {isAdmin && !isEditing && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {isEditing && (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
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
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={editValues.name}
                  onChange={(e) =>
                    setEditValues({ ...editValues, name: e.target.value })
                  }
                  placeholder="Enter project name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={editValues.description}
                  onChange={(e) =>
                    setEditValues({ ...editValues, description: e.target.value })
                  }
                  placeholder="Enter project description"
                  className="min-h-[100px] resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-status">Status</Label>
                <Select
                  value={editValues.status}
                  onValueChange={(value: ProjectStatus) =>
                    setEditValues({ ...editValues, status: value })
                  }
                >
                  <SelectTrigger id="project-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Project Name
                  </p>
                  <p className="text-sm">{project.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <ProjectStatusBadge status={project.status} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Description
                </p>
                <p className="text-sm text-muted-foreground">
                  {project.description || "No description provided"}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Project Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Created
                </p>
                <p className="text-sm">
                  {format(new Date(project.created_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Project ID
                </p>
                <p className="text-sm font-mono text-xs truncate max-w-[180px]">
                  {project.id}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {project.image_url && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Project Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border">
              <img
                src={project.image_url}
                alt={project.name}
                className="h-full w-full object-cover"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
