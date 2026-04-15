"use client";

import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Tab = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupMessage, setSignupMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSignupMessage(null);
    setLoading(true);

    const supabase = createClient();

    try {
      if (tab === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message);
          return;
        }
        router.push("/movies");
        router.refresh();
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        setSignupMessage(
          "Vérifiez votre boîte mail pour confirmer votre compte si la confirmation est activée.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-black px-4 py-16 font-sans text-white">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Shot Detection
        </h1>
        <p className="mt-2 text-sm text-zinc-500 sm:text-base">
          Connexion — e-mail et mot de passe
        </p>
      </div>

      <div className="w-full max-w-md">
        <div className="mb-6 overflow-hidden rounded-lg border border-zinc-800 shadow-xl">
          <Image
            src="/shot_detection.png"
            alt="Shot Detection"
            width={1200}
            height={630}
            priority
            className="h-auto w-full"
          />
        </div>

        <div className="rounded-lg border border-zinc-800 bg-black p-6 shadow-xl sm:p-8">
          <div className="mb-8 flex rounded-md border border-zinc-800 p-0.5">
            <button
              type="button"
              onClick={() => {
                setTab("signin");
                setError(null);
                setSignupMessage(null);
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                tab === "signin"
                  ? "bg-[#222222] text-white"
                  : "bg-transparent text-zinc-500"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("signup");
                setError(null);
                setSignupMessage(null);
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                tab === "signup"
                  ? "bg-[#222222] text-white"
                  : "bg-transparent text-zinc-500"
              }`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm text-white"
              >
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-[#F0F4FF] px-3 py-2.5 text-sm text-zinc-900 outline-none ring-zinc-500 focus:ring-2"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm text-white"
              >
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  tab === "signin" ? "current-password" : "new-password"
                }
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-[#F0F4FF] px-3 py-2.5 text-sm text-zinc-900 outline-none ring-zinc-500 focus:ring-2"
              />
            </div>

            {error ? (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            ) : null}
            {signupMessage ? (
              <p className="text-sm text-zinc-400" role="status">
                {signupMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-white py-3 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading
                ? "…"
                : tab === "signin"
                  ? "Se connecter"
                  : "S'inscrire"}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
