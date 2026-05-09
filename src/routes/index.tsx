import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Plus, FileText, Trash2 } from "lucide-react";
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
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Home,
});

interface InventoryRow {
  id: string;
  name: string;
  status: "en_cours" | "complet";
  created_at: string;
  created_by: string | null;
  counted_by: string | null;
}

function Home() {
  const [inventories, setInventories] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("inventories")
      .select("id,name,status,created_at,created_by,counted_by")
      .order("created_at", { ascending: false });
    setInventories((data ?? []) as InventoryRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Inventaire</h1>
          </div>
          <Link to="/import">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" /> Nouveau
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Inventaires
        </h2>

        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : inventories.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aucun inventaire pour l'instant.
              </p>
              <Link to="/import">
                <Button>
                  <Plus className="mr-1 h-4 w-4" /> Créer le premier inventaire
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {inventories.map((inv) => {
              const target =
                inv.status === "complet"
                  ? { to: "/inventaire/$id/rapport", params: { id: inv.id } }
                  : { to: "/inventaire/$id/compter", params: { id: inv.id } };
              return (
                <Link
                  key={inv.id}
                  to={target.to}
                  params={target.params}
                  className="block"
                >
                  <Card className="transition hover:border-primary/50">
                    <CardContent className="flex items-center justify-between gap-4 py-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{inv.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(inv.created_at).toLocaleString("fr-FR")}
                          {inv.created_by ? ` · ${inv.created_by}` : ""}
                        </p>
                      </div>
                      <Badge
                        variant={
                          inv.status === "complet" ? "default" : "secondary"
                        }
                      >
                        {inv.status === "complet" ? "Complet" : "En cours"}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
