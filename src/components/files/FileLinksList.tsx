import { ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProjectLink {
  id: string;
  project_id: string;
  title: string;
  url: string;
  created_by: string | null;
  created_at: string;
}

interface FileLinksListProps {
  links: ProjectLink[];
  isAdmin: boolean;
  onDelete?: (linkId: string) => void;
}

export function FileLinksList({ links, isAdmin, onDelete }: FileLinksListProps) {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">File Links</h3>
      </div>
      <ScrollArea className="max-h-40">
        <div className="space-y-1 pr-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 transition-colors group"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline truncate flex-1 mr-2"
              >
                {link.title}
              </a>
              {isAdmin && onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  onClick={() => onDelete(link.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
