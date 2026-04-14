/** Table Supabase (schéma public). */
export const SD_MOVIE_TABLE = "sd_movie";

/** Plans associés à un film (FK → `sd_movie.id`). */
export const SD_SHOTS_TABLE = "sd_shots";

/** Nom de la colonne FK sur `sd_shots` (adapter si le schéma utilise p.ex. `sd_movie_id`). */
export const SD_SHOT_MOVIE_FK = "movie_id";

/**
 * Compare au statut « done » de façon tolérante (casse, espaces).
 * Utile si la colonne est un texte ou un libellé d’enum avec une casse différente.
 */
export function isDoneStatus(status: unknown): boolean {
  return String(status ?? "").trim().toLowerCase() === "done";
}
