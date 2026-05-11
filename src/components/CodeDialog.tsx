import { useState, type ReactNode } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ACCESS_CODE = "2016";

interface CodeDialogProps {
  trigger: ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirmed: () => void | Promise<void>;
}

export function CodeDialog({
  trigger,
  title,
  description,
  confirmLabel = "Valider",
  destructive = false,
  onConfirmed,
}: CodeDialogProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (code !== ACCESS_CODE) {
      toast.error("Code incorrect. Accès refusé.");
      setCode("");
      return;
    }
    setOpen(false);
    setCode("");
    await onConfirmed();
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setCode("");
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="access-code">Code d'accès</Label>
          <Input
            id="access-code"
            type="password"
            inputMode="numeric"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="••••"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
