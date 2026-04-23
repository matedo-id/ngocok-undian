"use client";

import { useState } from "react";
import { Copy, Check, AlertTriangle } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { buildShareUrl } from "@/lib/urlCodec";
import type { SharePayload } from "@/types";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  payload: SharePayload;
}

export function ShareDialog({ open, onClose, payload }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const { url, tooLong } = buildShareUrl(payload);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API blocked — fallback
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Salin Link Share">
      <div className="flex flex-col gap-4">
        {tooLong && (
          <div className="flex items-start gap-2 text-sm text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-xl p-3">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <span>
              URL terlalu panjang ({url.length} karakter). Beberapa browser membatasi URL di 2000
              karakter. Pertimbangkan untuk mengurangi jumlah nama atau gunakan export JSON.
            </span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Share URL
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={url}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs font-mono overflow-hidden text-ellipsis focus:outline-none focus:border-purple-500"
            />
            <Button
              variant={copied ? "secondary" : "primary"}
              size="md"
              onClick={handleCopy}
              className="flex-shrink-0"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Tersalin!" : "Salin"}
            </Button>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Link ini berisi daftar nama dan konfigurasi undian. Siapa saja yang membuka link ini
          dapat langsung menggunakan undian Anda.
        </p>
      </div>
    </Dialog>
  );
}
