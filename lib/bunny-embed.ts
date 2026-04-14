/**
 * Construit l’URL d’embed Bunny Stream pour l’iframe Player.js à partir d’une URL
 * de lecture CDN du type : https://<pull-zone>/<videoId>/play
 *
 * `NEXT_PUBLIC_BUNNY_LIBRARY_ID` doit être défini dans `.env.local` (dashboard Bunny Stream).
 */
export function buildBunnyEmbedUrl(bunnyUrl: string | null): string | null {
  if (!bunnyUrl?.trim()) return null;

  const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID?.trim();
  if (!libraryId) return null;

  const trimmed = bunnyUrl.trim();

  try {
    const u = new URL(trimmed);

    if (
      u.hostname === "iframe.mediadelivery.net" &&
      u.pathname.includes("/embed/")
    ) {
      return trimmed;
    }

    const segments = u.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1]?.toLowerCase();
    if (segments.length < 2 || last !== "play") {
      return null;
    }

    const videoId = segments[segments.length - 2];
    if (!videoId) return null;

    return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
  } catch {
    return null;
  }
}
