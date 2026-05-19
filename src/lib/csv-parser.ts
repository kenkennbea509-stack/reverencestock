import Papa from "papaparse";

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export interface ParsedProduct {
  name: string;
  category: string;
  systemQty: number;
}

export interface ParseResult {
  products: ParsedProduct[];
  totalRows: number;
  stockColumn: string;
  errors: string[];
}

export async function parseInventoryCsv(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const errors: string[] = [];
        if (!result.data.length) {
          reject(new Error("Le fichier CSV est vide."));
          return;
        }

        const headers = Object.keys(result.data[0]);
        const stockColumn = headers.find((h) =>
          normalize(h).includes("in stock"),
        );
        const nameColumn = headers.find((h) => normalize(h) === "name");
        const categoryColumn = headers.find(
          (h) => normalize(h) === "category",
        );
        const trackStockColumn = headers.find(
          (h) => normalize(h) === "track stock",
        );

        if (!trackStockColumn) {
          reject(
            new Error(
              "Colonne « Track stock » introuvable dans le fichier CSV.",
            ),
          );
          return;
        }
        if (!nameColumn) {
          reject(new Error("Colonne « Name » introuvable dans le fichier CSV."));
          return;
        }

        const products: ParsedProduct[] = [];
        for (const row of result.data) {
          const track = (row[trackStockColumn] ?? "").toString().trim().toLowerCase();
          if (track !== "y") continue;
          const name = (row[nameColumn] ?? "").trim();
          if (!name) continue;
          const cat = categoryColumn ? (row[categoryColumn] ?? "") : "";
          let qty = 0;
          if (stockColumn) {
            const rawStockRaw = (row[stockColumn] ?? "").toString().trim();
            if (rawStockRaw !== "") {
              const rawStock = rawStockRaw.replace(",", ".").replace(/[^\d.\-]/g, "");
              const parsed = parseFloat(rawStock);
              qty = isNaN(parsed) ? 0 : parsed;
            }
          }
          products.push({ name, category: cat, systemQty: qty });
        }

        resolve({
          products,
          totalRows: result.data.length,
          stockColumn: stockColumn ?? "",
          errors,
        });
      },
      error: (err) => reject(err),
    });
  });
}
