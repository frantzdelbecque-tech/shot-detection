"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { BunnyVideoPlayer } from "@/components/BunnyVideoPlayer";
import { DownloadEdlButton } from "@/components/DownloadEdlButton";
import {
  computeFrameCount,
  formatTimeValue,
  formatTimecode,
  parseStartTimeSeconds,
} from "@/lib/shot-time";

type SdShotRow = {
  id: string;
  scene_number: number | null;
  vignette_url: string | null;
  start_time: unknown;
  end_time: unknown;
  nb_images?: number | null;
  nb_frames?: number | null;
  vfx_id_cleaned?: string | null;
  vfx_id_cleande?: string | null;
  sequence_vfx_id?: string | null;
  sequence_category?: string | null;
  sequence_description?: string | null;
  sequence_descritpion?: string | null;
  sequence_comment?: string | null;
  sequence_comments?: string | null;
  episode_name?: string | null;
  edit_sequence_nme?: string | null;
  edit_shot_description?: string | null;
  edit_shot_notes?: string | null;
  decor: string | null;
  action_generale: string | null;
  nb_perso_total: number | null;
  personnages: unknown;
  [key: string]: unknown;
};

type SeekSignal = { value: number; nonce: number };
const SEEK_OFFSET_FRAMES = 2;
const TIMECODE_FPS = 25;

type MovieVideoSectionProps = {
  movieId: string;
  embedUrl: string | null;
  title: string;
  shots: SdShotRow[];
  isAdmin: boolean;
  cacheBuster: string;
  edlFilename: string;
};

function withCacheBuster(url: string, cacheBuster: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("v", cacheBuster);
    return parsed.toString();
  } catch {
    return url;
  }
}

function toFilterValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function TruncatedTextCell({ value }: { value: string | null | undefined }) {
  const text = value?.trim() ?? "";
  if (!text) return <>—</>;

  const maxChars = 35;
  const shortened =
    text.length > maxChars ? `${text.slice(0, maxChars - 3).trimEnd()}...` : text;

  return (
    <span
      className="block max-w-[220px] overflow-hidden text-ellipsis"
      style={{
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
      }}
      title={text}
    >
      {shortened}
    </span>
  );
}

