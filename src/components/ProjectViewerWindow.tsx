import React, { useMemo, useRef, useState } from "react";

/** Project type for the viewer (type-only consumer ייבא ב-import type) */
export type ViewerProject = {
  id: string;
  name: string;
  url: string;             // absolute or /public path
};

const isPdf = (src: string) => /\.pdf(\?|$)/i.test(src);
const isImage = (src: string) => /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(src);

/** Draggable, mac-style window that previews PDF or image; otherwise offers “Open in new tab”. */
export default function ProjectViewerWindow({ project, onClose }: {
  project: ViewerProject;
  onClose: () => void;
}) {
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [pos, setPos] = useState({ x: 160, y: 100 });
  const [size, setSize] = useState({ w: 860, h: 600 });
  const saved = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  // Drag
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const startDrag = (e: React.MouseEvent) => {
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
    document.body.style.userSelect = "none";
    const onMove = (ev: MouseEvent) => {
      if (!drag.current) return;
      const dx = ev.clientX - drag.current.sx;
      const dy = ev.clientY - drag.current.sy;
      setPos({ x: drag.current.ox + dx, y: drag.current.oy + dy });
    };
    const onUp = () => {
      drag.current = null;
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const toggleZoom = () => {
    if (!maximized) {
      saved.current = { ...pos, ...size };
      const mX = 36, mY = 56;
      const W = Math.min(window.innerWidth - mX * 2, 1200);
      const H = Math.min(window.innerHeight - mY * 2, 820);
      setPos({ x: mX, y: mY });
      setSize({ w: W, h: H });
      setMaximized(true);
      setMinimized(false);
    } else if (saved.current) {
      setPos({ x: saved.current.x, y: saved.current.y });
      setSize({ w: saved.current.w, h: saved.current.h });
      setMaximized(false);
      saved.current = null;
    }
  };

  const src = useMemo(() => project.url, [project.url]);

  return (
    <div
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, width: size.w, height: size.h }}
      className="fixed z-[80] rounded-xl overflow-hidden border border-white/35 bg-white/10 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,.3)]"
    >
      {/* Titlebar */}
      <div
        onMouseDown={startDrag}
        className="flex gap-2 items-center px-3 py-2 border-b cursor-move bg-white/15 border-white/25"
      >
        <div className="flex gap-2 mr-2">
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-3 h-3 rounded-full bg-[#ff5f57] border border-black/15"
            aria-label="Close"
          />
          <button
            onClick={(e) => { e.stopPropagation(); setMinimized(m => !m); }}
            className="w-3 h-3 rounded-full bg-[#febc2e] border border-black/15"
            aria-label="Minimize"
          />
          <button
            onClick={(e) => { e.stopPropagation(); toggleZoom(); }}
            className="w-3 h-3 rounded-full bg-[#28c840] border border-black/15"
            aria-label="Zoom"
          />
        </div>
        <div className="text-[13px] font-medium text-white/90 select-none">{project.name}</div>
        <div className="ml-auto pr-1 text-[12px] text-white/70 select-none">{src.split("/").pop()}</div>
      </div>

      {/* Body */}
      {minimized ? (
        <div className="grid place-items-center h-10 text-sm text-white/85">Minimized — {project.name}</div>
      ) : (
        <div className="w-full h-full bg-white">
          {isPdf(src) ? (
            <iframe title={project.name} src={src} className="w-full h-full" />
          ) : isImage(src) ? (
            <img src={src} alt={project.name} className="object-contain w-full h-full bg-white" />
          ) : (
            <div className="grid place-items-center h-full text-slate-700">
              <div className="text-center">
                <div className="mb-2 text-lg font-semibold">{project.name}</div>
                <a href={src} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                  Open in new tab
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
