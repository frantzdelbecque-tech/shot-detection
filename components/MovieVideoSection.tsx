"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { BunnyVideoPlayer } from "@/components/BunnyVideoPlayer";
import { DownloadEdlButton } from "@/components/DownloadEdlButton";
import { formatTimeValue, parseStartTimeSeconds } from "@/lib/shot-time";
import { PersonnagesList, normalizePersonnages } from "@/components/PersonnagesList";

type SdShotRow = {
  id: string;
  scene_number: number | null;
  vignette_url: string | null;
  start_time: unknown;
  end_time: unknown;
  decor: string | null;
  action_generale: string | null;
  nb_perso_total: number | null;
  personnages: unknown;
};

type SeekSignal = { value: number; nonce: number };

type MovieVideoSectionProps = {
  embedUrl: string | null;
  title: string;
  shots: SdShotRow[];
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

export function MovieVideoSection({
  embedUrl,
  title,
  shots,
  cacheBuster,
  edlFilename,
}: MovieVideoSectionProps) {
  const router = useRouter();
  const [seekSignal, setSeekSignal] = useState<SeekSignal | null>(null);
  const [selectedShots, setSelectedShots] = useState<string[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  const seekToShotStart = useCallback((startTime: unknown) => {
    const seconds = parseStartTimeSeconds(startTime);
    if (seconds === null) return;
    setSeekSignal((prev) => ({
      value: seconds,
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
        className="sticky top-14 z-30 -mx-4 mb-8 bg-black px-4 pb-5 pt-0 shadow-[0_8px_32px_rgba(0,0,0,0.65)] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        aria-label="Lecteur vidéo"
      >
        <div className="relative z-40 -mx-4 mb-4 flex flex-wrap items-center gap-3 border-b border-zinc-800 bg-black px-4 pb-3 pt-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <Link
            href="/movies"
            className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
          >
            Back
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            {title}
          </h1>
          <DownloadEdlButton fileName={edlFilename} shots={shots} />
          <button
            type="button"
            onClick={handleMergeSelection}
            disabled={selectedShots.length < 2 || isMerging}
            className="inline-flex rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900/60 disabled:text-zinc-500"
          >
            {isMerging ? "Fusion en cours..." : "Fusionner la sélection"}
          </button>
        </div>
        <div className="mx-auto w-full max-w-xl">
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
          <div className="-mx-2 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-sm sm:mx-0">
            <table className="min-w-[1400px] table-fixed divide-y divide-zinc-800 text-xs text-zinc-200 xl:min-w-full">
              <colgroup>
                <col className="w-16" />
                <col className="w-14" />
                <col className="w-36" />
                <col className="w-28" />
                <col className="w-28" />
                <col className="w-44" />
                <col className="w-44" />
                <col className="w-[460px]" />
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
                  />
                  <th className="px-4 py-3 text-left font-medium text-zinc-300">
                    Vignette
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-300">
                    Début
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-300">
                    Fin
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-300">
                    Décor
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-300">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-300">
                    Personnages
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {shots.map((shot, index) => {
                  const startSeconds = parseStartTimeSeconds(shot.start_time);
                  const vignetteInteractive = startSeconds !== null;
                  const isSelected = selectedShots.includes(shot.id);

                  return (
                    <tr key={shot.id} className={isSelected ? "bg-zinc-900/40" : ""}>
                      <td className="px-3 py-3 align-top">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleShotSelection(shot.id)}
                          aria-label={`Sélectionner le plan ${shot.scene_number ?? index + 1}`}
                          className="mt-1 h-4 w-4 accent-zinc-300 rounded border-zinc-600 bg-zinc-950 text-zinc-100 focus:ring-zinc-400"
                        />
                      </td>
                      <td className="px-3 py-3 align-top font-medium text-zinc-100">
                        {shot.scene_number ?? "—"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div
                          className={`relative h-16 w-28 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 ${
                            vignetteInteractive
                              ? "cursor-pointer ring-offset-2 ring-offset-zinc-950 transition hover:ring-2 hover:ring-zinc-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
                              : ""
                          }`}
                          role={vignetteInteractive ? "button" : undefined}
                          tabIndex={vignetteInteractive ? 0 : undefined}
                          aria-label={
                            vignetteInteractive
                              ? `Aller à ${formatTimeValue(shot.start_time)} dans la vidéo`
                              : undefined
                          }
                          onClick={
                            vignetteInteractive
                              ? () => seekToShotStart(shot.start_time)
                              : undefined
                          }
                          onKeyDown={
                            vignetteInteractive
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
                      <td className="px-4 py-3 align-top">
                        {formatTimeValue(shot.start_time)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {formatTimeValue(shot.end_time)}
                      </td>
                      <td className="px-4 py-3 align-top text-zinc-300">
                        {shot.decor ?? "—"}
                      </td>
                      <td className="px-4 py-3 align-top text-zinc-300">
                        {shot.action_generale ?? "—"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <PersonnagesList
                          entries={normalizePersonnages(shot.personnages)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
