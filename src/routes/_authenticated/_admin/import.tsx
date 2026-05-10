import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { parseInventoryCsv, type ParsedProduct } from "@/lib/csv-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/import")({
  component: ImportPage,
});

function ImportPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const today = new Date().toLocaleDateString("fr-FR");
  const [name, setName] = useState(`Inventaire ${today}`);
  const [products, setProducts] = useState<ParsedProduct[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    try {
      const result = await parseInventoryCsv(file);
      setProducts(result.products);
      setFileName(file.name);
      if (result.products.length === 0) {
        toast.warning(
          "Aucun produit dans les catégories acceptées (Boissons alcooliques, Boissons gazeuses, Lait, Fruit).",
        );
      } else {
        toast.success(`${result.products.length} produits trouvés.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de lecture du CSV");
      setProducts([]);
      setFileName(null);
    } finally {
      setParsing(false);
    }
  };

  const handleCreate = async () => {
    if (products.length === 0) {
      toast.error("Veuillez importer un fichier CSV avec des produits.");
      return;
    }
    setCreating(true);
    const operatorName = profile?.display_name ?? profile?.username ?? "admin";
    const { data: inv, error } = await supabase
      .from("inventories")
      .insert({
        name: name.trim() || `Inventaire ${today}`,
        created_by: operatorName,
        owner_id: profile?.id ?? null,
      })
      .select("id")
      .single();
    if (error || !inv) {
      toast.error("Erreur lors de la création de l'inventaire.");
      setCreating(false);
      return;
    }
    const { error: itemsError } = await supabase.from("inventory_items").insert(
      products.map((p) => ({
        inventory_id: inv.id,
        product_name: p.name,
        category: p.category,
        system_qty: p.systemQty,
      })),
    );
    if (itemsError) {
      toast.error("Erreur lors de l'enregistrement des produits.");
      setCreating(false);
      return;
    }
    toast.success("Inventaire créé !");
    navigate({ to: "/" });
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
          <h1 className="text-lg font-semibold">Nouvel inventaire</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'inventaire</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-6">
            <Label>Fichier CSV du système</Label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/20 px-4 py-8 text-center transition hover:bg-muted/40">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {parsing
                  ? "Lecture en cours…"
                  : fileName
                    ? fileName
                    : "Cliquer pour choisir un fichier CSV"}
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFile}
                disabled={parsing}
              />
            </label>
            {products.length > 0 && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{products.length}</span> produits
                seront comptés (catégories filtrées : Boissons alcooliques, Boissons gazeuses, Lait,
                Fruit).
              </p>
            )}
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          onClick={handleCreate}
          disabled={creating || products.length === 0}
        >
          {creating ? "Création…" : "Créer l'inventaire"}
        </Button>
      </main>
    </div>
  );
}
