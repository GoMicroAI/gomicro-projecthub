import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { Edit, Trash2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];

interface ProjectCardProps {
  project: Project;
  isAdmin: boolean;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  taskCount?: number;
}

export function ProjectCard({
  project,
  isAdmin,
  onEdit,
  onDelete,
  taskCount = 0,
}: ProjectCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
            <ProjectStatusBadge status={project.status} />
          </div>
          {isAdmin && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  onEdit?.(project);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  onDelete?.(project);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description || "No description"}
        </p>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {taskCount} task{taskCount !== 1 ? "s" : ""}
        </span>
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/projects/${project.id}`}>
            View <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
