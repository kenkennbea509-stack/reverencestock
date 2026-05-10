import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { signIn, status } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "authenticated") navigate({ to: "/" });
  }, [status, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(username, pin);
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <ClipboardList className="h-10 w-10 text-primary" />
          <h1 className="text-xl font-semibold">Inventaire</h1>
          <p className="text-sm text-muted-foreground">Connexion</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="u">Nom d'utilisateur</Label>
                <Input
                  id="u"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p">Code PIN (6 chiffres)</Label>
                <Input
                  id="p"
                  type="password"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  autoComplete="current-password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Connexion…" : "Se connecter"}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Premier démarrage ?{" "}
              <Link to="/setup" className="text-primary underline">
                Configurer l'administrateur
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
