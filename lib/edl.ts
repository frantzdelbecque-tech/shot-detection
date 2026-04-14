import { parseStartTimeSeconds } from "@/lib/shot-time";

const EDL_FPS = 24;

export type EDLShot = {
  id: string;
  scene_number: number | null;
  start_time: unknown;
  end_time: unknown;
};

function toTimecode24fps(seconds: number): string {
  const totalFrames = Math.max(0, Math.floor(seconds * EDL_FPS));
  const hh = Math.floor(totalFrames / (3600 * EDL_FPS));
  const mm = Math.floor((totalFrames % (3600 * EDL_FPS)) / (60 * EDL_FPS));
  const ss = Math.floor((totalFrames % (60 * EDL_FPS)) / EDL_FPS);
  const ff = totalFrames % EDL_FPS;

  return [hh, mm, ss, ff].map((n) => String(n).padStart(2, "0")).join(":");
}

export function generateEDL(shots: EDLShot[], fileName: string): string {
  const normalizedTitle = fileName.replace(/\.[^/.]+$/, "") || "UNTITLED";

  const sorted = [...shots]
    .map((shot) => ({
      ...shot,
      startSeconds: parseStartTimeSeconds(shot.start_time),
      endSeconds: parseStartTimeSeconds(shot.end_time),
    }))
    .filter(
      (shot): shot is EDLShot & { startSeconds: number; endSeconds: number } =>
        shot.startSeconds !== null && shot.endSeconds !== null,
    )
    .sort((a, b) => a.startSeconds - b.startSeconds);

  const body = sorted.map((shot, index) => {
    const eventNumber = String(index + 1).padStart(3, "0");
    const tcIn = toTimecode24fps(shot.startSeconds);
    const tcOut = toTimecode24fps(shot.endSeconds);

    // CMX 3600: event reel track transition source in/out record in/out.
    return `${eventNumber} AX       V     C        ${tcIn} ${tcOut} ${tcIn} ${tcOut}`;
  });

  return [`TITLE: ${normalizedTitle}`, "FCM: NON-DROP FRAME", "", ...body, ""].join(
    "\n",
  );
}
