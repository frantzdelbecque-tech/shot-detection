"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const BUNNY_PLAYER_ORIGINS = new Set([
  "https://iframe.mediadelivery.net",
  "https://player.mediadelivery.net",
]);
const PLAYERJS_CONTEXT = "player.js";
const PLAYERJS_VERSION = "0.0.11";

type SeekSignal = { value: number; nonce: number };

function buildPlayerJsSeekMessage(seconds: number): string {
  return JSON.stringify({
    method: "setCurrentTime",
    value: seconds,
    context: PLAYERJS_CONTEXT,
    version: PLAYERJS_VERSION,
  });
}

function buildBunnySeekMessage(seconds: number) {
  return {
    command: "seek",
    value: seconds,
  };
}

function resolveTargetOrigin(embedUrl: string): string | null {
  try {
    const { origin } = new URL(embedUrl);
    return BUNNY_PLAYER_ORIGINS.has(origin) ? origin : null;
  } catch {
    return null;
  }
}

function postSeek(win: Window, seconds: number, targetOrigin: string) {
  // Official Bunny playback API via Player.js protocol.
  win.postMessage(buildPlayerJsSeekMessage(seconds), targetOrigin);
  // Fallback kept for embeds expecting raw Bunny command payload.
  win.postMessage(buildBunnySeekMessage(seconds), targetOrigin);
}

type BunnyVideoPlayerProps = {
  /** URL d’embed Bunny Stream (`iframe.mediadelivery.net/embed/...`), déjà résolue côté serveur. */
  embedUrl: string | null;
  title?: string;
  /** Chaque clic vignette incrémente `nonce` pour rejouer le seek au même timestamp si besoin. */
  seekSignal?: SeekSignal | null;
};

export function BunnyVideoPlayer({
  embedUrl,
  title,
  seekSignal,
}: BunnyVideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    setIframeLoaded(false);
    setPlayerReady(false);
  }, [embedUrl]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!BUNNY_PLAYER_ORIGINS.has(event.origin)) return;

      let data: { context?: string; event?: string } | null = null;

      try {
        data =
          typeof event.data === "string"
            ? (JSON.parse(event.data) as typeof data)
            : (event.data as typeof data);
      } catch {
        return;
      }

      if (data?.context === PLAYERJS_CONTEXT && data?.event === "ready") {
        setPlayerReady(true);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const trySeek = useCallback((signal: SeekSignal) => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !embedUrl) return;

    const targetOrigin = resolveTargetOrigin(embedUrl);
    if (!targetOrigin) return;

    postSeek(win, signal.value, targetOrigin);
  }, [embedUrl]);

  useEffect(() => {
    if (!seekSignal || !embedUrl || !iframeLoaded || !playerReady) return;
    trySeek(seekSignal);
  }, [seekSignal, embedUrl, iframeLoaded, playerReady, trySeek]);

  if (!embedUrl) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-zinc-500">
        URL vidéo invalide ou lecture impossible (bunny_url / library)
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-lg">
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={title ?? "Lecteur vidéo"}
        className="absolute inset-0 h-full w-full"
        onLoad={() => setIframeLoaded(true)}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
      />
    </div>
  );
}
