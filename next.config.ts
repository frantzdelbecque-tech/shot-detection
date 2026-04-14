import type { NextConfig } from "next";

function supabaseHostname(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return undefined;
  try {
    return new URL(raw).hostname;
  } catch {
    return undefined;
  }
}

const supabaseHost = supabaseHostname();

/** Pull zones Bunny (ex. vz-xxxx.b-cdn.net) pour les miniatures. */
const bunnyCdnPatterns = [
  {
    protocol: "https" as const,
    hostname: "*.b-cdn.net",
    pathname: "/**",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/**",
            },
          ]
        : []),
      ...bunnyCdnPatterns,
    ],
  },
};

export default nextConfig;
