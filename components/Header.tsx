import { SignOutButton } from "@/components/SignOutButton";
import Image from "next/image";

type HeaderProps = {
  email: string;
  isAdmin: boolean;
};

export function Header({ email, isAdmin }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-black px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Image
          src="/logo-shot_detection.svg"
          alt="Logo Shot Detection"
          width={24}
          height={24}
          className="h-6 w-6"
          priority
        />
        <span className="text-sm font-semibold tracking-tight text-white sm:text-base">
          Shot Detection
        </span>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <span
          className="max-w-[40vw] truncate text-xs text-zinc-400 sm:max-w-none sm:text-sm"
          title={email}
        >
          {email}
        </span>
        {isAdmin ? (
          <span
            className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300 sm:text-xs"
            title="Utilisateur administrateur"
          >
            Admin
          </span>
        ) : null}
        <SignOutButton />
      </div>
    </header>
  );
}
