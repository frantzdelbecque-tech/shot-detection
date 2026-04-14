import { isDoneStatus, SD_MOVIE_TABLE } from "@/lib/sd-movie";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

type SdMovieRow = {
  id: string;
  file_name: string;
  thumbnail_url: string | null;
};

export default async function MoviesPage() {
  const supabase = await createClient();
  // Pas de .eq('status','done') côté PostgREST : la casse (enum « Done ») ou des espaces
  // peuvent exclure les lignes sans erreur. On filtre après normalisation.
  const { data: rows, error } = await supabase
    .from(SD_MOVIE_TABLE)
    .select("id, file_name, thumbnail_url, status")
    .order("file_name", { ascending: true });

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          Impossible de charger les films : {error.message}
        </p>
      </div>
    );
  }

  const list = (rows ?? [])
    .filter((r) => isDoneStatus(r.status))
    .map(({ id, file_name, thumbnail_url }) => ({
      id,
      file_name,
      thumbnail_url,
    })) as SdMovieRow[];

  if (list.length === 0) {
    return (
      <div className="mx-auto flex min-h-0 flex-1 max-w-2xl flex-col justify-center px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Films
        </h1>
        <p className="mt-3 text-zinc-400">
          Aucun film avec le statut « done » pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
          Films
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {list.length} film{list.length > 1 ? "s" : ""} prêt{list.length > 1 ? "s" : ""}
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((movie) => (
          <li key={movie.id}>
            <Link
              href={`/movies/${movie.id}`}
              className="group block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-sm ring-white/10 transition hover:border-zinc-700 hover:shadow-md"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                {movie.thumbnail_url ? (
                  <Image
                    src={movie.thumbnail_url}
                    alt=""
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-medium text-zinc-500">
                    Pas d&apos;aperçu
                  </div>
                )}
              </div>
              <div className="border-t border-zinc-800 px-3 py-3">
                <p
                  className="truncate text-sm font-medium text-zinc-100"
                  title={movie.file_name}
                >
                  {movie.file_name}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
