"use client";

import { useState } from "react";
import { Trash2, FolderOpen, Clock } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { Button } from "@/components/ui/Button";
import type { SavedList } from "@/types";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}h lalu`;
  if (hours > 0) return `${hours}j lalu`;
  if (mins > 0) return `${mins}m lalu`;
  return "baru saja";
}

function ListItem({
  list,
  onLoad,
  onDelete,
}: {
  list: SavedList;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 transition-colors group">
      <button
        onClick={onLoad}
        className="flex-1 flex flex-col gap-0.5 text-left min-w-0"
        title={`Muat "${list.name}"`}
      >
        <span className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
          {list.name}
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-500">
          <Clock size={10} />
          {list.entries.length} nama · {timeAgo(list.lastUsedAt)}
        </span>
      </button>

      {confirmDelete ? (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              onDelete();
              setConfirmDelete(false);
            }}
            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-900/20 transition-colors"
          >
            Hapus
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Batal
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          aria-label={`Hapus list "${list.name}"`}
          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1 rounded-lg hover:bg-red-900/20"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

export function SavedListsPanel() {
  const { savedLists, loadList, deleteList } = useEditorStore();

  const sorted = [...savedLists].sort((a, b) => b.lastUsedAt - a.lastUsedAt);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-600">
        <FolderOpen size={32} className="opacity-40" />
        <p className="text-sm text-center">Belum ada list tersimpan.</p>
        <p className="text-xs text-center">Klik "Simpan" untuk menyimpan daftar nama.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((list) => (
        <ListItem
          key={list.id}
          list={list}
          onLoad={() => loadList(list.id)}
          onDelete={() => deleteList(list.id)}
        />
      ))}
    </div>
  );
}
