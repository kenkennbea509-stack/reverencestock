export type ItemStatus = "conforme" | "manquant" | "surplus" | "non_compte";

export function computeStatus(
  systemQty: number,
  countedQty: number | null | undefined,
): ItemStatus {
  if (countedQty === null || countedQty === undefined) return "non_compte";
  const diff = countedQty - systemQty;
  if (diff === 0) return "conforme";
  if (diff < 0) return "manquant";
  return "surplus";
}

export function formatDiff(
  systemQty: number,
  countedQty: number | null | undefined,
): string {
  if (countedQty === null || countedQty === undefined) return "—";
  const diff = countedQty - systemQty;
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}

export function statusLabel(s: ItemStatus): string {
  switch (s) {
    case "conforme":
      return "Conforme";
    case "manquant":
      return "Manquant";
    case "surplus":
      return "Surplus";
    case "non_compte":
      return "Non compté";
  }
}
