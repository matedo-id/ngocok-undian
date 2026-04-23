"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cryptoShuffle } from "@/lib/shuffle";
import type { ReelState } from "@/store/useDrawStore";
import { cn } from "@/lib/cn";

const ITEM_H = 80;
const VISIBLE = 5;
const CENTER = Math.floor(VISIBLE / 2); // index 2 = center slot
const BEFORE_COUNT = 80; // items before winner in tape (controls spin "distance")

type TapeItem = {
  name: string;
  isWinner: boolean;
};

interface SlotReelProps {
  entries: string[];
  winner: string | null;
  state: ReelState;
  index: number;
  onStopped: () => void;
  onReroll: () => void;
  /** All reels have finished animating */
  allSettled: boolean;
  /** allSettled AND there are entries left in this reel's pool */
  canReroll: boolean;
  soundEnabled: boolean;
  large?: boolean;
}

export function SlotReel({
  entries,
  winner,
  state,
  index,
  onStopped,
  onReroll,
  allSettled,
  canReroll,
  soundEnabled,
  large = false,
}: SlotReelProps) {
  const controls = useAnimation();
  const [tape, setTape] = useState<TapeItem[]>([]);
  const prevStateRef = useRef<ReelState>("idle");
  const prevWinnerRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const itemH = large ? 100 : ITEM_H;
  const reelW = large ? 220 : 176;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      controls.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const prevState = prevStateRef.current;
    const prevWinner = prevWinnerRef.current;

    prevStateRef.current = state;
    prevWinnerRef.current = winner;

    const shouldAnimate =
      state === "spinning" &&
      winner !== null &&
      (prevState !== "spinning" || winner !== prevWinner);

    if (shouldAnimate) {
      // Build tape: top padding + BEFORE_COUNT random items + winner + bottom padding
      const shufflePool = entries.length > 0 ? entries : ["?"];
      const before: string[] = [];
      while (before.length < BEFORE_COUNT) {
        before.push(...cryptoShuffle(shufflePool));
      }
      before.length = BEFORE_COUNT;

      const topPad = Array.from({ length: CENTER }, (_, i) => shufflePool[i % shufflePool.length]);
      const botPad = Array.from({ length: CENTER }, (_, i) => shufflePool[(i + 1) % shufflePool.length]);

      const newTape: TapeItem[] = [
        ...topPad.map((name) => ({ name, isWinner: false })),
        ...before.map((name) => ({ name, isWinner: false })),
        { name: winner, isWinner: true },
        ...botPad.map((name) => ({ name, isWinner: false })),
      ];

      setTape(newTape);

      // winnerIdx in tape = CENTER (topPad) + BEFORE_COUNT
      const winnerIdx = CENTER + BEFORE_COUNT;
      // Translate so winner sits exactly at center slot
      const finalY = -(winnerIdx - CENTER) * itemH;

      // Reset to top, then run full spin animation
      controls.set({ y: 0 });

      // Stagger: each subsequent reel stops 0.7s later — creates the dramatic cascade effect
      const duration = 2.0 + index * 0.7;

      controls
        .start({
          y: finalY,
          transition: {
            duration,
            ease: [0.04, 0.35, 0.5, 1.0], // fast start, slow deceleration
          },
        })
        .then(() => {
          if (!mountedRef.current) return;
          if (soundEnabled) {
            import("@/lib/sounds")
              .then(({ sounds }) => sounds.playDing())
              .catch(() => {});
          }
          onStopped();
        });
    }

    if (state === "idle" && prevState !== "idle") {
      controls.stop();
      controls.set({ y: 0 });
      setTape([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, winner]);

  const isStopped = state === "stopped";
  const isSpinning = state === "spinning";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Reel window */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 transition-all duration-500 bg-slate-900",
          isStopped
            ? "border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.55)]"
            : isSpinning
            ? "border-slate-600"
            : "border-slate-700/60"
        )}
        style={{ width: reelW, height: VISIBLE * itemH }}
        aria-label={
          isStopped && winner ? `Pemenang: ${winner}` : "Slot sedang berputar"
        }
        aria-live="polite"
      >
        {/* Top fade */}
        <div className="absolute inset-x-0 top-0 z-10 pointer-events-none bg-gradient-to-b from-slate-900 via-slate-900/70 to-transparent" style={{ height: itemH * 1.5 }} />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent" style={{ height: itemH * 1.5 }} />

        {/* Center selection window */}
        <div
          className={cn(
            "absolute inset-x-0 z-10 pointer-events-none transition-all duration-500",
            isStopped
              ? "bg-purple-500/10 border-y-2 border-purple-500/50"
              : "border-y border-slate-700/40"
          )}
          style={{ top: CENTER * itemH, height: itemH }}
        />

        {/* Animated tape */}
        {tape.length > 0 ? (
          <motion.div animate={controls} className="absolute inset-x-0 top-0 will-change-transform">
            {tape.map((item, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-center px-3 select-none font-bold",
                  item.isWinner
                    ? "text-white"
                    : "text-slate-500"
                )}
                style={{ height: itemH, fontSize: item.isWinner ? (large ? 22 : 18) : (large ? 15 : 13) }}
              >
                <span className="truncate text-center leading-tight max-w-full">
                  {item.name}
                </span>
              </div>
            ))}
          </motion.div>
        ) : (
          /* Idle preview — static name list */
          <div className="absolute inset-0 flex flex-col">
            {Array.from({ length: VISIBLE }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-center px-3 select-none font-semibold",
                  i === CENTER ? "text-slate-400" : "text-slate-700"
                )}
                style={{ height: itemH, fontSize: i === CENTER ? (large ? 16 : 14) : (large ? 13 : 11) }}
              >
                <span className="truncate text-center">
                  {entries[i % Math.max(1, entries.length)] ?? "–"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Winner label */}
      {isStopped && winner && (
        <div className="text-center" style={{ maxWidth: reelW }}>
          <p className="text-xs text-purple-400 font-semibold uppercase tracking-widest mb-0.5">
            #{index + 1}
          </p>
          <p
            className="font-bold text-white leading-tight truncate"
            style={{ fontSize: large ? 18 : 15 }}
          >
            {winner}
          </p>
        </div>
      )}

      {/* Reroll button — appears on ALL reels simultaneously once allSettled,
          preventing partial rerolls while other reels are still animating */}
      {isStopped && allSettled && canReroll && (
        <button
          onClick={onReroll}
          className={cn(
            "flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-lg border",
            "text-slate-400 hover:text-white hover:bg-slate-800 border-slate-700/50 hover:border-slate-500",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          )}
          style={{ fontSize: 12 }}
          aria-label={`Spin ulang slot pemenang #${index + 1}`}
          title="Spin ulang slot ini saja"
        >
          <RefreshCw size={11} />
          Reroll
        </button>
      )}

      {/* Pool exhausted — shown only after everything settles and no entries remain */}
      {isStopped && allSettled && !canReroll && (
        <span className="text-xs text-slate-600 italic">peserta habis</span>
      )}
    </div>
  );
}
