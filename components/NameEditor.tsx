"use client";

import { useRef } from "react";
import { Upload, AlertTriangle } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function NameEditor() {
  const { rawText, entries, duplicates, setRawText } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uniqueCount = new Set(entries).size;

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text
        .split(/[\n\r,;\t]+/)
        .map((l) => l.replace(/^"|"$/g, "").trim())
        .filter(Boolean);

      const appended = rawText
        ? rawText + "\n" + lines.join("\n")
        : lines.join("\n");
      setRawText(appended);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData("text");
    const isTsv = text.includes("\t");
    const isCsv = text.includes(",") && !text.includes("\n");

    if (isTsv || isCsv) {
      e.preventDefault();
      const lines = text
        .split(/[\n\r\t,]+/)
        .map((l) => l.replace(/^"|"$/g, "").trim())
        .filter(Boolean);
      const appended = rawText
        ? rawText + "\n" + lines.join("\n")
        : lines.join("\n");
      setRawText(appended);
    }
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">
            <span className="text-white font-semibold">{uniqueCount}</span> nama
            {entries.length !== uniqueCount && (
              <span className="text-slate-500"> ({entries.length} total)</span>
            )}
          </span>
          {duplicates.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
              <AlertTriangle size={12} />
              {duplicates.length} duplikat
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="Import dari file CSV/TXT"
          >
            <Upload size={14} />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>

      <textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        onPaste={handlePaste}
        placeholder={"Masukkan nama peserta (satu per baris)\n\nContoh:\nBudi Santoso\nSiti Rahayu\nAgus Priyanto"}
        aria-label="Daftar nama peserta"
        className={cn(
          "flex-1 min-h-[320px] w-full bg-slate-800/60 border border-slate-700 rounded-xl",
          "px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600",
          "focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500",
          "resize-none transition-colors font-mono leading-relaxed"
        )}
        spellCheck={false}
      />

      {duplicates.length > 0 && (
        <div className="text-xs text-amber-400/80 bg-amber-400/5 border border-amber-400/20 rounded-lg px-3 py-2">
          Nama duplikat: {duplicates.slice(0, 5).join(", ")}
          {duplicates.length > 5 && ` dan ${duplicates.length - 5} lainnya`}
        </div>
      )}
    </div>
  );
}
