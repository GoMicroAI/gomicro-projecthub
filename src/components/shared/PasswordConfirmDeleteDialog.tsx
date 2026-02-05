import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

interface PasswordConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
}

export function PasswordConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isDeleting = false,
}: PasswordConfirmDeleteDialogProps) {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setPassword("");
    setError("");
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    if (!user?.email) {
      setError("Unable to verify user. Please try again.");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      // Verify password by attempting to sign in with current credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (signInError) {
        setError("Incorrect password. Please try again.");
        setIsVerifying(false);
        return;
      }

      // Password verified, proceed with deletion
      await onConfirm();
      handleClose();
    } catch (err) {
      console.error("Password verification error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const isPending = isVerifying || isDeleting;

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="w-[95vw] sm:w-full max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-destructive" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-4">
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium">
              This action requires password confirmation
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Enter your password to confirm</Label>
            <Input
              id="confirm-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Your login password"
              disabled={isPending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isPending) {
                  handleConfirm();
                }
              }}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} onClick={handleClose}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending || !password.trim()}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isVerifying ? "Verifying..." : "Deleting..."}
              </>
            ) : (
              "Confirm Delete"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
