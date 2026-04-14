import { SignOutButton } from "@/components/SignOutButton";

type HeaderProps = {
  email: string;
};

export function Header({ email }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-black px-4 sm:px-6">
      <span className="text-sm font-semibold tracking-tight text-white sm:text-base">
        Shot Detection
      </span>
      <div className="flex items-center gap-3 sm:gap-4">
        <span
          className="max-w-[40vw] truncate text-xs text-zinc-400 sm:max-w-none sm:text-sm"
          title={email}
        >
          {email}
        </span>
        <SignOutButton />
      </div>
    </header>
  );
}
