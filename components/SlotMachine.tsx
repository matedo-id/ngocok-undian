"use client";

import { useState, useEffect, useRef } from "react";
import { RotateCcw, Trash2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDrawStore } from "@/store/useDrawStore";
import { useEditorStore } from "@/store/useEditorStore";
import { SlotReel } from "@/components/SlotReel";
import { Button } from "@/components/ui/Button";
import { useConfetti } from "@/hooks/useConfetti";
import { cn } from "@/lib/cn";

interface SlotMachineProps {
  large?: boolean;
}

export function SlotMachine({ large = false }: SlotMachineProps) {
  const {
    reels,
    entries,
    config,
    isSpinning,
    removedNames,
    spin,
    stopReel,
    reroll,
    getRerollPoolSize,
    resetDraw,
    commitWinnerRemoval,
  } = useDrawStore();
  const applyEntryRemoval = useEditorStore((s) => s.applyEntryRemoval);
  const { fire: fireConfetti } = useConfetti();

  const [animatingCount, setAnimatingCount] = useState(0);
  const hasSpunRef = useRef(false);
  const confettiFiredRef = useRef(false);

  const allStopped = reels.length > 0 && reels.every((r) => r.state === "stopped");
  const isAnimating = animatingCount > 0;
  const allSettled = allStopped && !isAnimating;
  const canSpin = !isSpinning && !isAnimating && entries.length >= config.winnerCount;

  function handleSpin() {
    if (!canSpin) return;
    hasSpunRef.current = true;
    confettiFiredRef.current = false;
    setAnimatingCount(reels.length);
    if (config.soundEnabled) {
      import("@/lib/sounds").then(({ sounds }) => sounds.startSpin()).catch(() => {});
    }
    spin();
  }

  function handleReelStopped(id: number) {
    stopReel(id);
    setAnimatingCount((n) => Math.max(0, n - 1));
  }

  function handleReroll(id: number) {
    const started = reroll(id);
    if (!started) return;
    confettiFiredRef.current = false;
    setAnimatingCount((n) => n + 1);
  }

  function handleReset() {
    hasSpunRef.current = false;
    confettiFiredRef.current = false;
    setAnimatingCount(0);
    resetDraw();
  }

  function handleRemoveWinners() {
    const removed = commitWinnerRemoval();
    if (removed.length > 0) applyEntryRemoval(removed);
  }

  const currentWinners = reels
    .map((r) => r.winner)
    .filter((w): w is string => w !== null);
  const winnersAlreadyRemoved =
    currentWinners.length > 0 &&
    currentWinners.every((w) => removedNames.includes(w));
  const showRemoveWinnersBtn =
    config.removeAfterDraw && allSettled && currentWinners.length > 0;

  useEffect(() => {
    if (allSettled && hasSpunRef.current && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      fireConfetti();
      if (config.soundEnabled) {
        import("@/lib/sounds")
          .then(({ sounds }) => { sounds.stopSpin(); sounds.playFanfare(); })
          .catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSettled]);

  const spinLabel = isAnimating
    ? "SEDANG BERPUTAR..."
    : allStopped
    ? "PUTAR LAGI"
    : "PUTAR!";

  return (
    <div className="flex flex-col items-center gap-8 w-full">
    <span className="slot-machine-responsive-anchor sr-only" aria-hidden="true" />

    <style jsx>{`
      .slot-machine-responsive-anchor + div > div:nth-of-type(3) {
        display: grid !important;
        grid-template-columns: repeat(1, minmax(0, max-content));
        justify-content: center;
        max-width: none !important;
        width: 100%;
      }

      @media (min-width: 640px) {
        .slot-machine-responsive-anchor + div > div:nth-of-type(3) {
      grid-template-columns: repeat(2, minmax(0, max-content));
        }
      }

      @media (min-width: 768px) {
        .slot-machine-responsive-anchor + div > div:nth-of-type(3) {
      grid-template-columns: repeat(3, minmax(0, max-content));
        }
      }

      @media (min-width: 1024px) {
        .slot-machine-responsive-anchor + div > div:nth-of-type(3) {
      grid-template-columns: repeat(4, minmax(0, max-content));
        }
      }

      @media (min-width: 1280px) {
        .slot-machine-responsive-anchor + div > div:nth-of-type(3) {
      grid-template-columns: repeat(5, minmax(0, max-content));
        }
      }
    `}</style>

      {/* ── Machine cabinet ── */}
      <div
        className={cn(
          "relative rounded-3xl border border-slate-700/50 overflow-hidden",
          "bg-gradient-to-b from-slate-900 to-slate-950",
          "shadow-2xl shadow-black/50",
          large ? "p-10" : "p-6"
        )}
      >
        {/* Top accent stripe */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600" />

        {/* Inner glow when spinning */}
        <div
          className={cn(
            "absolute inset-0 rounded-3xl transition-opacity duration-700 pointer-events-none",
            isSpinning || isAnimating ? "opacity-100" : "opacity-0"
          )}
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(147,51,234,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Reels */}
        <div
          className={cn(
            "relative z-10 flex items-start justify-center",
            large ? "gap-6" : "gap-3",
            reels.length > 4 && "flex-wrap max-w-4xl"
          )}
        >
          {reels.map((reel) => {
            const canReroll = allSettled && getRerollPoolSize(reel.id) > 0;
            return (
              <SlotReel
                key={reel.id}
                entries={entries}
                winner={reel.winner}
                state={reel.state}
                index={reel.id}
                onStopped={() => handleReelStopped(reel.id)}
                onReroll={() => handleReroll(reel.id)}
                allSettled={allSettled}
                canReroll={canReroll}
                soundEnabled={config.soundEnabled}
                large={large}
              />
            );
          })}
        </div>

        {/* Bottom accent stripe */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-col items-center gap-4">
        {/* SPIN button */}
        <motion.button
          onClick={handleSpin}
          disabled={!canSpin}
          aria-label="Putar undian"
          animate={canSpin ? { scale: [1, 1.02, 1] } : { scale: 1 }}
          transition={
            canSpin
              ? { repeat: Infinity, duration: 2.5, ease: "easeInOut" }
              : {}
          }
          whileTap={canSpin ? { scale: 0.95 } : {}}
          className={cn(
            "relative font-black tracking-[0.2em] uppercase select-none rounded-2xl",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500",
            "focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900",
            large ? "px-24 py-7 text-3xl" : "px-20 py-5 text-xl",
            canSpin
              ? [
                  "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
                  "shadow-[0_0_50px_rgba(147,51,234,0.6),0_4px_24px_rgba(0,0,0,0.4)]",
                ]
              : isAnimating
              ? "bg-gradient-to-r from-purple-800 to-pink-800 text-purple-300 cursor-not-allowed"
              : "bg-slate-800 text-slate-600 cursor-not-allowed"
          )}
        >
          {spinLabel}
        </motion.button>

        {/* Post-spin actions: remove winners (if configured) + reset */}
        <AnimatePresence>
          {allSettled && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center gap-2"
            >
              {showRemoveWinnersBtn && (
                <button
                  type="button"
                  onClick={handleRemoveWinners}
                  disabled={winnersAlreadyRemoved}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                    winnersAlreadyRemoved
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default"
                      : "bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 hover:text-rose-200"
                  )}
                  aria-label={
                    winnersAlreadyRemoved
                      ? "Pemenang sudah dihapus dari daftar"
                      : "Hapus pemenang dari daftar"
                  }
                >
                  {winnersAlreadyRemoved ? (
                    <>
                      <CheckCircle2 size={14} />
                      Pemenang dihapus dari daftar
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      Hapus Pemenang dari Daftar
                    </>
                  )}
                </button>
              )}

              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw size={13} />
                Reset undian
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {entries.length < config.winnerCount && (
          <p className="text-xs text-amber-400/80 text-center">
            Peserta tidak cukup untuk {config.winnerCount} pemenang
          </p>
        )}
      </div>
    </div>
  );
}
