/**
 * Secondes de début d’un plan pour seek vidéo (float DB ou chaîne numérique).
 */
export function parseStartTimeSeconds(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.trim());
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function formatTimeValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number" && Number.isFinite(value)) {
    const sec = Math.floor(value);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  return String(value);
}
