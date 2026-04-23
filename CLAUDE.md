# Prompt untuk Claude Code — Ngocok.id (Name Slot Drawing App)

Saya sedang membangun aplikasi web undian nama berbasis **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**. Konsepnya mirip `wheelofnames.com` tapi pakai **animasi slot machine** dan lebih advanced. Nama project: `ngocok-id`.

## 📦 Project Setup

Project sudah ter-init dengan `create-next-app` dan `package.json` berikut (jangan downgrade, gunakan versi ini apa adanya):

```json
{
  "name": "ngocok-id",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "next": "16.2.4",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.4",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

Tambahkan dependencies berikut:
- `framer-motion` — animasi slot machine
- `zustand` — state management
- `lz-string` — kompresi data untuk share URL
- `canvas-confetti` + `@types/canvas-confetti` — efek konfeti
- `howler` + `@types/howler` — audio control
- `nanoid` — generate unique ID
- `lucide-react` — icon set
- `clsx` + `tailwind-merge` — utility class merging

## 🎯 Fitur yang Harus Dibangun

### 1. Halaman Editor (`/`)
- Textarea untuk input nama (satu per baris)
- Counter jumlah nama & deteksi duplikat
- Tombol import dari paste Excel/CSV
- Input angka "Jumlah pemenang" (1 sampai N, max = jumlah nama)
- Toggle switch: **"Hapus nama setelah keluar"** (no duplicate winner)
- Toggle switch: **"Aktifkan suara"**
- Tombol aksi:
  - `💾 Simpan` → simpan ke localStorage dengan nama list
  - `🔗 Salin Link Share` → generate URL terkompresi
  - `▶ Mulai Undian` → navigate ke `/draw`
- List saved lists di sidebar/bagian bawah (bisa load ulang/hapus)

### 2. Halaman Slot Machine (`/draw`)
- Render **N kolom reel** sejajar sesuai jumlah pemenang
- Setiap reel = kolom vertikal nama-nama yang bergulung cepat (gunakan Framer Motion)
- Tombol **"SPIN"** besar di tengah bawah
- Saat spin:
  - Semua reel mulai berputar bersamaan
  - Reel berhenti **satu per satu dengan delay ~500ms** (efek dramatis)
  - Sound "ding" di tiap reel berhenti
  - Setelah reel terakhir berhenti → confetti burst 🎉
- Setiap slot hasil punya tombol kecil **🔄 Reroll** → hanya reel itu yang dispin ulang
  - Nama yang sudah ada di reel lain harus di-exclude (jika mode "no duplicate" aktif)
- Tombol **SPIN AGAIN** untuk undian ulang penuh
- Tombol kembali ke editor

### 3. Mode Fullscreen Presentasi
- Tombol `⛶` di halaman draw → trigger Fullscreen API (`document.documentElement.requestFullscreen()`)
- Di mode fullscreen: UI bersih, reel & SPIN button jauh lebih besar, background gradient menarik
- Tombol `Esc` atau klik `⛶` lagi untuk keluar

### 4. Share via URL
- Encode daftar nama + config jadi query string: `/draw?data=<lz-compressed>`
- Gunakan `lz-string` compress-to-encoded-uri-component
- Saat halaman `/draw` load dan ada `?data=`, decode lalu load ke state
- Jika data terlalu panjang (URL > 2000 char), tampilkan warning & saran export JSON

### 5. Randomness
- Gunakan `crypto.getRandomValues()` untuk fairness (bukan `Math.random`)
- Implementasi Fisher-Yates shuffle di `lib/shuffle.ts`

## 🗂️ Struktur Folder yang Diinginkan

```
/app
  /page.tsx                    → Editor
  /draw/page.tsx               → Slot machine
  /layout.tsx
  /globals.css
/components
  /ui/                         → Button, Input, Switch, Dialog (custom, no shadcn install)
  /NameEditor.tsx
  /SavedListsPanel.tsx
  /SlotMachine.tsx
  /SlotReel.tsx                → Single column reel dengan Framer Motion
  /ShareDialog.tsx
  /FullscreenToggle.tsx
