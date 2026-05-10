import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { role, status } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "authenticated" && role && role !== "admin") {
      toast.error("Accès réservé aux administrateurs.");
      navigate({ to: "/" });
    }
  }, [role, status, navigate]);

  if (role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Vérification des permissions…
      </div>
    );
  }
  return <Outlet />;
}
