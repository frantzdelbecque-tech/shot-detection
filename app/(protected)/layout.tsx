import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const email = user.email ?? "";

  return (
    <div className="flex min-h-dvh flex-col bg-black text-zinc-50">
      <Header email={email} />
      <main className="flex min-h-0 flex-1 flex-col bg-black">{children}</main>
    </div>
  );
}
