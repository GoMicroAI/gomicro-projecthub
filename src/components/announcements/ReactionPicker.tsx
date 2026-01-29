import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  size?: "default" | "sm";
}

export function ReactionPicker({ onSelect, size = "default" }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={size === "sm" ? "sm" : "icon"}
          className={cn(size === "sm" && "h-6 px-1.5")}
        >
          <SmilePlus className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1">
          {REACTIONS.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              onClick={() => handleSelect(emoji)}
              className="h-8 w-8 p-0 text-lg hover:bg-muted"
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
