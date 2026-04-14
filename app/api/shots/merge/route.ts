import { NextResponse } from "next/server";
import { SD_SHOTS_TABLE } from "@/lib/sd-movie";
import { createAdminClient } from "@/lib/supabase/admin";

type ShotPayload = {
  id: string;
  scene_number: number;
  start_time: unknown;
  end_time: unknown;
};

function isValidShotPayload(value: unknown): value is ShotPayload {
  if (!value || typeof value !== "object") return false;

  const shot = value as Record<string, unknown>;
  return (
    typeof shot.id === "string" &&
    shot.id.length > 0 &&
    typeof shot.scene_number === "number" &&
    Number.isFinite(shot.scene_number) &&
    "start_time" in shot &&
    "end_time" in shot
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { shots?: unknown };
    const rawShots = body?.shots;

    if (!Array.isArray(rawShots) || rawShots.length < 2) {
      return NextResponse.json(
        { error: "Le champ shots doit contenir au moins 2 plans." },
        { status: 400 },
      );
    }

    if (!rawShots.every(isValidShotPayload)) {
      return NextResponse.json(
        {
          error:
            "Chaque plan doit contenir id, scene_number, start_time et end_time.",
        },
        { status: 400 },
      );
    }

    const sortedShots = [...rawShots].sort(
      (a, b) => a.scene_number - b.scene_number,
    );
    const survivor = sortedShots[0];
    const lastShot = sortedShots[sortedShots.length - 1];
    const idsToDelete = sortedShots.slice(1).map((shot) => shot.id);

    const supabase = createAdminClient();

    const { data: updatedRows, error: updateError } = await supabase
      .from(SD_SHOTS_TABLE)
      .update({ end_time: lastShot.end_time })
      .eq("id", survivor.id)
      .select("id");

    if (updateError) {
      return NextResponse.json(
        { error: `Erreur lors de la mise à jour du plan: ${updateError.message}` },
        { status: 500 },
      );
    }
    if (!updatedRows || updatedRows.length !== 1) {
      return NextResponse.json(
        { error: "Aucun plan survivant mis à jour. Vérifie les IDs envoyés." },
        { status: 404 },
      );
    }

    const { data: deletedRows, error: deleteError } = await supabase
      .from(SD_SHOTS_TABLE)
      .delete()
      .in("id", idsToDelete)
      .select("id");

    if (deleteError) {
      return NextResponse.json(
        { error: `Erreur lors de la suppression des plans: ${deleteError.message}` },
        { status: 500 },
      );
    }
    if (!deletedRows || deletedRows.length !== idsToDelete.length) {
      return NextResponse.json(
        {
          error:
            "Suppression incomplète des plans sélectionnés. Vérifie les permissions RLS et les IDs.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      survivorId: survivor.id,
      deletedCount: deletedRows.length,
      mergedFromScene: survivor.scene_number,
      mergedToScene: lastShot.scene_number,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue lors de la fusion.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
