import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { Edit, Trash2, ArrowRight, Image, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";
import type { LatestMessage } from "@/hooks/useLatestProjectMessages";

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
  latestMessage?: LatestMessage;
}

export function ProjectCard({
  project,
  isAdmin,
  teamMembers = [],
  onEdit,
  onDelete,
  taskCount = 0,
  latestMessage,
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
        <div className="flex flex-col">
          {/* Main Content Row */}
          <div className="flex flex-col sm:flex-row sm:min-h-[120px]">
            {/* Image Section */}
            <div className="w-full sm:w-28 h-28 sm:h-auto sm:self-stretch shrink-0 bg-muted flex items-center justify-center">
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base truncate">{project.name}</h3>
                    <ProjectStatusBadge status={project.status} />
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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

            {/* Chat Section - Right Side (Desktop) */}
            <Link 
              to={`/projects/${project.id}?tab=chat`}
              className="hidden sm:flex w-64 shrink-0 border-l bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all cursor-pointer"
            >
              <div className="flex flex-col w-full p-4">
                {/* Chat Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Chat</p>
                    <p className="text-xs text-muted-foreground">Project conversation</p>
                  </div>
                </div>
                
                {/* Latest Message */}
                <div className="flex-1 flex flex-col justify-center">
                  {latestMessage ? (
                    <div className="bg-background/60 rounded-lg p-2.5 border border-border/50">
                      <p className="text-xs font-medium text-foreground truncate">
                        {latestMessage.sender_name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {latestMessage.content || "Sent an attachment"}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-background/40 rounded-lg p-2.5 border border-dashed border-border/50">
                      <p className="text-xs text-muted-foreground italic text-center">
                        No messages yet
                      </p>
                      <p className="text-xs text-primary font-medium text-center mt-1">
                        Start chatting →
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </div>

          {/* Chat Section - Bottom (Mobile) */}
          <Link 
            to={`/projects/${project.id}?tab=chat`}
            className="sm:hidden border-t bg-gradient-to-r from-primary/5 to-primary/10 px-4 py-3 flex items-center gap-3 hover:from-primary/10 hover:to-primary/15 transition-colors"
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 shrink-0">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Chat</p>
              {latestMessage ? (
                <p className="text-xs text-muted-foreground truncate">
                  <span className="font-medium text-foreground">{latestMessage.sender_name}:</span>{" "}
                  {latestMessage.content || "Sent an attachment"}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">Start a conversation</p>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-primary shrink-0" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
