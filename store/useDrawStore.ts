"use client";

import { create } from "zustand";
import type { DrawConfig } from "@/types";
import { cryptoPickN, cryptoPickOne } from "@/lib/shuffle";

export type ReelState = "idle" | "spinning" | "stopped";

export type Reel = {
  id: number;
  winner: string | null;
  state: ReelState;
};

type DrawState = {
  entries: string[];
  remainingEntries: string[];
  config: DrawConfig;
  reels: Reel[];
  isSpinning: boolean;

  initialize: (entries: string[], config: DrawConfig) => void;
  spin: () => void;
  stopReel: (id: number) => void;
  reroll: (id: number) => boolean; // returns false if pool is empty
  getRerollPoolSize: (id: number) => number;
  resetDraw: () => void;
};

export const useDrawStore = create<DrawState>((set, get) => ({
  entries: [],
  remainingEntries: [],
  config: { winnerCount: 1, removeAfterDraw: false, soundEnabled: true },
  reels: [],
  isSpinning: false,

  initialize(entries, config) {
    const reels: Reel[] = Array.from({ length: config.winnerCount }, (_, i) => ({
      id: i,
      winner: null,
      state: "idle",
    }));
    set({ entries, remainingEntries: [...entries], config, reels, isSpinning: false });
  },

  spin() {
    const { reels, config, entries, remainingEntries } = get();
    if (get().isSpinning) return;

    const pool = config.removeAfterDraw
      ? remainingEntries.filter((e) => !reels.some((r) => r.winner === e))
      : entries;

    if (pool.length < config.winnerCount) return;

    const winners = cryptoPickN(pool, config.winnerCount);

    const spinning: Reel[] = reels.map((r, i) => ({
      ...r,
      state: "spinning" as ReelState,
      winner: winners[i],
    }));

    let remaining = remainingEntries;
    if (config.removeAfterDraw) {
      remaining = remaining.filter((e) => !winners.includes(e));
    }

    set({ reels: spinning, isSpinning: true, remainingEntries: remaining });
  },

  stopReel(id) {
    set((state) => {
      const updated = state.reels.map((r) =>
        r.id === id ? { ...r, state: "stopped" as ReelState } : r
      );
      const allDone = updated.every((r) => r.state === "stopped");
      return { reels: updated, isSpinning: !allDone };
    });
  },

  reroll(id) {
    const { entries, reels, config, remainingEntries } = get();
    const otherWinners = reels
      .filter((r) => r.id !== id && r.winner !== null)
      .map((r) => r.winner as string);

    const pool = config.removeAfterDraw
      ? remainingEntries.filter((e) => !otherWinners.includes(e))
      : entries.filter((e) => !otherWinners.includes(e));

    if (pool.length === 0) return false;

    const newWinner = cryptoPickOne(pool);

    set((state) => {
      const prevWinner = state.reels.find((r) => r.id === id)?.winner;
      let remaining = state.remainingEntries;

      if (config.removeAfterDraw) {
        // Return the previous winner to the pool before consuming the new one
        if (prevWinner) remaining = [...remaining, prevWinner];
        remaining = remaining.filter((e) => e !== newWinner);
      }

      const updatedReels = state.reels.map((r) =>
        r.id === id
          ? { ...r, state: "spinning" as ReelState, winner: newWinner }
          : r
      );

      return { reels: updatedReels, remainingEntries: remaining, isSpinning: true };
    });

    return true;
  },

  getRerollPoolSize(id) {
    const { entries, reels, config, remainingEntries } = get();
    const otherWinners = reels
      .filter((r) => r.id !== id && r.winner !== null)
      .map((r) => r.winner as string);

    const pool = config.removeAfterDraw
      ? remainingEntries.filter((e) => !otherWinners.includes(e))
      : entries.filter((e) => !otherWinners.includes(e));

    return pool.length;
  },

  resetDraw() {
    const { entries, config } = get();
    const reels: Reel[] = Array.from({ length: config.winnerCount }, (_, i) => ({
      id: i,
      winner: null,
      state: "idle",
    }));
    set({ reels, isSpinning: false, remainingEntries: [...entries] });
  },
}));
