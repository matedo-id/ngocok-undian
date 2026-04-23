"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Link, Play, Dices } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { NameEditor } from "@/components/NameEditor";
import { SavedListsPanel } from "@/components/SavedListsPanel";
import { ShareDialog } from "@/components/ShareDialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Dialog } from "@/components/ui/Dialog";

export default function EditorPage() {
  const router = useRouter();
  const { entries, config, setConfig, saveList, loadFromStorage } = useEditorStore();

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const uniqueEntries = [...new Set(entries.filter(Boolean))];
  const canStart = uniqueEntries.length >= 1;
  const maxWinners = Math.max(1, uniqueEntries.length);
  const winnerCount = Math.min(config.winnerCount, maxWinners);

  function handleSave() {
    if (!saveName.trim()) {
      setSaveError("Nama list tidak boleh kosong.");
      return;
    }
    saveList(saveName.trim());
    setSaveDialogOpen(false);
    setSaveName("");
    setSaveError("");
  }

  function handleStart() {
    if (!canStart) return;
    router.push("/draw");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
              <Dices size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Ngocok.id
              </h1>
              <p className="text-xs text-slate-500">Undian Nama Slot Machine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSaveName("");
                setSaveError("");
                setSaveDialogOpen(true);
              }}
              disabled={uniqueEntries.length === 0}
            >
              <Save size={15} />
              Simpan
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShareDialogOpen(true)}
              disabled={uniqueEntries.length === 0}
            >
              <Link size={15} />
              Bagikan
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleStart}
              disabled={!canStart}
              aria-label="Mulai undian"
            >
              <Play size={15} />
              Mulai Undian
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left — Name Editor */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-200 mb-1">Daftar Peserta</h2>
            <p className="text-sm text-slate-500">
              Masukkan nama satu per baris. Bisa paste langsung dari Excel atau CSV.
            </p>
          </div>
          <div className="flex-1">
            <NameEditor />
          </div>
        </section>

        {/* Right — Config + Saved Lists */}
        <aside className="flex flex-col gap-5">
          {/* Config */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 flex flex-col gap-5">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Konfigurasi Undian
            </h2>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="winner-count" className="text-sm text-slate-300 font-medium">
                Jumlah Pemenang
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="winner-count"
                  type="range"
                  min={1}
                  max={maxWinners}
                  value={winnerCount}
                  onChange={(e) => setConfig({ winnerCount: Number(e.target.value) })}
                  className="flex-1 accent-purple-500"
                />
                <span className="text-lg font-bold text-white w-8 text-center tabular-nums">
                  {winnerCount}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                Maks. {maxWinners} pemenang dari {uniqueEntries.length} peserta
              </span>
            </div>

            <Switch
              id="remove-after-draw"
              checked={config.removeAfterDraw}
              onChange={(v) => setConfig({ removeAfterDraw: v })}
              label="Hapus nama setelah keluar"
              description="Pemenang tidak bisa dipilih dua kali"
            />

            <Switch
              id="sound-enabled"
              checked={config.soundEnabled}
              onChange={(v) => setConfig({ soundEnabled: v })}
              label="Aktifkan suara"
              description="Efek suara saat spin dan menang"
            />

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleStart}
              disabled={!canStart}
              aria-label="Mulai undian"
            >
              <Play size={16} />
              Mulai Undian
            </Button>

            {!canStart && (
              <p className="text-xs text-slate-500 text-center -mt-2">
                Tambahkan minimal 1 nama untuk memulai
              </p>
            )}
          </div>

          {/* Saved Lists */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              List Tersimpan
            </h2>
            <SavedListsPanel />
          </div>
        </aside>
      </main>

      {/* Save Dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        title="Simpan Daftar Nama"
      >
        <div className="flex flex-col gap-4">
          <Input
            id="list-name"
            label="Nama list"
            placeholder="Contoh: Peserta Rapat Q1 2026"
            value={saveName}
            onChange={(e) => {
              setSaveName(e.target.value);
              setSaveError("");
            }}
            error={saveError}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setSaveDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSave}>
              <Save size={15} />
              Simpan
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        payload={{ entries: uniqueEntries, config, title: "Ngocok.id" }}
      />
    </div>
  );
}
