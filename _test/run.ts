import { parseInventoryCsv } from "./csv-parser";
import fs from "fs";
const buf = fs.readFileSync("/tmp/test.csv");
const file = new File([buf], "test.csv", { type: "text/csv" });
const r = await parseInventoryCsv(file);
console.log("Total rows:", r.totalRows, "| Stock col:", r.stockColumn, "| Kept:", r.products.length);
for (const p of r.products) console.log(`  [${p.category}] ${p.name} = ${p.systemQty}`);
