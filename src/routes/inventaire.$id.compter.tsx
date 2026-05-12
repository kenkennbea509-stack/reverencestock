import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/inventaire/$id/compter")({
  component: ComptagePage,
});

interface Item {
  id: string;
  product_name: string;
  category: string | null;
  system_qty: number;
  counted_qty: number | null;
}

interface InventoryMeta {
  id: string;
  name: string;
  status: "en_cours" | "complet";
  counted_by: string | null;
}

function ComptagePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [inv, setInv] = useState<InventoryMeta | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [counter, setCounter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    (async () => {
      const [{ data: invData }, { data: itemsData }] = await Promise.all([
        supabase
          .from("inventories")
          .select("id,name,status,counted_by")
          .eq("id", id)
          .single(),
        supabase
          .from("inventory_items")
          .select("id,product_name,category,system_qty,counted_qty")
          .eq("inventory_id", id)
          .order("product_name"),
      ]);
      if (invData) {
        setInv(invData as InventoryMeta);
        if (invData.counted_by) setCounter(invData.counted_by);
        if (invData.status === "complet") {
          navigate({ to: "/inventaire/$id/rapport", params: { id } });
          return;
        }
      }
      setItems((itemsData ?? []) as Item[]);
      setLoading(false);
    })();
  }, [id, navigate]);

  const counted = items.filter((i) => i.counted_qty !== null).length;
  const allCounted = items.length > 0 && counted === items.length;
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.product_name.toLowerCase().includes(q));
  }, [items, search]);

  const updateItem = (itemId: string, value: string) => {
    const num = value === "" ? null : Number(value);
    if (value !== "" && (isNaN(num as number) || (num as number) < 0)) return;
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, counted_qty: num } : i)),
    );
    if (debounceRef.current[itemId]) clearTimeout(debounceRef.current[itemId]);
    debounceRef.current[itemId] = setTimeout(async () => {
      await supabase
        .from("inventory_items")
        .update({ counted_qty: num })
        .eq("id", itemId);
    }, 400);
  };

  const handleCounterBlur = async () => {
    if (!counter.trim() || counter === inv?.counted_by) return;
    await supabase
      .from("inventories")
      .update({ counted_by: counter.trim() })
      .eq("id", id);
  };

  const handleComplete = async () => {
    if (!allCounted) return;
    if (!counter.trim()) {
      toast.error("Veuillez saisir le nom de l'opérateur de comptage.");
      return;
    }
    setCompleting(true);
    // Flush pending debounced updates
    Object.values(debounceRef.current).forEach((t) => clearTimeout(t));
    await Promise.all(
      items.map((i) =>
        supabase
          .from("inventory_items")
          .update({ counted_qty: i.counted_qty })
          .eq("id", i.id),
      ),
    );
    const { error } = await supabase
      .from("inventories")
      .update({
        status: "complet",
        counted_by: counter.trim(),
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      toast.error("Erreur lors de la finalisation.");
      setCompleting(false);
      return;
    }
    toast.success("Inventaire complet !");
    navigate({ to: "/" });
  };

  const progress = items.length === 0 ? 0 : (counted / items.length) * 100;

  return (
    <div className="min-h-screen bg-background pb-32 text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold">
                {inv?.name ?? "Inventaire"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {counted} / {items.length} comptés
              </p>
            </div>
          </div>
          <Progress value={progress} className="mt-3 h-1.5" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-3 px-4 py-4">
        <Card>
          <CardContent className="pt-4">
            <Label htmlFor="counter">Opérateur du comptage</Label>
            <Input
              id="counter"
              value={counter}
              onChange={(e) => setCounter(e.target.value)}
              onBlur={handleCounterBlur}
              placeholder="Votre nom"
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit…"
        />

        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun produit trouvé.</p>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((i) => (
              <Card key={i.id}>
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{i.product_name}</p>
                  </div>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    placeholder="—"
                    value={i.counted_qty ?? ""}
                    onChange={(e) => updateItem(i.id, e.target.value)}
                    className="w-24 text-right text-base"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <Button
            size="lg"
            className="w-full"
            disabled={!allCounted || completing}
            onClick={handleComplete}
          >
            <Check className="mr-2 h-4 w-4" />
            {completing
              ? "Enregistrement…"
              : allCounted
                ? "Enregistrer et terminer"
                : `Compter tous les produits (${counted}/${items.length})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
