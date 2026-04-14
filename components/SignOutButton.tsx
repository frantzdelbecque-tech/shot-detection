"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      className="rounded-md border border-white/20 bg-transparent px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/10"
    >
      Déconnexion
    </button>
  );
}
