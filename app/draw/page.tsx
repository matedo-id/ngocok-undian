"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Dices } from "lucide-react";
import { useDrawStore } from "@/store/useDrawStore";
import { useEditorStore } from "@/store/useEditorStore";
import { SlotMachine } from "@/components/SlotMachine";
import { FullscreenToggle } from "@/components/FullscreenToggle";
import { Button } from "@/components/ui/Button";
import { decodePayload } from "@/lib/urlCodec";
import { useFullscreen } from "@/hooks/useFullscreen";
import { cn } from "@/lib/cn";

function DrawPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { initialize, entries, config } = useDrawStore();
  const [ready, setReady] = useState(false);
  const { isFullscreen } = useFullscreen();

  useEffect(() => {
    const data = searchParams.get("data");
    if (data) {
      const payload = decodePayload(data);
      if (payload && payload.entries.length > 0) {
        initialize(payload.entries, payload.config);
        setReady(true);
        return;
      }
    }

    // Fall back to editor store — load from localStorage first
    useEditorStore.getState().loadFromStorage();
    const {
      entries: editorEntries,
      config: editorConfig,
      activeListId,
    } = useEditorStore.getState();
    const uniqueEntries = [...new Set(editorEntries.filter(Boolean))];

    if (uniqueEntries.length === 0) {
      router.replace("/");
      return;
    }

    initialize(uniqueEntries, editorConfig, activeListId);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready || entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Memuat undian...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Ambient gradient — expands and intensifies in fullscreen */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 rounded-full transition-all duration-1000",
            isFullscreen
              ? "top-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-purple-900/35 blur-[180px]"
              : "top-1/4 w-[600px] h-[600px] bg-purple-900/20 blur-[120px]"
          )}
        />
        <div
          className={cn(
            "absolute rounded-full transition-all duration-1000",
            isFullscreen
              ? "bottom-0 left-1/4 w-[700px] h-[700px] bg-pink-900/25 blur-[140px]"
              : "bottom-1/4 left-1/3 w-[400px] h-[400px] bg-pink-900/15 blur-[100px]"
          )}
        />
      </div>

      {/* Header — hidden in fullscreen for clean presentation mode */}
      <header
        className={cn(
          "relative z-10 flex items-center justify-between px-6 py-4",
          "border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-sm",
          "transition-all duration-300 overflow-hidden",
          isFullscreen ? "h-0 py-0 opacity-0 pointer-events-none border-0" : "h-auto"
        )}
        aria-hidden={isFullscreen}
      >
        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
          <ArrowLeft size={15} />
          Editor
        </Button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-md shadow-purple-900/40">
            <Dices size={15} className="text-white" />
          </div>
          <span className="font-bold text-sm bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Ngocok.id
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 tabular-nums">
            {entries.length} peserta · {config.winnerCount} pemenang
          </span>
          <FullscreenToggle />
        </div>
      </header>

      {/* Fullscreen overlay — minimal controls, fades out when idle */}
      {isFullscreen && (
        <div className="fixed top-4 right-4 z-20 flex items-center gap-2 group">
          <span className="text-xs text-slate-600 group-hover:text-slate-400 transition-colors select-none">
            Tekan ESC untuk keluar
          </span>
          <div className="opacity-30 group-hover:opacity-100 transition-opacity">
            <FullscreenToggle />
          </div>
        </div>
      )}

      {/* Slot machine — centered, extra padding in fullscreen */}
      <main
        className={cn(
          "relative z-10 flex-1 flex items-center justify-center overflow-x-auto transition-all duration-300",
          isFullscreen ? "p-10" : "p-6"
        )}
      >
        <SlotMachine large={isFullscreen} />
      </main>
    </div>
  );
}

export default function DrawPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500">
            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Memuat...
          </div>
        </div>
      }
    >
      <DrawPageInner />
    </Suspense>
  );
}
