import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, Share, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallAppSection() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check device type
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

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

  if (isInstalled) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Download className="h-5 w-5 text-green-600" />
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
              Install ProjectHUB on your device for quick access and offline use.
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
        {isIOS && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Smartphone className="h-4 w-4" />
              iPhone / iPad
            </h4>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>Open this page in <strong>Safari</strong> browser</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <span className="flex items-center gap-1">
                  Tap the <Share className="h-4 w-4 inline" /> <strong>Share</strong> button at the bottom
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span className="flex items-center gap-1">
                  Scroll down and tap <Plus className="h-4 w-4 inline" /> <strong>"Add to Home Screen"</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">4.</span>
                <span>Tap <strong>"Add"</strong> in the top right corner</span>
              </li>
            </ol>
          </div>
        )}

        {/* Android Instructions */}
        {isAndroid && !deferredPrompt && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Smartphone className="h-4 w-4" />
              Android
            </h4>
            <ol className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600">1.</span>
                <span>Open this page in <strong>Chrome</strong> browser</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600">2.</span>
                <span>Tap the <strong>menu</strong> (three dots) in the top right</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600">3.</span>
                <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></span>
              </li>
            </ol>
          </div>
        )}

        {/* Desktop Instructions */}
        {!isIOS && !isAndroid && !deferredPrompt && (
          <div className="rounded-lg border p-4">
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Monitor className="h-4 w-4" />
              Desktop (Chrome / Edge)
            </h4>
            <ol className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>Look for the <strong>install icon</strong> in the address bar (right side)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>Click <strong>"Install"</strong> when prompted</span>
              </li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
