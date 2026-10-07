import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./controls";

const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2;

// A folha tem sempre a largura da página impressa; na tela o usuário só aproxima, afasta e rola.
export function usePreviewZoom() {
  const frame = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const fit = useCallback(() => {
    const available = (frame.current?.clientWidth ?? 0) - 24;
    const width = sheet.current?.offsetWidth ?? 0;
    if (available > 0 && width > 0) setZoom(Math.min(1, Math.max(ZOOM_MIN, available / width)));
  }, []);
  useEffect(() => {
    fit();
  }, [fit]);
  const step = (factor: number) => setZoom((value) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value * factor)));
  return { frame, sheet, zoom, fit, zoomIn: () => step(1.25), zoomOut: () => step(0.8) };
}

export function ZoomControls({ preview }: { preview: ReturnType<typeof usePreviewZoom> }) {
  return (
    <>
      <Button tone="ghost" aria-label="Afastar" onClick={preview.zoomOut}>
        −
      </Button>
      <span className="w-12 text-center text-sm tabular-nums text-muted">{Math.round(preview.zoom * 100)}%</span>
      <Button tone="ghost" aria-label="Aproximar" onClick={preview.zoomIn}>
        +
      </Button>
      <Button tone="ghost" onClick={preview.fit}>
        Ajustar
      </Button>
    </>
  );
}
