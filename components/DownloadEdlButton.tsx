"use client";

type DownloadEdlButtonProps = {
  filename: string;
  content: string;
};

export function DownloadEdlButton({ filename, content }: DownloadEdlButtonProps) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".edl") ? filename : `${filename}.edl`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
    >
      Download .edl
    </button>
  );
}
