"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { useFullscreen } from "@/hooks/useFullscreen";
import { Button } from "@/components/ui/Button";

export function FullscreenToggle() {
  const { isFullscreen, isSupported, toggle } = useFullscreen();

  if (!isSupported) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label={isFullscreen ? "Keluar fullscreen" : "Mode presentasi fullscreen"}
      title={isFullscreen ? "Keluar fullscreen (Esc)" : "Mode presentasi fullscreen"}
    >
      {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
    </Button>
  );
}
