import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { Edit, Trash2, ArrowRight, Image } from "lucide-react";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  image_url?: string | null;
};
type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];

interface ProjectCardProps {
  project: Project;
  isAdmin: boolean;
  teamMembers?: TeamMember[];
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  taskCount?: number;
}

export function ProjectCard({
  project,
  isAdmin,
  teamMembers = [],
  onEdit,
  onDelete,
  taskCount = 0,
}: ProjectCardProps) {
  const displayedMembers = teamMembers.slice(0, 4);
  const remainingCount = teamMembers.length - 4;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="group hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Image Section */}
          <div className="w-full sm:w-32 h-32 sm:h-full shrink-0 bg-muted flex items-center justify-center">
            {project.image_url ? (
              <img
                src={project.image_url}
                alt={project.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Image className="h-8 w-8 text-muted-foreground/50" />
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base truncate">{project.name}</h3>
                  <ProjectStatusBadge status={project.status} />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {project.description || "No description"}
                </p>
              </div>
              {isAdmin && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.preventDefault();
                      onEdit?.(project);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete?.(project);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Footer: Members and Actions */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {/* Team Member Avatars */}
                <div className="flex -space-x-2">
                  {displayedMembers.map((member) => (
                    <Avatar key={member.id} className="h-7 w-7 border-2 border-background">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {remainingCount > 0 && (
                    <Avatar className="h-7 w-7 border-2 border-background">
                      <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                        +{remainingCount}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {taskCount} task{taskCount !== 1 ? "s" : ""}
                </span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link to={`/projects/${project.id}`}>
                  View <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
