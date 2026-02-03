import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, Share, Plus, Apple, RefreshCw, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallAppSection() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleUpdateApp = async () => {
    setIsUpdating(true);
    
    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        for (const registration of registrations) {
          // Try to update the service worker first
          await registration.update();
          // Then unregister to force a fresh install
          await registration.unregister();
        }
      }

      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      toast({
        title: "Update Complete",
        description: "App will reload with the latest version...",
      });

      // Small delay to show the toast, then reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error("Update failed:", error);
      toast({
        title: "Update Failed",
        description: "Please try again or reinstall the app.",
        variant: "destructive",
      });
      setIsUpdating(false);
    }
  };

  if (isInstalled) {
    return (
      <div className="space-y-4">
        {/* App Installed Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-lg">App Installed!</CardTitle>
                <CardDescription>
                  GoMicro ProjectHUB is installed on your device.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Update App Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Update App</CardTitle>
                <CardDescription>
                  Force update to get the latest version of the app.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              If the app isn't showing the latest features or content, tap the button below to clear the cache and reload with the newest version.
            </p>
            <Button 
              onClick={handleUpdateApp} 
              disabled={isUpdating}
              className="w-full"
              variant="outline"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check for Updates & Reload
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Install App</CardTitle>
            <CardDescription>
              Install GoMicro ProjectHUB on your device for quick access and offline use.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Direct Install Button (for supported browsers like Chrome on Android/Desktop) */}
        {deferredPrompt && (
          <Button onClick={handleInstallClick} className="w-full" size="lg">
            <Download className="mr-2 h-5 w-5" />
            Install Now
          </Button>
        )}

        {/* iPhone/iPad Instructions */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-4">
          <h4 className="font-semibold flex items-center gap-2 mb-3 text-blue-800 dark:text-blue-300">
            <Apple className="h-4 w-4" />
            iPhone / iPad
          </h4>
          <ol className="space-y-2 text-sm text-blue-900 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600 dark:text-blue-400 min-w-[20px]">1.</span>
              <span>Open this page in <strong>Safari</strong> browser</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600 dark:text-blue-400 min-w-[20px]">2.</span>
              <span className="flex items-center gap-1 flex-wrap">
                Tap the <Share className="h-4 w-4 inline mx-1" /> <strong>Share</strong> button at the bottom
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600 dark:text-blue-400 min-w-[20px]">3.</span>
              <span className="flex items-center gap-1 flex-wrap">
                Scroll down and tap <Plus className="h-4 w-4 inline mx-1" /> <strong>"Add to Home Screen"</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600 dark:text-blue-400 min-w-[20px]">4.</span>
              <span>Tap <strong>"Add"</strong> in the top right corner</span>
            </li>
          </ol>
        </div>

        {/* Android Instructions */}
        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 p-4">
          <h4 className="font-semibold flex items-center gap-2 mb-3 text-green-800 dark:text-green-300">
            <Smartphone className="h-4 w-4" />
            Android
          </h4>
          <ol className="space-y-2 text-sm text-green-900 dark:text-green-200">
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-600 dark:text-green-400 min-w-[20px]">1.</span>
              <span>Open this page in <strong>Chrome</strong> browser</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-600 dark:text-green-400 min-w-[20px]">2.</span>
              <span>Tap the <strong>menu</strong> (⋮ three dots) in the top right</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-600 dark:text-green-400 min-w-[20px]">3.</span>
              <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></span>
            </li>
          </ol>
        </div>

        {/* Desktop Instructions */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700 p-4">
          <h4 className="font-semibold flex items-center gap-2 mb-3 text-gray-800 dark:text-gray-200">
            <Monitor className="h-4 w-4" />
            Desktop (Chrome / Edge)
          </h4>
          <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="font-bold text-gray-600 dark:text-gray-400 min-w-[20px]">1.</span>
              <span>Look for the <strong>install icon</strong> in the address bar (right side)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-gray-600 dark:text-gray-400 min-w-[20px]">2.</span>
              <span>Click <strong>"Install"</strong> when prompted</span>
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
