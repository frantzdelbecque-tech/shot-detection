export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-1 w-full flex-col bg-black text-white">
      {children}
    </div>
  );
}
