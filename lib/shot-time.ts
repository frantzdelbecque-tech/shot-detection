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

function parseNumericTimeValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/**
 * Convertit une valeur temporelle en timecode HH:MM:SS:FF.
 * La valeur source est interprétée en secondes, avec fraction.
 */
export function formatTimecode(
  value: unknown,
  fps = 25,
): string {
  const seconds = parseNumericTimeValue(value);
  if (seconds === null) return "—";

  const totalFrames = Math.max(0, Math.round(seconds * fps));
  const frames = totalFrames % fps;
  const totalSeconds = Math.floor(totalFrames / fps);
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;

  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
}

export function computeFrameCount(
  startTime: unknown,
  endTime: unknown,
  explicitFrameCount: unknown,
  fps = 25,
): number | null {
  if (typeof explicitFrameCount === "number" && Number.isFinite(explicitFrameCount)) {
    return Math.max(0, Math.round(explicitFrameCount));
  }

  if (typeof explicitFrameCount === "string" && explicitFrameCount.trim() !== "") {
    const parsed = Number(explicitFrameCount.trim());
    if (Number.isFinite(parsed)) return Math.max(0, Math.round(parsed));
  }

  const start = parseNumericTimeValue(startTime);
  const end = parseNumericTimeValue(endTime);
  if (start === null || end === null || end < start) return null;

  return Math.max(0, Math.round((end - start) * fps));
}
