import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { status } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "unauthenticated") navigate({ to: "/login" });
  }, [status, navigate]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }
  return <Outlet />;
}
