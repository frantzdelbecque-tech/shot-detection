import { MovieVideoSection } from "@/components/MovieVideoSection";
import { buildBunnyEmbedUrl } from "@/lib/bunny-embed";
import {
  isDoneStatus,
  SD_MOVIE_TABLE,
  SD_SHOT_MOVIE_FK,
  SD_SHOTS_TABLE,
} from "@/lib/sd-movie";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type SdMovieRow = {
  id: string;
  file_name: string;
  thumbnail_url: string | null;
  bunny_url: string | null;
  status: string;
};

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

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: movie, error: movieError } = await supabase
    .from(SD_MOVIE_TABLE)
    .select("id, file_name, thumbnail_url, status, bunny_url")
    .eq("id", id)
    .maybeSingle();

  if (movieError || !movie || !isDoneStatus(movie.status)) {
    notFound();
  }

  const row = movie as SdMovieRow;

  const { data: shotsRaw, error: shotsError } = await supabase
    .from(SD_SHOTS_TABLE)
    .select(
      "id, scene_number, vignette_url, start_time, end_time, decor, action_generale, nb_perso_total, personnages",
    )
    .eq(SD_SHOT_MOVIE_FK, id)
    .order("scene_number", { ascending: true, nullsFirst: false });

  const shots = (shotsError ? [] : (shotsRaw ?? [])) as SdShotRow[];
  const edlFilename = row.file_name.replace(/\.[^/.]+$/, "") + ".edl";
  const shotVignetteCacheBuster = Date.now().toString();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {shotsError && (
        <p className="mb-6 rounded-xl border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
          Impossible de charger les plans : {shotsError.message}
        </p>
      )}

      <MovieVideoSection
        embedUrl={buildBunnyEmbedUrl(row.bunny_url)}
        title={row.file_name}
        shots={shots}
        cacheBuster={shotVignetteCacheBuster}
        edlFilename={edlFilename}
      />
    </div>
  );
}
