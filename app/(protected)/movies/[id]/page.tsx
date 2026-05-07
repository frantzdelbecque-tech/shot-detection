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

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role;
  const isAdmin =
    role === "admin" ||
    user?.user_metadata?.is_admin === true ||
    user?.user_metadata?.isAdmin === true;

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
    .select("*")
    .eq(SD_SHOT_MOVIE_FK, id)
    .order("start_time", { ascending: true, nullsFirst: false });

  const shots = (shotsError ? [] : (shotsRaw ?? [])) as SdShotRow[];
  const edlFilename = row.file_name.replace(/\.[^/.]+$/, "") + ".edl";
  const shotVignetteCacheBuster = id;

  return (
    <div className="mx-auto w-[90%] max-w-none px-4 py-3 sm:px-6 lg:px-8">
      {shotsError && (
        <p className="mb-6 rounded-xl border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
          Impossible de charger les plans : {shotsError.message}
        </p>
      )}

      <MovieVideoSection
        movieId={id}
        embedUrl={buildBunnyEmbedUrl(row.bunny_url)}
        title={row.file_name}
        shots={shots}
        isAdmin={isAdmin}
        cacheBuster={shotVignetteCacheBuster}
        edlFilename={edlFilename}
      />
    </div>
  );
}
