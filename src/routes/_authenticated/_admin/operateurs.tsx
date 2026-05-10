import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listOperators, createOperator, resetOperatorPin, deleteOperator } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { ArrowLeft, KeyRound, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/operateurs")({
  component: OperatorsPage,
});

interface Operator {
  id: string;
  username: string;
  display_name: string | null;
  created_at: string;
}

function OperatorsPage() {
  const list = useServerFn(listOperators);
  const create = useServerFn(createOperator);
  const reset = useServerFn(resetOperatorPin);
  const remove = useServerFn(deleteOperator);

  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  const [resetOpen, setResetOpen] = useState<Operator | null>(null);
  const [resetPin, setResetPin] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await list();
      setOperators(r.operators as Operator[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await create({ data: { username, displayName, pin } });
      toast.success(`Opérateur « ${username} » créé. PIN : ${pin}`);
      setCreateOpen(false);
      setUsername("");
      setDisplayName("");
      setPin("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!resetOpen) return;
    setBusy(true);
    try {
      await reset({ data: { userId: resetOpen.id, pin: resetPin } });
      toast.success(`PIN réinitialisé. Nouveau PIN : ${resetPin}`);
      setResetOpen(null);
      setResetPin("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (op: Operator) => {
    try {
      await remove({ data: { userId: op.id } });
      toast.success("Opérateur supprimé");
      setOperators((prev) => prev.filter((o) => o.id !== op.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="flex-1 text-lg font-semibold">Opérateurs</h1>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" /> Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvel opérateur</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="u">Nom d'utilisateur</Label>
                  <Input
                    id="u"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ex: marie"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="d">Nom affiché</Label>
                  <Input
                    id="d"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Marie Dupont"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p">PIN initial (6 chiffres)</Label>
                  <Input
                    id="p"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={busy}>
                    {busy ? "Création…" : "Créer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-2 px-4 py-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : operators.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <UserPlus className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Aucun opérateur pour l'instant.</p>
            </CardContent>
          </Card>
        ) : (
          operators.map((op) => (
            <Card key={op.id}>
              <CardContent className="flex items-center gap-2 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{op.display_name ?? op.username}</p>
                  <p className="text-xs text-muted-foreground">@{op.username}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Réinitialiser PIN"
                  onClick={() => setResetOpen(op)}
                >
                  <KeyRound className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer cet opérateur ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        L'opérateur « {op.display_name ?? op.username} » ne pourra plus se connecter.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(op)}>
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      <Dialog open={!!resetOpen} onOpenChange={(o) => !o && setResetOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le PIN</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Nouveau PIN pour {resetOpen?.display_name ?? resetOpen?.username}
            </p>
            <Input
              inputMode="numeric"
              maxLength={6}
              value={resetPin}
              onChange={(e) => setResetPin(e.target.value.replace(/\D/g, ""))}
              placeholder="6 chiffres"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleReset} disabled={busy || resetPin.length !== 6}>
              {busy ? "…" : "Réinitialiser"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
