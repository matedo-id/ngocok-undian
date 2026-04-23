# Ngocok.id — Undian Nama Slot Machine

Aplikasi undian nama interaktif berbasis **animasi slot machine**. Cocok untuk event perusahaan, kelas, atau acara apapun yang membutuhkan pengundian yang adil, transparan, dan dramatis.

## Fitur

- **Slot machine animasi** — setiap pemenang diungkap satu per satu dengan efek deceleration dramatis
- **Multi-pemenang** — pilih 1 hingga N pemenang sekaligus dalam satu undian
- **Reroll per-slot** — spin ulang satu slot tanpa mengubah slot lainnya
- **Mode no-duplicate** — pemenang yang sudah keluar tidak bisa terpilih lagi di undian berikutnya
- **Share via URL** — encode daftar nama ke URL terkompresi, bisa dibagikan langsung
- **Simpan & muat list** — daftar nama tersimpan di localStorage, bisa diakses lagi kapanpun
- **Import CSV/Excel** — paste langsung dari spreadsheet atau upload file CSV
- **Mode fullscreen presentasi** — tampilan bersih untuk ditampilkan di proyektor/layar besar
- **Efek konfeti** — rayakan pemenang dengan confetti burst otomatis
- **Efek suara** — ding per reel, fanfare saat semua pemenang terungkap (lihat seksi audio di bawah)
- **Randomness kriptografis** — menggunakan `crypto.getRandomValues()`, bukan `Math.random()`

---

## Cara Menjalankan

### Prasyarat
- Node.js 18+
- npm / yarn / pnpm

### Instalasi

```bash
# Clone repository
git clone <url-repo>
cd ngocok-id

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Build production

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

---

## Menambahkan Audio

Aplikasi sudah mendukung efek suara, tapi file audio tidak disertakan di repository.
Tambahkan file berikut di folder `/public/sounds/`:

| File | Fungsi | Spesifikasi |
|------|--------|-------------|
| `ding.mp3` | Berbunyi setiap kali satu reel berhenti | Pendek, ~0.5–1 detik |
| `spin.mp3` | Diputar secara loop selama reel berputar | Loopable tanpa jeda, ~2–3 detik |
| `fanfare.mp3` | Diputar setelah semua reel berhenti | ~3–5 detik, celebratory |

### Sumber audio gratis

Berikut beberapa sumber suara bebas lisensi yang bisa digunakan:

- **Freesound.org** — cari `slot machine`, `coin ding`, `fanfare`
- **Pixabay.com/music** — kategori Sound Effects
- **Mixkit.co** — Sound Effects > Casino

### Langkah instalasi audio

```bash
# Buat folder jika belum ada
mkdir -p public/sounds

# Salin file audio
cp ~/Downloads/ding.mp3 public/sounds/
cp ~/Downloads/spin.mp3 public/sounds/
cp ~/Downloads/fanfare.mp3 public/sounds/
```

Aktifkan suara di halaman editor dengan toggle **"Aktifkan suara"** sebelum mulai undian.

> Jika file tidak ditemukan, aplikasi tetap berjalan normal — suara di-skip secara diam-diam.

---

## Deploy ke Vercel

### Cara 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy ke production
vercel --prod
```

### Cara 2: GitHub Integration

1. Push repository ke GitHub
2. Buka [vercel.com/new](https://vercel.com/new)
3. Import repository dari GitHub
4. Klik **Deploy** — Vercel akan otomatis mendeteksi Next.js

Tidak perlu konfigurasi tambahan. Semua state di sisi client (localStorage + URL), tidak ada server-side yang perlu dikonfigurasi.

> Jika ingin mengikutsertakan file audio, pastikan ukuran `/public/sounds/` tidak melebihi batas free tier Vercel (100MB per deployment).

---

## Struktur Proyek

```
/app
  /page.tsx          Editor — input nama, konfigurasi, simpan/bagikan
  /draw/page.tsx     Slot machine — animasi undian
  /layout.tsx
  /globals.css

/components
  /ui/               Button, Input, Switch, Dialog (custom, tanpa shadcn)
  /NameEditor.tsx    Textarea input nama + import CSV
  /SavedListsPanel.tsx  Daftar list tersimpan
  /SlotMachine.tsx   Container multi-reel + tombol SPIN
  /SlotReel.tsx      Single reel dengan animasi Framer Motion
  /ShareDialog.tsx   Modal untuk share URL
  /FullscreenToggle.tsx  Tombol masuk/keluar fullscreen

/lib
  /shuffle.ts        Fisher-Yates dengan crypto.getRandomValues()
  /urlCodec.ts       Encode/decode share URL (lz-string)
  /storage.ts        localStorage wrapper dengan prefix "ngocok:"
  /sounds.ts         Howler audio instances
  /cn.ts             clsx + tailwind-merge helper

/store
  /useEditorStore.ts Zustand: nama, konfigurasi, list tersimpan
  /useDrawStore.ts   Zustand: state undian, reels, winners

/hooks
  /useFullscreen.ts  Fullscreen API hook
  /useConfetti.ts    canvas-confetti hook

/types
  /index.ts          SavedList, DrawConfig, SharePayload

/public/sounds/      (letakkan file audio di sini)
```

---

## Tech Stack

| Library | Versi | Fungsi |
|---------|-------|--------|
| Next.js | 16.x | App Router, React Server Components |
| React | 19.x | UI framework |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling (config via `@theme` di globals.css) |
| Framer Motion | latest | Animasi slot reel |
| Zustand | latest | State management |
| lz-string | latest | Kompresi URL untuk share |
| canvas-confetti | latest | Efek konfeti |
| Howler.js | latest | Audio playback |
| nanoid | latest | Generate unique ID untuk saved lists |
| lucide-react | latest | Icon set |

---

## Catatan Teknis

- **Semua state client-side** — tidak ada API routes, tidak ada database
- **localStorage prefix** `ngocok:` — untuk semua data yang disimpan
- **Fullscreen API** — dipanggil dari user gesture (onClick), tidak otomatis
- **iOS Safari** — Fullscreen API tidak didukung; tombol fullscreen otomatis tersembunyi
- **URL limit** — jika URL > 2000 karakter (nama sangat banyak), muncul warning di share dialog
- **Audio context** — browser modern memblokir autoplay; suara hanya aktif setelah user pertama kali klik di halaman
