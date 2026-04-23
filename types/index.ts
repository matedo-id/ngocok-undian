export type SavedList = {
  id: string;
  name: string;
  entries: string[];
  createdAt: number;
  lastUsedAt: number;
};

export type DrawConfig = {
  winnerCount: number;
  removeAfterDraw: boolean;
  soundEnabled: boolean;
};

export type SharePayload = {
  entries: string[];
  config: DrawConfig;
  title?: string;
};
