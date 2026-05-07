import Papa from "papaparse";

const ALLOWED_CATEGORIES = [
  "boissons alcooliques",
  "boissons gazeuses",
  "lait",
  "fruit",
];

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

        if (!stockColumn) {
          reject(
            new Error(
              "Colonne « In stock » introuvable dans le fichier CSV.",
            ),
          );
          return;
        }
        if (!nameColumn) {
          reject(new Error("Colonne « Name » introuvable dans le fichier CSV."));
          return;
        }
        if (!categoryColumn) {
          reject(
            new Error("Colonne « category » introuvable dans le fichier CSV."),
          );
          return;
        }

        const products: ParsedProduct[] = [];
        for (const row of result.data) {
          const cat = row[categoryColumn] ?? "";
          if (!ALLOWED_CATEGORIES.includes(normalize(cat))) continue;
          const name = (row[nameColumn] ?? "").trim();
          if (!name) continue;
          const rawStock = (row[stockColumn] ?? "0")
            .toString()
            .replace(",", ".")
            .replace(/[^\d.\-]/g, "");
          const qty = parseFloat(rawStock);
          products.push({
            name,
            category: cat,
            systemQty: isNaN(qty) ? 0 : qty,
          });
        }

        resolve({
          products,
          totalRows: result.data.length,
          stockColumn,
          errors,
        });
      },
      error: (err) => reject(err),
    });
  });
}
