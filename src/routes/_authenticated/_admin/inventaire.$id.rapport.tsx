import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download } from "lucide-react";
import { computeStatus, formatDiff, statusLabel, type ItemStatus } from "@/lib/inventory-utils";

export const Route = createFileRoute("/_authenticated/_admin/inventaire/$id/rapport")({
  component: RapportPage,
});

interface Item {
  id: string;
  product_name: string;
  system_qty: number;
  counted_qty: number | null;
}

interface InventoryMeta {
  id: string;
  name: string;
  status: string;
  created_by: string | null;
  counted_by: string | null;
  completed_at: string | null;
}

const FILTERS: { key: "all" | ItemStatus; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "manquant", label: "Manquants" },
  { key: "surplus", label: "Surplus" },
  { key: "conforme", label: "Conformes" },
];

function RapportPage() {
  const { id } = Route.useParams();
  const [inv, setInv] = useState<InventoryMeta | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | ItemStatus>("all");

  useEffect(() => {
    (async () => {
      const [{ data: invData }, { data: itemsData }] = await Promise.all([
        supabase.from("inventories").select("*").eq("id", id).single(),
        supabase
          .from("inventory_items")
          .select("id,product_name,system_qty,counted_qty")
          .eq("inventory_id", id)
          .order("product_name"),
      ]);
      setInv(invData as InventoryMeta);
      setItems((itemsData ?? []) as Item[]);
      setLoading(false);
    })();
  }, [id]);

  const stats = useMemo(() => {
    let conforme = 0,
      manquant = 0,
      surplus = 0,
      ecart = 0;
    for (const i of items) {
      const s = computeStatus(i.system_qty, i.counted_qty);
      if (s === "conforme") conforme++;
      else if (s === "manquant") manquant++;
      else if (s === "surplus") surplus++;
      if (i.counted_qty !== null) ecart += Math.abs((i.counted_qty ?? 0) - i.system_qty);
    }
    return { total: items.length, conforme, manquant, surplus, ecart };
  }, [items]);

  const filtered = items.filter((i) => {
    if (filter === "all") return true;
    return computeStatus(i.system_qty, i.counted_qty) === filter;
  });

  const exportCsv = () => {
    const rows = [
      ["Produit", "Système", "Compté", "Différence", "Statut"],
      ...items.map((i) => {
        const s = computeStatus(i.system_qty, i.counted_qty);
        return [
          i.product_name,
          i.system_qty.toString(),
          i.counted_qty?.toString() ?? "",
          formatDiff(i.system_qty, i.counted_qty),
          statusLabel(s),
        ];
      }),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${inv?.name ?? "rapport"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold">Rapport détaillé</h1>
            <p className="text-xs text-muted-foreground">
              {inv?.name}
              {inv?.completed_at
                ? ` · ${new Date(inv.completed_at).toLocaleString("fr-FR")}`
                : ""}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-1 h-4 w-4" /> CSV
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <StatCard label="Produits" value={stats.total} />
              <StatCard label="Conformes" value={stats.conforme} tone="ok" />
              <StatCard label="Manquants" value={stats.manquant} tone="bad" />
              <StatCard label="Surplus" value={stats.surplus} tone="warn" />
              <StatCard label="Écart total" value={stats.ecart} />
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <Button
                  key={f.key}
                  size="sm"
                  variant={filter === f.key ? "default" : "outline"}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </Button>
              ))}
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Système</TableHead>
                      <TableHead>Compté</TableHead>
                      <TableHead>Différence</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((i) => {
                      const s = computeStatus(i.system_qty, i.counted_qty);
                      return (
                        <TableRow key={i.id}>
                          <TableCell className="font-medium">{i.product_name}</TableCell>
                          <TableCell>{i.system_qty}</TableCell>
                          <TableCell>{i.counted_qty ?? "—"}</TableCell>
                          <TableCell
                            className={
                              s === "manquant"
                                ? "text-destructive"
                                : s === "surplus"
                                  ? "text-amber-500"
                                  : ""
                            }
                          >
                            {formatDiff(i.system_qty, i.counted_qty)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                s === "conforme"
                                  ? "default"
                                  : s === "manquant"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {statusLabel(s)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-8 text-center text-sm text-muted-foreground"
                        >
                          Aucun produit dans ce filtre.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok" | "bad" | "warn";
}) {
  const color =
    tone === "ok"
      ? "text-emerald-500"
      : tone === "bad"
        ? "text-destructive"
        : tone === "warn"
          ? "text-amber-500"
          : "text-foreground";
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
