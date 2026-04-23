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

  setRawText: (text: string) => void;
  setConfig: (config: Partial<DrawConfig>) => void;
  saveList: (name: string) => void;
  loadList: (id: string) => void;
  deleteList: (id: string) => void;
  loadFromStorage: () => void;
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

  setRawText(text) {
    const { entries, duplicates } = parseEntries(text);
    set({ rawText: text, entries, duplicates });
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
    if (existing) {
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
      updated = [newList, ...savedLists];
    }

    set({ savedLists: updated });
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

    set({ rawText, entries, duplicates, savedLists: updated });
  },

  deleteList(id) {
    const { savedLists } = get();
    const updated = savedLists.filter((l) => l.id !== id);
    set({ savedLists: updated });
    storage.set(LISTS_KEY, updated);
  },

  loadFromStorage() {
    const savedLists = storage.get<SavedList[]>(LISTS_KEY) ?? [];
    const config = storage.get<DrawConfig>(CONFIG_KEY) ?? defaultConfig;
    set({ savedLists, config });
  },
}));
