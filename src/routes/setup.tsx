import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminExists, bootstrapAdmin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/setup")({
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();
  const check = useServerFn(adminExists);
  const create = useServerFn(bootstrapAdmin);
  const [checking, setChecking] = useState(true);
  const [exists, setExists] = useState(false);
  const [username, setUsername] = useState("admin");
  const [displayName, setDisplayName] = useState("Administrateur");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    check()
      .then((r) => setExists(r.exists))
      .finally(() => setChecking(false));
  }, [check]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await create({ data: { username, displayName, pin } });
      toast.success("Administrateur créé. Vous pouvez vous connecter.");
      navigate({ to: "/login" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-sm">
        <h1 className="mb-4 text-center text-xl font-semibold">Configuration initiale</h1>
        <Card>
          <CardContent className="pt-6">
            {checking ? (
              <p className="text-sm text-muted-foreground">Vérification…</p>
            ) : exists ? (
              <div className="space-y-3 text-center">
                <p className="text-sm text-muted-foreground">
                  Un administrateur a déjà été configuré.
                </p>
                <Link to="/login">
                  <Button className="w-full">Aller à la connexion</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Créez le premier compte administrateur. Conservez bien le PIN.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="u">Nom d'utilisateur</Label>
                  <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="d">Nom affiché</Label>
                  <Input id="d" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p">PIN (6 chiffres)</Label>
                  <Input
                    id="p"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Création…" : "Créer l'administrateur"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
