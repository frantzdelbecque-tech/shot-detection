import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { normalizePersonnages } from "@/components/PersonnagesList";
import { computeFrameCount, formatTimecode } from "@/lib/shot-time";
import {
  isDoneStatus,
  SD_MOVIE_TABLE,
  SD_SHOT_MOVIE_FK,
  SD_SHOTS_TABLE,
} from "@/lib/sd-movie";
import { createClient } from "@/lib/supabase/server";

type ShotDetailPageProps = {
  params: Promise<{ id: string; shotId: string }>;
};

const FIELD_LABELS: Record<string, string> = {
  scene_number: "Plan",
  start_time_tc_25fps: "TC Debut (25 fps)",
  end_time_tc_25fps: "TC Fin (25 fps)",
  decor: "Decor",
  action_generale: "Action",
  frame_count: "Nombre d'images",
  nb_perso_total: "Nombre personnages",
  sequence_vfx_id: "Vfx Id",
  sequence_category: "Seq Category",
  sequence_description: "Description",
  sequence_comment: "Type VFX / IA",
  vfx_id_cleaned: "Shot Name",
  episode_name: "Episode",
  edit_sequence_nme: "Edit Sequence Name",
  edit_shot_description: "Edit Shot Description",
  edit_shot_notes: "Edit Shot Notes",
  edit_shot_lenght: "Edit Shot Length",
};

function asDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function getLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

function ActionsSpecifiquesTable({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") return <>—</>;

  const values = Array.isArray(value) ? value : [value];
  const lines = values
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (typeof entry === "object") return JSON.stringify(entry);
      return String(entry);
    })
    .filter((entry) => entry !== "");

  if (lines.length === 0) return <>—</>;

  return (
    <div className="overflow-x-auto rounded-md border border-zinc-700">
      <table className="min-w-full divide-y divide-zinc-700 text-xs">
        <tbody className="divide-y divide-zinc-700">
          {lines.map((line, index) => (
            <tr key={`action-${index}`}>
              <td className="px-2 py-1 text-zinc-200">{line}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FieldTable({ rows }: { rows: Array<[string, unknown]> }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="min-w-full divide-y divide-zinc-800 text-xs">
        <tbody className="divide-y divide-zinc-800">
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th className="w-64 bg-zinc-900/60 px-3 py-2 text-left font-semibold text-zinc-200">
                {getLabel(label)}
              </th>
              <td className="px-3 py-2 whitespace-pre-wrap break-words text-zinc-200">
                {asDisplayValue(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PersonnagesTable({ raw }: { raw: unknown }) {
  const entries = normalizePersonnages(raw);
  if (entries.length === 0) {
    return <p className="text-xs text-zinc-500">Aucune donnée personnage.</p>;
  }

  const columns = Array.from(
    new Set(entries.flatMap((entry) => Object.keys(entry))),
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="min-w-full divide-y divide-zinc-800 text-xs">
        <thead className="bg-zinc-900/70">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-zinc-300">#</th>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 text-left font-semibold text-zinc-200">
                {getLabel(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {entries.map((entry, index) => (
            <tr key={`personnage-${index}`}>
              <td className="px-3 py-2 align-top text-zinc-500">{index + 1}</td>
              {columns.map((column) => (
                <td key={`${index}-${column}`} className="px-3 py-2 align-top text-zinc-200">
                  {column === "actions_specifiques" ? (
                    <ActionsSpecifiquesTable value={entry[column]} />
                  ) : (
                    asDisplayValue(entry[column])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ShotDetailPage({ params }: ShotDetailPageProps) {
  const { id, shotId } = await params;
  const supabase = await createClient();

  const { data: movie } = await supabase
    .from(SD_MOVIE_TABLE)
    .select("id, file_name, status")
    .eq("id", id)
    .maybeSingle();

  if (!movie || !isDoneStatus(movie.status)) {
    notFound();
  }

  const { data: shot, error: shotError } = await supabase
    .from(SD_SHOTS_TABLE)
    .select("*")
    .eq(SD_SHOT_MOVIE_FK, id)
    .eq("id", shotId)
    .maybeSingle();

  if (shotError || !shot) {
    notFound();
  }

  const { data: orderedShots } = await supabase
    .from(SD_SHOTS_TABLE)
    .select("id")
    .eq(SD_SHOT_MOVIE_FK, id)
    .order("start_time", { ascending: true, nullsFirst: false });

  const orderedShotIds = (orderedShots ?? []).map((row) => String(row.id));
  const currentShotIndex = orderedShotIds.findIndex((value) => value === shotId);
  const previousShotId =
    currentShotIndex > 0 ? orderedShotIds[currentShotIndex - 1] : null;
  const nextShotId =
    currentShotIndex >= 0 && currentShotIndex < orderedShotIds.length - 1
      ? orderedShotIds[currentShotIndex + 1]
      : null;

  const vfxData: Array<[string, unknown]> = [
    ["scene_number", shot.scene_number],
    ["start_time_tc_25fps", formatTimecode(shot.start_time, 25)],
    ["end_time_tc_25fps", formatTimecode(shot.end_time, 25)],
    [
      "frame_count",
      computeFrameCount(shot.start_time, shot.end_time, shot.nb_images ?? shot.nb_frames),
    ],
    ["decor", shot.decor],
    ["action_generale", shot.action_generale],
    ["nb_perso_total", shot.nb_perso_total],
  ];

  const sequenceData: Array<[string, unknown]> = [
    ["sequence_vfx_id", shot.sequence_vfx_id],
    ["sequence_category", shot.sequence_category],
    ["sequence_description", shot.sequence_description ?? shot.sequence_descritpion],
    ["sequence_comment", shot.sequence_comments ?? shot.sequence_comment],
  ];

  const editData: Array<[string, unknown]> = [
    ["vfx_id_cleaned", shot.vfx_id_cleaned ?? shot.vfx_id_cleande],
    ["episode_name", shot.episode_name],
    ["edit_sequence_nme", shot.edit_sequence_nme],
    ["edit_shot_lenght", shot.edit_shot_lenght],
    ["edit_shot_description", shot.edit_shot_description],
    ["edit_shot_notes", shot.edit_shot_notes],
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/movies/${id}`}
          className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
        >
          Retour au movie
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
          {movie.file_name} - Plan {shot.scene_number ?? "—"}
        </h1>
      </div>

      <div className="space-y-6">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-center gap-4">
          {previousShotId ? (
            <Link
              href={`/movies/${id}/shots/${previousShotId}`}
              className="inline-flex rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              Previous
            </Link>
          ) : (
            <span className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-sm font-medium text-zinc-500">
              Previous
            </span>
          )}

          <div className="relative h-52 w-full max-w-md overflow-hidden rounded-xl border border-zinc-800 bg-black">
          {shot.vignette_url ? (
            <Image src={shot.vignette_url} alt="" fill className="object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Pas de vignette
            </div>
          )}
          </div>

          {nextShotId ? (
            <Link
              href={`/movies/${id}/shots/${nextShotId}`}
              className="inline-flex rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              Next
            </Link>
          ) : (
            <span className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-sm font-medium text-zinc-500">
              Next
            </span>
          )}
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-100">Données IA</h2>
            <FieldTable rows={vfxData} />
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold text-zinc-300">personnages</h3>
              <PersonnagesTable raw={shot.personnages} />
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-100">Données sequence</h2>
            <FieldTable rows={sequenceData} />
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-100">Données montage</h2>
            <FieldTable rows={editData} />
          </section>
        </div>
      </div>
    </div>
  );
}
