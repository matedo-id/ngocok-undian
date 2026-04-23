"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { SavedList, DrawConfig } from "@/types";
import { storage } from "@/lib/storage";

const LISTS_KEY = "lists";
const CONFIG_KEY = "config";

const defaultConfig: DrawConfig = {
  winnerCount: 1,
  removeAfterDraw: false,
  soundEnabled: true,
};

type EditorState = {
  rawText: string;
  entries: string[];
  duplicates: string[];
  config: DrawConfig;
  savedLists: SavedList[];
  activeListId: string | null;

  setRawText: (text: string) => void;
  setConfig: (config: Partial<DrawConfig>) => void;
  saveList: (name: string) => void;
  loadList: (id: string) => void;
  deleteList: (id: string) => void;
  loadFromStorage: () => void;
  /** Remove given names from current entries; if a saved list is active, persist the update. */
  applyEntryRemoval: (removed: string[]) => void;
};

function parseEntries(raw: string): { entries: string[]; duplicates: string[] } {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const line of lines) {
    if (seen.has(line)) duplicates.add(line);
    else seen.add(line);
  }

  return { entries: lines, duplicates: [...duplicates] };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  rawText: "",
  entries: [],
  duplicates: [],
  config: defaultConfig,
  savedLists: [],
  activeListId: null,

  setRawText(text) {
    const { entries, duplicates } = parseEntries(text);
    // Manual edits break the link to the active saved list
    set({ rawText: text, entries, duplicates, activeListId: null });
  },

  setConfig(partial) {
    const config = { ...get().config, ...partial };
    set({ config });
    storage.set(CONFIG_KEY, config);
  },

  saveList(name) {
    const { entries, savedLists } = get();
    const now = Date.now();
    const existing = savedLists.find((l) => l.name === name);

    let updated: SavedList[];
    let activeId: string;
    if (existing) {
      activeId = existing.id;
      updated = savedLists.map((l) =>
        l.id === existing.id ? { ...l, entries, lastUsedAt: now } : l
      );
    } else {
      const newList: SavedList = {
        id: nanoid(),
        name,
        entries,
        createdAt: now,
        lastUsedAt: now,
      };
      activeId = newList.id;
      updated = [newList, ...savedLists];
    }

    set({ savedLists: updated, activeListId: activeId });
    storage.set(LISTS_KEY, updated);
  },

  loadList(id) {
    const { savedLists } = get();
    const list = savedLists.find((l) => l.id === id);
    if (!list) return;

    const rawText = list.entries.join("\n");
    const { entries, duplicates } = parseEntries(rawText);
    const now = Date.now();

    const updated = savedLists.map((l) =>
      l.id === id ? { ...l, lastUsedAt: now } : l
    );
    storage.set(LISTS_KEY, updated);

    set({ rawText, entries, duplicates, savedLists: updated, activeListId: id });
  },

  deleteList(id) {
    const { savedLists, activeListId } = get();
    const updated = savedLists.filter((l) => l.id !== id);
    set({
      savedLists: updated,
      activeListId: activeListId === id ? null : activeListId,
    });
    storage.set(LISTS_KEY, updated);
  },

  loadFromStorage() {
    const savedLists = storage.get<SavedList[]>(LISTS_KEY) ?? [];
    const config = storage.get<DrawConfig>(CONFIG_KEY) ?? defaultConfig;
    set({ savedLists, config });
  },

  applyEntryRemoval(removed) {
    if (removed.length === 0) return;
    const removedSet = new Set(removed);
    const { entries, savedLists, activeListId } = get();

    const nextEntries = entries.filter((e) => !removedSet.has(e));
    const nextRawText = nextEntries.join("\n");
    const { duplicates } = parseEntries(nextRawText);

    let nextLists = savedLists;
    if (activeListId) {
      const now = Date.now();
      nextLists = savedLists.map((l) =>
        l.id === activeListId
          ? { ...l, entries: nextEntries, lastUsedAt: now }
          : l
      );
      storage.set(LISTS_KEY, nextLists);
    }

    set({
      rawText: nextRawText,
      entries: nextEntries,
      duplicates,
      savedLists: nextLists,
    });
  },
}));
