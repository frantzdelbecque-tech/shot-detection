import type { ReactNode } from "react";

/** Objet personnage tel que stocké en JSON (clés extensibles). */
type PersonnageObject = Record<string, unknown>;

const PERSONNAGE_FIELD_ORDER = [
  "type",
  "age_approx",
  "details_physiques",
  "actions_specifiques",
] as const;

const PERSONNAGE_FIELD_LABELS: Record<string, string> = {
  type: "Type",
  age_approx: "Âge (approx.)",
  details_physiques: "Détails physiques",
  actions_specifiques: "Actions spécifiques",
  âge: "Âge",
  age: "Âge",
  actions: "Actions",
  détails: "Détails",
  details: "Détails",
};

function formatPersonnageFieldLabel(key: string): string {
  return (
    PERSONNAGE_FIELD_LABELS[key] ??
    key
      .replace(/_/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase())
  );
}

function isEmptyJsonValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

export function normalizePersonnages(raw: unknown): PersonnageObject[] {
  if (raw == null) return [];

  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return [];
    }
  }

  if (Array.isArray(parsed)) {
    return parsed.filter(
      (item): item is PersonnageObject =>
        item != null && typeof item === "object" && !Array.isArray(item),
    );
  }

  if (typeof parsed === "object" && !Array.isArray(parsed)) {
    return Object.values(parsed as Record<string, PersonnageObject>).filter(
      (item): item is PersonnageObject =>
        item != null && typeof item === "object" && !Array.isArray(item),
    );
  }

  return [];
}

function orderedPersonnageEntries(
  obj: PersonnageObject,
): [string, unknown][] {
  const keys = Object.keys(obj);
  const used = new Set<string>();
  const out: [string, unknown][] = [];

  for (const k of PERSONNAGE_FIELD_ORDER) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      used.add(k);
      if (!isEmptyJsonValue(obj[k])) {
        out.push([k, obj[k]]);
      }
    }
  }

  for (const k of keys.sort()) {
    if (!used.has(k) && !isEmptyJsonValue(obj[k])) {
      out.push([k, obj[k]]);
    }
  }

  return out;
}

function renderPersonnageValue(_key: string, value: unknown): ReactNode {
  if (isEmptyJsonValue(value)) return null;

  if (Array.isArray(value)) {
    const lines = value.filter(
      (item) => item !== null && item !== undefined && String(item).trim() !== "",
    );
    if (lines.length === 0) return null;
    return (
      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-zinc-300">
        {lines.map((item, idx) => (
          <li key={idx}>
            {typeof item === "object" && item !== null
              ? JSON.stringify(item)
              : String(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object" && value !== null) {
    return (
      <pre className="mt-1 max-w-full overflow-x-auto rounded-md bg-zinc-900/80 p-2 text-xs text-zinc-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return <span className="text-zinc-200">{String(value)}</span>;
}

export function PersonnagesList({ entries }: { entries: PersonnageObject[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-zinc-500">Aucune donnée personnage.</p>
    );
  }

  return (
    <ul className="list-disc space-y-4 pl-5 text-zinc-200">
      {entries.map((personnage, i) => {
        const fields = orderedPersonnageEntries(personnage);
        if (fields.length === 0) {
          return (
            <li key={i} className="text-xs text-zinc-500">
              Personnage sans champ renseigné
            </li>
          );
        }
        return (
          <li key={i} className="marker:text-zinc-500">
            <ul className="mt-1 list-[circle] space-y-2 pl-4 text-xs text-zinc-300">
              {fields.map(([key, value]) => {
                const rendered = renderPersonnageValue(key, value);
                if (rendered == null) return null;
                return (
                  <li key={key}>
                    <span className="text-zinc-500">
                      {formatPersonnageFieldLabel(key)}
                      {" · "}
                    </span>
                    {rendered}
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
