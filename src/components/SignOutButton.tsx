import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type ButtonVariant = React.ComponentProps<typeof Button>["variant"];
type ButtonSize = React.ComponentProps<typeof Button>["size"];

interface SignOutButtonProps {
  iconOnly?: boolean;
  label?: string;
  confirmTitle?: string;
  confirmDescription?: string;
  buttonVariant?: ButtonVariant;
  buttonSize?: ButtonSize;
  className?: string;
  iconClassName?: string;
  "aria-label"?: string;
}

export const SignOutButton = ({
  iconOnly = false,
  label = "Keluar",
  confirmTitle = "Keluar dari SiNaik?",
  confirmDescription = "Anda akan keluar dari akun ini. Pastikan perubahan sudah tersimpan.",
  buttonVariant = iconOnly ? "ghost" : "outline",
  buttonSize,
  className,
  iconClassName,
  "aria-label": ariaLabel,
}: SignOutButtonProps) => {
  const { signOut } = useAuth();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsConfirming(true);
      await signOut();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={buttonVariant}
          size={iconOnly ? "icon" : buttonSize}
          className={className}
          aria-label={iconOnly ? ariaLabel ?? "Keluar dari akun" : ariaLabel}
        >
          {isConfirming ? (
            <Loader2 className={cn("h-4 w-4 animate-spin", iconClassName)} />
          ) : (
            <LogOut className={cn("h-4 w-4", iconClassName)} />
          )}
          {!iconOnly && <span className="ml-2">{label}</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleSignOut} disabled={isConfirming}>
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Keluar...
              </>
            ) : (
              "Keluar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
