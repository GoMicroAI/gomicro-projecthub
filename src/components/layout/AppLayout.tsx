import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { RefreshCw, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
  onRefresh?: () => void;
}

export function AppLayout({ children, title, actions, onRefresh }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center gap-2 md:gap-3">
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                  <AppSidebar onNavigate={() => setMobileMenuOpen(false)} />
                </SheetContent>
              </Sheet>

              <h1 className="text-xl md:text-2xl font-bold text-foreground">{title}</h1>
              {onRefresh && (
                <Button variant="ghost" size="icon" onClick={onRefresh} className="h-8 w-8 md:h-9 md:w-9">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