export function MovieVideoSection({
  movieId,
  embedUrl,
  title,
  shots,
  isAdmin,
  cacheBuster,
  edlFilename,
}: MovieVideoSectionProps) {
  const router = useRouter();
  const [seekSignal, setSeekSignal] = useState<SeekSignal | null>(null);
  const [selectedShots, setSelectedShots] = useState<string[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [sequenceVfxIdFilter, setSequenceVfxIdFilter] = useState("");
  const [sequenceCategoryFilter, setSequenceCategoryFilter] = useState("");
  const [sequenceCommentFilter, setSequenceCommentFilter] = useState("");
  const [episodeNameFilter, setEpisodeNameFilter] = useState("");
  const [shotNameFilter, setShotNameFilter] = useState("");

  const sequenceVfxIdOptions = useMemo(
    () =>
      Array.from(
        new Set(
          shots
            .map((shot) => toFilterValue(shot.sequence_vfx_id))
            .filter((value) => value !== ""),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [shots],
  );

  const sequenceCategoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          shots
            .map((shot) => toFilterValue(shot.sequence_category))
            .filter((value) => value !== ""),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [shots],
  );

  const sequenceCommentOptions = useMemo(
    () =>
      Array.from(
        new Set(
          shots
            .map((shot) =>
              toFilterValue(shot.sequence_comments ?? shot.sequence_comment),
            )
            .filter((value) => value !== ""),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [shots],
  );

  const episodeNameOptions = useMemo(
    () =>
      Array.from(
        new Set(
          shots
            .map((shot) => toFilterValue(shot.episode_name))
            .filter((value) => value !== ""),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [shots],
  );

  const filteredShots = useMemo(() => {
    const normalized = (value: string) => value.trim().toLowerCase();
    const sequenceVfxFilter = normalized(sequenceVfxIdFilter);
    const sequenceCategory = normalized(sequenceCategoryFilter);
    const sequenceComment = normalized(sequenceCommentFilter);
    const episodeName = normalized(episodeNameFilter);
    const shotName = normalized(shotNameFilter);

    return shots.filter((shot) => {
      const vfxIdCleaned = String(
        shot.vfx_id_cleaned ?? shot.vfx_id_cleande ?? "",
      ).toLowerCase();
      const seqVfx = String(shot.sequence_vfx_id ?? "").toLowerCase();
      const seqCategory = String(shot.sequence_category ?? "").toLowerCase();
      const seqCommentValue = String(
        shot.sequence_comments ?? shot.sequence_comment ?? "",
      ).toLowerCase();
      const episodeValue = String(shot.episode_name ?? "").toLowerCase();

      return (
        (!shotName || vfxIdCleaned.includes(shotName)) &&
        (!sequenceVfxFilter || seqVfx.includes(sequenceVfxFilter)) &&
        (!sequenceCategory || seqCategory.includes(sequenceCategory)) &&
        (!sequenceComment || seqCommentValue.includes(sequenceComment)) &&
        (!episodeName || episodeValue.includes(episodeName))
      );
    });
  }, [
    episodeNameFilter,
    sequenceCategoryFilter,
    sequenceCommentFilter,
    sequenceVfxIdFilter,
    shotNameFilter,
    shots,
  ]);

  const totalFrames = useMemo(
    () =>
      filteredShots.reduce((acc, shot) => {
        const frameCount = computeFrameCount(
          shot.start_time,
          shot.end_time,
          shot.nb_images ?? shot.nb_frames,
        );
        return acc + (frameCount ?? 0);
      }, 0),
    [filteredShots],
  );

  const displayedShots = useMemo(
    () => (isAdmin ? filteredShots : filteredShots.slice(0, 60)),
    [filteredShots, isAdmin],
  );

  const displayedTotalFrames = useMemo(
    () =>
      displayedShots.reduce((acc, shot) => {
        const frameCount = computeFrameCount(
          shot.start_time,
          shot.end_time,
          shot.nb_images ?? shot.nb_frames,
        );
        return acc + (frameCount ?? 0);
      }, 0),
    [displayedShots],
  );

  const seekToShotStart = useCallback((startTime: unknown) => {
    const seconds = parseStartTimeSeconds(startTime);
    if (seconds === null) return;
    const seekSeconds = Math.max(0, seconds + SEEK_OFFSET_FRAMES / TIMECODE_FPS);
    setSeekSignal((prev) => ({
      value: seekSeconds,
      nonce: (prev?.nonce ?? 0) + 1,
    }));
  }, []);

  const toggleShotSelection = useCallback((shotId: string) => {
    setSelectedShots((prev) =>
      prev.includes(shotId)
        ? prev.filter((selectedId) => selectedId !== shotId)
        : [...prev, shotId],
    );
  }, []);

  const handleMergeSelection = useCallback(async () => {
    if (selectedShots.length < 2) return;

    const selectedRows = shots.filter((shot) => selectedShots.includes(shot.id));
    const sceneNumbers = selectedRows
      .map((shot) => shot.scene_number)
      .filter((sceneNumber): sceneNumber is number => sceneNumber !== null)
      .sort((a, b) => a - b);

    const allHaveSceneNumber = sceneNumbers.length === selectedRows.length;
    const areContiguous =
      allHaveSceneNumber &&
      sceneNumbers.every(
        (sceneNumber, index) =>
          index === 0 || sceneNumber === sceneNumbers[index - 1] + 1,
      );

    if (!areContiguous) {
      window.alert("Les plans doivent être contigus pour être fusionnés");
      return;
    }

    try {
      setIsMerging(true);

      const payloadShots = selectedRows.map((shot) => ({
        id: shot.id,
        scene_number: shot.scene_number as number,
        start_time: shot.start_time,
        end_time: shot.end_time,
      }));

      const response = await fetch("/api/shots/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shots: payloadShots }),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        window.alert(result.error ?? "La fusion des plans a échoué.");
        return;
      }

      setSelectedShots([]);
      router.refresh();
    } catch {
      window.alert("La fusion des plans a échoué.");
    } finally {
      setIsMerging(false);
    }
  }, [router, selectedShots, shots]);

  return (
    <>
      <section
        className="sticky top-14 z-30 -mx-4 mb-1 bg-black px-4 pb-1.5 pt-0 shadow-[0_8px_24px_rgba(0,0,0,0.65)] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        aria-label="Lecteur vidéo"
      >
        <div className="relative z-40 -mx-4 mb-0.5 flex flex-wrap items-center gap-1 border-b border-zinc-800 bg-black px-4 pb-1 pt-1 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <Link
            href="/movies"
            className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
          >
            Back
          </Link>
          <h1 className="text-sm font-semibold tracking-tight text-zinc-50 sm:text-base">
            {title}
          </h1>
          <DownloadEdlButton fileName={edlFilename} shots={shots} />
          <button
            type="button"
            onClick={handleMergeSelection}
            disabled={selectedShots.length < 2 || isMerging}
            className="inline-flex rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900/60 disabled:text-zinc-500"
          >
            {isMerging ? "Fusion en cours..." : "Fusionner la sélection"}
          </button>
        </div>
        <div className="mx-auto w-full max-w-sm">
          <BunnyVideoPlayer
            embedUrl={embedUrl}
            title={title}
            seekSignal={seekSignal}
          />
        </div>
      </section>

      <section>
        {shots.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucun plan pour ce film.</p>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-zinc-300">
              Plans affichés: <span className="font-semibold">{displayedShots.length}</span>{" "}
              | Total images: <span className="font-semibold">{displayedTotalFrames}</span>
              {!isAdmin && filteredShots.length > 60 ? (
                <span className="text-zinc-500"> (limité à 60 pour les non-admins)</span>
              ) : null}
            </div>

            <div className="-mx-2 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-sm sm:mx-0">
              <table className="min-w-[1850px] table-fixed divide-y divide-zinc-800 text-xs text-zinc-200 xl:min-w-full">
              <colgroup>
                <col className="w-16" />
                <col className="w-14" />
                <col className="w-36" />
                <col className="w-28" />
                <col className="w-28" />
                <col className="w-24" />
                <col className="w-36" />
                <col className="w-36" />
                <col className="w-32" />
                <col className="w-[240px]" />
                <col className="w-[240px]" />
                <col className="w-[180px]" />
                <col className="w-[200px]" />
                <col className="w-[200px]" />
              </colgroup>
              <thead className="bg-zinc-900/60">
                <tr>
                  <th
                    className="px-3 py-3 text-left font-medium text-zinc-300"
                    aria-label="Sélection"
                  />
                  <th
                    className="px-3 py-3 text-left font-medium text-zinc-300"
                    aria-label="Scène"
                  >
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-300">
                    Vignette
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-300">
                    TC Début
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-300">
                    TC Fin
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-300">
                    Images
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-300">
                    Shot Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-300">
                    Vfx Id
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-300">
                    Seq Category
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-300">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-300">
                    Type VFX / IA
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-300">
                    Episode
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-300">
                    Decor
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-300">
                    Action
                  </th>
                </tr>
                <tr>
                  <th className="px-2 py-2" />
                  <th className="px-2 py-2" />
                  <th className="px-2 py-2" />
                  <th className="px-2 py-2" />
                  <th className="px-2 py-2" />
                  <th className="px-2 py-2" />
                  <th className="px-2 py-2">
                    <input
                      type="text"
                      value={shotNameFilter}
                      onChange={(e) => setShotNameFilter(e.target.value)}
                      placeholder="Filtrer"
                      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <select
                      value={sequenceVfxIdFilter}
                      onChange={(e) => setSequenceVfxIdFilter(e.target.value)}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-100 focus:border-zinc-500 focus:outline-none"
                    >
                      <option value="">Tous</option>
                      {sequenceVfxIdOptions.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th className="px-2 py-2">
                    <select
                      value={sequenceCategoryFilter}
                      onChange={(e) => setSequenceCategoryFilter(e.target.value)}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-100 focus:border-zinc-500 focus:outline-none"
                    >
                      <option value="">Toutes</option>
                      {sequenceCategoryOptions.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th className="px-2 py-2" />
                  <th className="px-2 py-2">
                    <select
                      value={sequenceCommentFilter}
                      onChange={(e) => setSequenceCommentFilter(e.target.value)}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-100 focus:border-zinc-500 focus:outline-none"
                    >
                      <option value="">Tous</option>
                      {sequenceCommentOptions.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th className="px-2 py-2">
                    <select
                      value={episodeNameFilter}
                      onChange={(e) => setEpisodeNameFilter(e.target.value)}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-100 focus:border-zinc-500 focus:outline-none"
                    >
                      <option value="">Tous</option>
                      {episodeNameOptions.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th className="px-2 py-2" />
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {displayedShots.map((shot, index) => {
                  const startSeconds = parseStartTimeSeconds(shot.start_time);
                  const isSelected = selectedShots.includes(shot.id);
                  const frameCount = computeFrameCount(
                    shot.start_time,
                    shot.end_time,
                    shot.nb_images ?? shot.nb_frames,
                  );
                  const vfxIdCleaned = shot.vfx_id_cleaned ?? shot.vfx_id_cleande;
                  const sequenceDescription =
                    shot.sequence_description ?? shot.sequence_descritpion;
                  const sequenceCommentValue =
                    shot.sequence_comments ?? shot.sequence_comment;

                  return (
                    <tr key={shot.id} className={isSelected ? "bg-zinc-900/40" : ""}>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleShotSelection(shot.id)}
                          aria-label={`Sélectionner le plan ${shot.scene_number ?? index + 1}`}
                          className="mt-0.5 h-3.5 w-3.5 accent-zinc-300 rounded border-zinc-600 bg-zinc-950 text-zinc-100 focus:ring-zinc-400"
                        />
                      </td>
                      <td className="px-3 py-2 align-top font-medium text-zinc-100">
                        <Link
                          href={`/movies/${movieId}/shots/${shot.id}`}
                          className="inline-flex rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
                        >
                          {shot.scene_number ?? "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-2 align-top">
                        <div
                          className={`relative h-14 w-24 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 ${
                            startSeconds !== null
                              ? "cursor-pointer ring-offset-2 ring-offset-zinc-950 transition hover:ring-2 hover:ring-zinc-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
                              : ""
                          }`}
                          role={startSeconds !== null ? "button" : undefined}
                          tabIndex={startSeconds !== null ? 0 : undefined}
                          aria-label={
                            startSeconds !== null
                              ? `Aller à ${formatTimeValue(shot.start_time)} dans la vidéo`
                              : undefined
                          }
                          onClick={
                            startSeconds !== null
                              ? () => seekToShotStart(shot.start_time)
                              : undefined
                          }
                          onKeyDown={
                            startSeconds !== null
                              ? (e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    seekToShotStart(shot.start_time);
                                  }
                                }
                              : undefined
                          }
                        >
                          {shot.vignette_url ? (
                            <Image
                              src={withCacheBuster(shot.vignette_url, cacheBuster)}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="112px"
                              loading={index === 0 ? "eager" : "lazy"}
                              priority={index === 0}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center px-1 text-center text-xs text-zinc-500">
                              Pas de vignette
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 align-top">
                        {formatTimecode(shot.start_time, 25)}
                      </td>
                      <td className="px-4 py-2 align-top">
                        {formatTimecode(shot.end_time, 25)}
                      </td>
                      <td className="px-4 py-2 align-top text-zinc-300">
                        {frameCount ?? "—"}
                      </td>
                      <td className="px-4 py-2 align-top text-zinc-300">
                        {vfxIdCleaned ?? "—"}
                      </td>
                      <td className="px-4 py-2 align-top">
                        {shot.sequence_vfx_id ?? "—"}
                      </td>
                      <td className="px-4 py-2 align-top">
                        {shot.sequence_category ?? "—"}
                      </td>
                      <td className="px-4 py-2 align-top">
                        <TruncatedTextCell value={sequenceDescription} />
                      </td>
                      <td className="px-4 py-2 align-top">
                        {sequenceCommentValue ?? "—"}
                      </td>
                      <td className="px-4 py-2 align-top">
                        {shot.episode_name ?? "—"}
                      </td>
                      <td className="px-4 py-2 align-top">
                        <TruncatedTextCell value={shot.decor} />
                      </td>
                      <td className="px-4 py-2 align-top">
                        <TruncatedTextCell value={shot.action_generale} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
