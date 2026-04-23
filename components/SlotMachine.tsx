"use client";

import { useState, useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { useDrawStore } from "@/store/useDrawStore";
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
    spin,
    stopReel,
    reroll,
    getRerollPoolSize,
    resetDraw,
  } = useDrawStore();
  const { fire: fireConfetti } = useConfetti();

  // Tracks how many reel animations are still running visually (not the store state).
  // We use a ref + forceUpdate pattern because refs don't trigger re-renders on their own.
  const animatingRef = useRef(0);
  const [, forceUpdate] = useState(0);
  const hasSpunRef = useRef(false);
  const confettiFiredRef = useRef(false);

  const allStopped = reels.length > 0 && reels.every((r) => r.state === "stopped");
  const isAnimating = animatingRef.current > 0;
  // allSettled: every reel is stopped AND all visual animations have completed
  const allSettled = allStopped && !isAnimating;
  const canSpin = !isSpinning && !isAnimating && entries.length >= config.winnerCount;

  function bumpAnimating(delta: number) {
    animatingRef.current = Math.max(0, animatingRef.current + delta);
    forceUpdate((n) => n + 1);
  }

  function handleSpin() {
    if (!canSpin) return;
    animatingRef.current = reels.length;
    hasSpunRef.current = true;
    confettiFiredRef.current = false;
    forceUpdate((n) => n + 1);
    if (config.soundEnabled) {
      import("@/lib/sounds").then(({ sounds }) => sounds.startSpin()).catch(() => {});
    }
    spin();
  }

  function handleReelStopped(id: number) {
    stopReel(id);
    bumpAnimating(-1);
  }

  function handleReroll(id: number) {
    // Check pool BEFORE bumping animating count — if pool is empty, reroll() returns
    // false and the animation never starts, which would leave animatingRef stuck > 0.
    const started = reroll(id);
    if (!started) return;
    confettiFiredRef.current = false;
    bumpAnimating(1);
  }

  function handleReset() {
    animatingRef.current = 0;
    hasSpunRef.current = false;
    confettiFiredRef.current = false;
    forceUpdate((n) => n + 1);
    resetDraw();
  }

  // Fire confetti + fanfare when all visual animations have completed
  useEffect(() => {
    if (allSettled && hasSpunRef.current && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      fireConfetti();
      if (config.soundEnabled) {
        import("@/lib/sounds")
          .then(({ sounds }) => {
            sounds.stopSpin();
            sounds.playFanfare();
          })
          .catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSettled]);

  const spinLabel = isAnimating ? "SPINNING..." : allStopped ? "SPIN AGAIN" : "SPIN";

  return (
    <div className="flex flex-col items-center gap-10 w-full">
      {/* Reels row — winner labels appear as each reel stops;
          reroll buttons only appear once ALL reels have settled */}
      <div
        className={cn(
          "flex items-end justify-center gap-4 flex-wrap",
          reels.length > 5 && "max-w-5xl"
        )}
      >
        {reels.map((reel) => {
          // Reroll is available only when everything has settled AND there are
          // enough entries left in the pool that aren't held by other reels.
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

      {/* Controls */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleSpin}
          disabled={!canSpin}
          aria-label="Putar undian"
          className={cn(
            "relative font-black tracking-[0.15em] uppercase transition-all duration-200 select-none",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500",
            "focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900",
            "rounded-2xl",
            large ? "px-20 py-6 text-2xl" : "px-16 py-5 text-xl",
            canSpin
              ? [
                  "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
                  "shadow-[0_0_40px_rgba(147,51,234,0.5)]",
                  "hover:scale-105 hover:shadow-[0_0_60px_rgba(147,51,234,0.7)]",
                  "active:scale-95",
                ]
              : "bg-slate-800 text-slate-600 cursor-not-allowed"
          )}
        >
          {spinLabel}
        </button>

        {allSettled && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw size={14} />
            Reset
          </Button>
        )}

        {entries.length < config.winnerCount && (
          <p className="text-xs text-amber-400/80 text-center">
            Peserta tidak cukup untuk {config.winnerCount} pemenang
          </p>
        )}
      </div>
    </div>
  );
}
