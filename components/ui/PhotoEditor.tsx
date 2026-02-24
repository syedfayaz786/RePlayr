"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Move, Crop } from "lucide-react";

interface PhotoEditorProps {
  src: string;           // original data URI or URL
  onSave: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export function PhotoEditor({ src, onSave, onCancel }: PhotoEditorProps) {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const previewRef     = useRef<HTMLCanvasElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);

  const [zoom, setZoom]         = useState(1);
  const [offset, setOffset]     = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize]   = useState({ w: 0, h: 0 });
  const [aspectRatio, setAspectRatio] = useState<"3/4" | "4/3" | "1/1" | "16/9">("3/4");
  const imgRef = useRef<HTMLImageElement | null>(null);

  const ASPECT_RATIOS = {
    "3/4":  { w: 3, h: 4,  label: "3:4 Portrait"  },
    "4/3":  { w: 4, h: 3,  label: "4:3 Landscape" },
    "1/1":  { w: 1, h: 1,  label: "1:1 Square"    },
    "16/9": { w: 16, h: 9, label: "16:9 Wide"     },
  };

  const CANVAS_W = 360;
  const ar = ASPECT_RATIOS[aspectRatio];
  const CANVAS_H = Math.round(CANVAS_W * ar.h / ar.w);

  // Load image
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      // Auto-fit: scale to fill the canvas
      const scaleW = CANVAS_W / img.naturalWidth;
      const scaleH = CANVAS_H / img.naturalHeight;
      setZoom(Math.max(scaleW, scaleH));
      setOffset({ x: 0, y: 0 });
    };
    img.src = src;
  }, [src, aspectRatio]);

  // Draw to canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    canvas.width  = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0b0d1f";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const dw = img.naturalWidth  * zoom;
    const dh = img.naturalHeight * zoom;
    const dx = (CANVAS_W - dw) / 2 + offset.x;
    const dy = (CANVAS_H - dh) / 2 + offset.y;
    ctx.drawImage(img, dx, dy, dw, dh);
  }, [zoom, offset, CANVAS_W, CANVAS_H]);

  useEffect(() => { draw(); }, [draw]);

  // Update preview canvas
  useEffect(() => {
    const src  = canvasRef.current;
    const dest = previewRef.current;
    if (!src || !dest) return;
    const ctx = dest.getContext("2d")!;
    dest.width  = 180;
    dest.height = Math.round(180 * ar.h / ar.w);
    ctx.drawImage(src, 0, 0, dest.width, dest.height);
  });

  // Mouse drag
  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const onMouseUp = () => setDragging(false);

  // Touch drag
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragging(true);
    setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y });
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const t = e.touches[0];
    setOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
  };

  const reset = () => {
    const img = imgRef.current;
    if (!img) return;
    const scaleW = CANVAS_W / img.naturalWidth;
    const scaleH = CANVAS_H / img.naturalHeight;
    setZoom(Math.max(scaleW, scaleH));
    setOffset({ x: 0, y: 0 });
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Export at 2× for retina quality, max 1200px wide
    const out   = document.createElement("canvas");
    const scale = Math.min(2, 1200 / CANVAS_W);
    out.width   = CANVAS_W * scale;
    out.height  = CANVAS_H * scale;
    const ctx   = out.getContext("2d")!;
    ctx.drawImage(canvas, 0, 0, out.width, out.height);
    onSave(out.toDataURL("image/jpeg", 0.88));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col gap-5 p-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
              <Crop className="w-5 h-5 text-brand-400" /> Edit Photo
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Drag to reposition · Scroll or use slider to zoom</p>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect ratio selector */}
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(ASPECT_RATIOS) as Array<keyof typeof ASPECT_RATIOS>).map((key) => (
            <button
              key={key}
              onClick={() => { setAspectRatio(key); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                aspectRatio === key
                  ? "bg-brand-500 border-brand-500 text-white"
                  : "bg-dark-700 border-dark-500 text-gray-400 hover:border-brand-500/50 hover:text-white"
              }`}
            >
              {ASPECT_RATIOS[key].label}
            </button>
          ))}
        </div>

        {/* Editor + Preview side by side */}
        <div className="flex gap-5 items-start">

          {/* Main editor canvas */}
          <div className="flex-1 flex flex-col gap-3">
            <div
              ref={containerRef}
              className="relative overflow-hidden rounded-xl border border-dark-600 bg-dark-900 cursor-move select-none"
              style={{ width: CANVAS_W, height: CANVAS_H }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onMouseUp}
              onWheel={(e) => {
                e.preventDefault();
                setZoom((z) => Math.min(5, Math.max(0.2, z - e.deltaY * 0.001)));
              }}
            >
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
              {/* Grid overlay */}
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.07) 1px,transparent 1px)",
                backgroundSize: `${CANVAS_W/3}px ${CANVAS_H/3}px`
              }} />
              {/* Move hint */}
              <div className="absolute bottom-2 right-2 bg-dark-900/70 rounded-md px-2 py-1 flex items-center gap-1 text-xs text-gray-400">
                <Move className="w-3 h-3" /> drag to move
              </div>
            </div>

            {/* Zoom slider */}
            <div className="flex items-center gap-3">
              <button onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))} className="text-gray-400 hover:text-white transition-colors">
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range" min={20} max={500} value={Math.round(zoom * 100)}
                onChange={(e) => setZoom(Number(e.target.value) / 100)}
                className="flex-1 accent-brand-500"
              />
              <button onClick={() => setZoom((z) => Math.min(5, z + 0.1))} className="text-gray-400 hover:text-white transition-colors">
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-400 w-10 text-right">{Math.round(zoom * 100)}%</span>
            </div>
          </div>

          {/* Live preview */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Preview</p>
            <div className="rounded-xl overflow-hidden border border-dark-600 bg-dark-900">
              <canvas ref={previewRef} className="block" style={{ width: 180, height: Math.round(180 * ar.h / ar.w) }} />
            </div>
            <p className="text-xs text-gray-500">As seen on listing card</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1 border-t border-dark-600">
          <button
            onClick={reset}
            className="btn-secondary flex items-center gap-2 px-4 py-2.5"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button onClick={onCancel} className="btn-secondary flex-1 py-2.5">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5"
          >
            <Check className="w-4 h-4" /> Save Photo
          </button>
        </div>
      </div>
    </div>
  );
}
