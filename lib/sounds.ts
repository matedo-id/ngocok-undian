import { Howl } from "howler";

// TODO: Tambahkan file audio di /public/sounds/ untuk mengaktifkan suara.
// File yang dibutuhkan:
//   ding.mp3     → suara saat tiap reel berhenti (pendek, ~0.5–1 detik)
//   spin.mp3     → suara loop saat reel berputar (loopable, ~2–3 detik)
//   fanfare.mp3  → suara kemenangan setelah semua reel berhenti (~3–5 detik)
//
// Lihat README.md bagian "Menambahkan Audio" untuk instruksi lengkap dan
// referensi sumber suara gratis yang bisa digunakan.

let dingSound: Howl | null = null;
let spinSound: Howl | null = null;
let fanfareSound: Howl | null = null;
let loaded = false;

function createHowl(src: string, loop = false): Howl {
  return new Howl({
    src: [src],
    loop,
    preload: true,
    volume: 0.7,
    // Silently ignore missing files — expected during dev without audio assets
    onloaderror: () => {},
    onplayerror: () => {},
  });
}

function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  dingSound = createHowl("/sounds/ding.mp3");
  spinSound = createHowl("/sounds/spin.mp3", true);
  fanfareSound = createHowl("/sounds/fanfare.mp3");
}

export const sounds = {
  playDing() {
    try {
      ensureLoaded();
      dingSound?.play();
    } catch {
      // ignore
    }
  },

  startSpin() {
    try {
      ensureLoaded();
      spinSound?.play();
    } catch {
      // ignore
    }
  },

  stopSpin() {
    try {
      spinSound?.stop();
    } catch {
      // ignore
    }
  },

  playFanfare() {
    try {
      ensureLoaded();
      fanfareSound?.play();
    } catch {
      // ignore
    }
  },
};
