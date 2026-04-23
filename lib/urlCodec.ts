import LZString from "lz-string";
import type { SharePayload } from "@/types";

const MAX_URL_LENGTH = 2000;

export function encodePayload(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  return LZString.compressToEncodedURIComponent(json);
}

export function decodePayload(encoded: string): SharePayload | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    return JSON.parse(json) as SharePayload;
  } catch {
    return null;
  }
}

export function buildShareUrl(payload: SharePayload): {
  url: string;
  tooLong: boolean;
} {
  const encoded = encodePayload(payload);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/draw?data=${encoded}`;
  return { url, tooLong: url.length > MAX_URL_LENGTH };
}
