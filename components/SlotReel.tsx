"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cryptoShuffle } from "@/lib/shuffle";
import type { ReelState } from "@/store/useDrawStore";
import { cn } from "@/lib/cn";

const ITEM_H = 80;
const VISIBLE = 5;
const CENTER = Math.floor(VISIBLE / 2); // = 2
const BEFORE_COUNT = 80;

type TapeItem = { name: string; isWinner: boolean };

type AnimState = {
  tape: TapeItem[];
  finalY: number;
  duration: number;
  /**
   * Increments on every new spin so the motion.div gets a new `key`,
   * forcing it to remount and restart from y=0. This is what guarantees
   * the animation always plays from the top.
   */
  nonce: number;
};

interface SlotReelProps {
  entries: string[];
  winner: string | null;
  state: ReelState;
  index: number;
  onStopped: () => void;
  onReroll: () => void;
  allSettled: boolean;
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
  const [animState, setAnimState] = useState<AnimState | null>(null);
  // True once onAnimationComplete has fired for the current spin
  const [revealed, setRevealed] = useState(false);
  const mountedRef = useRef(true);
  // Prevents onAnimationComplete from firing more than once per spin
  const animCompleteRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemH = large ? 100 : ITEM_H;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, []);

  // Build a new tape + schedule animation whenever the reel should spin
  useEffect(() => {
    if (state === "spinning" && winner !== null) {
      const pool = entries.length > 0 ? entries : ["–"];

      const before: string[] = [];
      while (before.length < BEFORE_COUNT) before.push(...cryptoShuffle(pool));
      before.length = BEFORE_COUNT;

      const topPad = Array.from({ length: CENTER }, (_, i) => pool[i % pool.length]);
      const botPad = Array.from({ length: CENTER }, (_, i) => pool[(i + 2) % pool.length]);

      const tape: TapeItem[] = [
        ...topPad.map((name) => ({ name, isWinner: false })),
        ...before.map((name) => ({ name, isWinner: false })),
        { name: winner, isWinner: true },
        ...botPad.map((name) => ({ name, isWinner: false })),
      ];

      const duration = 2.2 + index * 0.7;
      animCompleteRef.current = false;

      // Safety fallback: if onAnimationComplete never fires, complete manually
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = setTimeout(() => {
        if (!animCompleteRef.current && mountedRef.current) {
          animCompleteRef.current = true;
          setRevealed(true);
          onStopped();
        }
      }, (duration + 0.8) * 1000);

      setRevealed(false);
      setAnimState((prev) => ({
        tape,
        // Winner lands at center: scroll up exactly BEFORE_COUNT items
        finalY: -BEFORE_COUNT * itemH,
        duration,
        nonce: (prev?.nonce ?? 0) + 1,
      }));
    }

    if (state === "idle") {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      setAnimState(null);
      setRevealed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, winner]);

  // Called by Framer Motion when the spin animation fully completes
  function handleAnimationComplete() {
    if (!mountedRef.current || animCompleteRef.current) return;
    animCompleteRef.current = true;
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    setRevealed(true);
    if (soundEnabled) {
      import("@/lib/sounds")
        .then(({ sounds }) => sounds.playDing())
        .catch(() => {});
    }
    onStopped();
  }

  const isStopped = state === "stopped";
  const isSpinning = state === "spinning";
  const reelW = large ? 220 : 180;

  return (
    <div className="flex flex-col items-center gap-0">
      {/* ── Reel window ── */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 bg-slate-950 transition-all duration-500",
          isStopped && revealed
            ? "border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.6)]"
            : isSpinning
            ? "border-slate-600"
            : "border-slate-800"
        )}
        style={{ width: reelW, height: VISIBLE * itemH }}
        aria-label={isStopped && winner ? `Pemenang: ${winner}` : "Slot"}
        aria-live="polite"
      >
        {/* Top gradient mask */}
        <div
          className="absolute inset-x-0 top-0 z-10 pointer-events-none bg-gradient-to-b from-slate-950 to-transparent"
          style={{ height: itemH * 1.8 }}
        />
        {/* Bottom gradient mask */}
        <div
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none bg-gradient-to-t from-slate-950 to-transparent"
          style={{ height: itemH * 1.8 }}
        />

        {/* Center selection window */}
        <div
          className={cn(
            "absolute inset-x-3 z-10 pointer-events-none rounded-lg transition-all duration-500",
            isStopped && revealed
              ? "bg-purple-500/15 border border-purple-500/60 shadow-[inset_0_0_20px_rgba(168,85,247,0.2)]"
              : "border border-slate-700/40"
          )}
          style={{ top: CENTER * itemH + 4, height: itemH - 8 }}
        />

        {/* ── Animated tape ──
            Key changes every spin, so Framer Motion mounts fresh from y=0.
            onAnimationComplete is the reliable signal that the spin is done. */}
        {animState ? (
          <motion.div
            key={animState.nonce}
            initial={{ y: 0 }}
            animate={{ y: animState.finalY }}
            transition={{
              duration: animState.duration,
              // easeOutExpo: fast burst → dramatic crawl to a stop
              ease: [0.19, 1, 0.22, 1],
            }}
            onAnimationComplete={handleAnimationComplete}
            className="absolute inset-x-0 top-0 will-change-transform"
          >
            {animState.tape.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-center px-4 select-none"
                style={{ height: itemH }}
              >
                <span
                  className={cn(
                    "truncate text-center font-bold leading-tight max-w-full transition-all duration-300",
                    // All items look uniform during spin; winner only pops on reveal
                    item.isWinner && revealed ? "text-white" : "text-slate-500"
                  )}
                  style={{
                    fontSize:
                      item.isWinner && revealed
                        ? large ? 20 : 17
                        : large ? 13 : 12,
                  }}
                >
                  {item.name}
                </span>
              </div>
            ))}
          </motion.div>
        ) : (
          /* ── Idle preview ── */
          <div className="absolute inset-0 flex flex-col">
            {Array.from({ length: VISIBLE }, (_, i) => (
              <div
                key={i}
                className="flex items-center justify-center px-4 select-none"
                style={{ height: itemH }}
              >
                <span
                  className={cn(
                    "truncate text-center font-semibold leading-tight",
                    i === CENTER ? "text-slate-500" : "text-slate-800"
                  )}
                  style={{ fontSize: i === CENTER ? (large ? 14 : 12) : (large ? 12 : 11) }}
                >
                  {entries[i % Math.max(1, entries.length)] ?? "–"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Subtle pulse overlay while spinning */}
        {isSpinning && (
          <div className="absolute inset-0 z-20 pointer-events-none animate-pulse bg-gradient-to-b from-purple-900/5 via-transparent to-purple-900/5" />
        )}
      </div>

      {/* ── Fixed-height area below reel (prevents layout shift) ── */}
      <div className="flex flex-col items-center gap-2 mt-3" style={{ minHeight: 72 }}>
        {isStopped && winner && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-center"
            style={{ maxWidth: reelW }}
          >
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-0.5">
              Terpilih #{index + 1}
            </p>
            <p
              className="font-bold text-white leading-tight truncate"
              style={{ fontSize: large ? 16 : 14 }}
            >
              {winner}
            </p>
          </motion.div>
        )}

        {isStopped && allSettled && canReroll && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            onClick={onReroll}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-all px-3 py-1.5 rounded-lg border",
              "text-slate-500 hover:text-white hover:bg-slate-800 border-slate-700/40 hover:border-slate-600",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            )}
            aria-label={`Spin ulang slot #${index + 1}`}
          >
            <RefreshCw size={11} />
            Reroll
          </motion.button>
        )}

        {isStopped && allSettled && !canReroll && (
          <span className="text-xs text-slate-700 italic">peserta habis</span>
        )}
      </div>
    </div>
  );
}
