import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Folder, ChevronRight, ChevronDown, MoreVertical, Trash2, Pencil, Upload } from "lucide-react";
import { FileListItem } from "./FileListItem";
import type { Database } from "@/integrations/supabase/types";

type FolderType = Database["public"]["Tables"]["folders"]["Row"];
type ProjectFile = Database["public"]["Tables"]["files"]["Row"];

interface FolderItemProps {
  folder: FolderType;
  files: ProjectFile[];
  isAdmin: boolean;
  onDelete: (folder: FolderType) => void;
  onRename: (folderId: string, name: string) => Promise<void>;
  onUploadToFolder: (folderId: string) => void;
  onDeleteFile: (file: ProjectFile) => void;
}

export function FolderItem({
  folder,
  files,
  isAdmin,
  onDelete,
  onRename,
  onUploadToFolder,
  onDeleteFile,
}: FolderItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);

  const folderFiles = files.filter((f) => f.folder_id === folder.id);

  const handleRename = async () => {
    if (newName.trim() && newName !== folder.name) {
      await onRename(folder.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setNewName(folder.name);
      setIsRenaming(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
        <CollapsibleTrigger className="flex items-center gap-3 flex-1 min-w-0">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <Folder className="h-5 w-5 text-primary shrink-0" />
          {isRenaming ? (
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="h-7 py-0"
              autoFocus
            />
          ) : (
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate">{folder.name}</span>
              {folder.details && (
                <span className="text-xs text-muted-foreground truncate">
                  {folder.details}
                </span>
              )}
            </div>
          )}
          <span className="text-sm text-muted-foreground shrink-0">
            ({folderFiles.length} files)
          </span>
        </CollapsibleTrigger>

        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onUploadToFolder(folder.id)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload to Folder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(folder)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <CollapsibleContent className="pl-8 pt-2 space-y-2">
        {folderFiles.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2 px-4">
            No files in this folder
          </p>
        ) : (
          folderFiles.map((file) => (
            <FileListItem
              key={file.id}
              file={file}
              isAdmin={isAdmin}
              onDelete={onDeleteFile}
            />
          ))
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
