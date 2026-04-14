import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 font-sans">
      <div className="flex w-full max-w-3xl flex-col items-center gap-10 sm:items-start">
        <Image
          className="invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
          <h1 className="max-w-md text-2xl font-semibold leading-tight tracking-tight text-zinc-50 sm:text-3xl">
            Bienvenue sur Shot Detection
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-zinc-400">
            Vous êtes connecté. Modifiez cette page pour votre flux de détection
            de plans.
          </p>
        </div>
      </div>
    </div>
  );
}
