import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type ProjectFile = Database["public"]["Tables"]["files"]["Row"];

interface FileListItemProps {
  file: ProjectFile;
  isAdmin: boolean;
  onDelete?: (file: ProjectFile) => void;
}

export function FileListItem({ file, isAdmin, onDelete }: FileListItemProps) {
  const isPdf = file.file_name.toLowerCase().endsWith(".pdf");
  
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = file.file_url;
    link.download = file.file_name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenPdf = () => {
    window.open(file.file_url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors gap-2 sm:gap-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="font-medium truncate text-sm sm:text-base">{file.file_name}</p>
          <p className="text-xs text-muted-foreground">
            Uploaded {format(new Date(file.uploaded_at), "MMM d, yyyy")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto sm:ml-4">
        {isPdf && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenPdf}
            className="gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Open</span>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="gap-1 sm:gap-2 text-xs sm:text-sm"
        >
          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Download</span>
        </Button>
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete?.(file)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