/lib
  /shuffle.ts                  → Crypto-safe Fisher-Yates
  /urlCodec.ts                 → encode/decode share URL (lz-string)
  /storage.ts                  → localStorage wrapper dengan type-safety
  /sounds.ts                   → Howler instance & play helpers
  /cn.ts                       → clsx + tailwind-merge helper
/store
  /useEditorStore.ts           → Zustand: entries, config, savedLists
  /useDrawStore.ts             → Zustand: state undian (spinning, winners, etc)
/hooks
  /useFullscreen.ts
  /useConfetti.ts
/types
  /index.ts                    → SavedList, DrawConfig, dll
/public/sounds
  (placeholder — beri instruksi dimana letakkan file audio)
```

## 💾 Type Definitions (buat di `/types/index.ts`)

```typescript
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
```

## 🎨 Design Direction

- **Tema**: modern, playful tapi profesional. Cocok untuk event corporate maupun kelas.
- **Warna utama**: gradient ungu-pink untuk primary (`from-purple-600 to-pink-600`), dark mode friendly.
- **Font**: gunakan default Next.js (Geist Sans & Geist Mono).
- **Slot reel**: background gelap (slate-900), nama di tengah font tebal besar, ada efek glow saat berhenti di pemenang.
- **Responsif**: desktop first, tapi harus tetap usable di tablet & mobile landscape.
- **Accessibility**: tombol SPIN harus keyboard-accessible, ARIA labels untuk screen reader.

## ⚠️ Constraint Teknis Penting

1. **Jangan gunakan** library UI berat seperti MUI/Chakra. Custom components kecil saja pakai Tailwind.
2. **Semua state client-side** — tidak perlu API routes, tidak perlu database.
3. **Fullscreen API** harus dipanggil dari user gesture (onClick), bukan otomatis.
4. **localStorage key prefix**: gunakan `ngocok:` (contoh: `ngocok:lists`, `ngocok:config`).
5. **TypeScript strict mode** — tidak ada `any`, gunakan proper typing.
6. **Next.js App Router** — gunakan `"use client"` hanya di komponen yang butuh interactivity.
7. **Tailwind v4** — config via `@theme` di `globals.css`, bukan `tailwind.config.js`.
8. **Audio files**: Untuk sekarang, beri placeholder path di `lib/sounds.ts` dengan komentar `// TODO: tambahkan file audio di /public/sounds/`. Jangan generate/download audio. Tampilkan instruksi di README cara menambahkan file sendiri.
9. **Mobile compatibility**: Fullscreen API di iOS Safari terbatas — beri fallback graceful (hide button jika tidak didukung).

## 📝 Deliverables

Tolong kerjakan dengan urutan berikut, dan **commit tiap milestone**:

1. **Setup**: install dependencies, setup types, store, utils (shuffle, storage, urlCodec, cn)
2. **Editor page**: UI input nama, config, save/load localStorage, share link generation
3. **Slot machine**: reel component dengan Framer Motion, multi-reel container, spin logic
4. **Reroll per-slot**: implement reroll individu dengan exclusion logic
5. **Polish**: confetti, sound integration (dengan placeholder), fullscreen mode
6. **README**: cara run, cara tambah audio, cara deploy ke Vercel

## ✅ Acceptance Criteria

- [ ] `npm run dev` jalan tanpa error
- [ ] `npm run build` sukses tanpa warning TS
- [ ] `npm run lint` clean
- [ ] Bisa input 100+ nama tanpa lag
- [ ] Share URL bisa di-decode kembali dengan sempurna
- [ ] Slot reel berhenti tepat di nama yang benar (bukan animasi palsu)
- [ ] Reroll tidak memilih nama yang sudah ada di slot lain (jika mode no-duplicate aktif)
- [ ] Fullscreen mode bekerja di Chrome & Firefox desktop

---

Mulai dari milestone 1. Sebelum coding, **tampilkan ringkasan rencana** kamu (file apa saja yang akan dibuat/diubah) agar saya bisa konfirmasi dulu. Jika ada ambiguitas, tanyakan dulu sebelum asumsi.