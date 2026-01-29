import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
  onRefresh?: () => void;
}

export function AppLayout({ children, title, actions, onRefresh }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {onRefresh && (
                <Button variant="ghost" size="icon" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
