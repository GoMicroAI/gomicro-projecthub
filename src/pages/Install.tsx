import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, Apple, Chrome } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

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
      <AppLayout title="Install App">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Download className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">App Already Installed!</CardTitle>
              <CardDescription>
                GoMicro ProjectHUB is already installed on your device. You can access it from your home screen or app drawer.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Install App">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Download className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Install GoMicro ProjectHUB</CardTitle>
            <CardDescription>
              Install the app on your device for a better experience with offline access and quick launch.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Direct Install Button (for supported browsers) */}
            {deferredPrompt && (
              <Button onClick={handleInstallClick} className="w-full" size="lg">
                <Download className="mr-2 h-5 w-5" />
                Install Now
              </Button>
            )}

            {/* iOS Instructions */}
            {isIOS && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Apple className="h-5 w-5" />
                    iPhone / iPad Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Tap the <strong>Share</strong> button in Safari (square with arrow)</li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                    <li>Tap <strong>"Add"</strong> in the top right corner</li>
                  </ol>
                </CardContent>
              </Card>
            )}

            {/* Android Instructions */}
            {!isIOS && !deferredPrompt && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Smartphone className="h-5 w-5" />
                    Android Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Tap the <strong>menu</strong> button (three dots) in Chrome</li>
                    <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></li>
                    <li>Follow the prompts to install</li>
                  </ol>
                </CardContent>
              </Card>
            )}

            {/* Desktop Instructions */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Monitor className="h-5 w-5" />
                  Desktop (Chrome/Edge)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Look for the <strong>install icon</strong> in the address bar (right side)</li>
                  <li>Click <strong>"Install"</strong> when prompted</li>
                  <li>The app will open in its own window</li>
                </ol>
              </CardContent>
            </Card>

            {/* Benefits */}
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3">Why Install?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Chrome className="h-4 w-4 text-primary" />
                  Works offline - access your projects anytime
                </li>
                <li className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                  Quick launch from home screen
                </li>
                <li className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-primary" />
                  Full screen experience without browser UI
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
