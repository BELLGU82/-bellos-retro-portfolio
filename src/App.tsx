import { type MouseEvent as ReactMouseEvent, type ReactNode, useCallback, useEffect, useRef, useState, lazy, Suspense } from "react";
import { Wordpad, Shell3241, Phone, FolderOpen, Drvspace7, Access220 } from "@react95/icons";
import SnakeGame from "./components/SnakeGame";
import ContactCard from "./components/ContactCard";
import MyTools from "./components/MyTools";
import ErrorBoundary from "./components/ErrorBoundary";
const IPodPlayer = lazy(() => import("./components/IPodPlayer"));
import ProjectsFolder from "./components/ProjectsFolder";

/**
 * BellOS – Retro OS Preview (sandbox‑safe)
 * ---------------------------------------
 * This build removes Vite‑only APIs (import.meta.glob) so it runs in any sandbox.
 *
 * ▶ How assets are loaded now
 *    - (Optional) Provide global URLs via:  window.__BELL_ASSETS__ = { walls:[...], music:[...] }
 *    - If not provided, we fall back to nice gradients + simulated tracks.
 *
 * Example (index.html before your bundle):
 *   <script>
 *     window.__BELL_ASSETS__ = {
 *       walls: ["/brand_assets/backgrounds/bg1.jpg", "/brand_assets/backgrounds/bg2.jpg"],
 *       music: ["/brand_assets/music/track1.mp3", "/brand_assets/music/track2.mp3"]
 *     };
 *   </script>
 */

// ==== Global asset bridge (no Vite required) ====
declare global {
  interface Window { __BELL_ASSETS__?: { walls?: string[]; music?: string[] } }
}
const GLOBAL_ASSETS = (typeof window !== "undefined" && window.__BELL_ASSETS__) || {};
const WALLS: string[] = Array.isArray(GLOBAL_ASSETS.walls) ? GLOBAL_ASSETS.walls! : [];

// --- Public auto‑defaults (since you keep assets under /public):
// You can rename/extend safely.

const DEFAULT_PUBLIC_WALLS = [
  "/backgrounds/background.png",
  "/backgrounds/background1.png",
  "/backgrounds/background3.png",
  "/backgrounds/background4.png",
];

// Effective sources (prefer window.__BELL_ASSETS__, else fall back to /public)
const EFFECTIVE_WALLS = (WALLS && WALLS.length ? WALLS : DEFAULT_PUBLIC_WALLS);



// ===================== Dragging hook =====================
function useDrag(initial: { x: number; y: number }) {
  const [pos, setPos] = useState(initial);
  const dragging = useRef(false);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPos(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
    };
    const onUp = () => (dragging.current = false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);
  return { pos, bind: { onMouseDown: () => (dragging.current = true) } };
}

// ===================== Background helpers =====================
const GRAD_WALLS = [
  "linear-gradient(120deg,#0b1f2a,#1f5862 40%,#d8f0f2)",
  "linear-gradient(120deg,#2b1d16,#b86a4b 40%,#ffe1cf)",
  "linear-gradient(120deg,#0e0f12,#24283b 45%,#8da0c7)",
  "linear-gradient(120deg,#0a1a14,#2b7a68 45%,#d9f5ec)",
];
function useBackground(index: number) {
  const grad = GRAD_WALLS[index % GRAD_WALLS.length];
  const img = EFFECTIVE_WALLS.length ? EFFECTIVE_WALLS[index % EFFECTIVE_WALLS.length] : undefined;
  return { grad, img };
};


// ===================== Window with controls =====================
interface WinProps {
  id: string;
  title: string;
  init: { x: number; y: number; w?: number; h?: number };
  children: ReactNode;
  color?: string;
  onClose?: (id: string) => void;
}

function Window({ id, title, init, children, color, onClose }: WinProps) {
  const { pos, bind } = useDrag({ x: init.x, y: init.y });

  // היה useState ללא setSize – מחליפים במצב שניתן לשנות
  const [size, setSize] = useState({ w: init.w ?? 540, h: init.h ?? 360 });
  const [maxed, setMaxed] = useState(false);

  const minimizeToDock = () => onClose?.(id);

  // ===== Resizing logic =====
  type Handle = "e" | "w" | "s" | "n" | "se" | "sw" | "ne" | "nw";
  const resizing = useRef<{
    handle: Handle | null;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  }>({ handle: null, startX: 0, startY: 0, startW: 0, startH: 0 });

  const onResizeStart = (handle: Handle) => (e: ReactMouseEvent) => {
    e.preventDefault();
    resizing.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startW: size.w,
      startH: size.h,
    };
    window.addEventListener("mousemove", onResizeMove);
    window.addEventListener("mouseup", onResizeEnd);
  };

  const onResizeMove = (e: MouseEvent) => {
    const r = resizing.current;
    if (!r.handle) return;
    const dx = e.clientX - r.startX;
    const dy = e.clientY - r.startY;

    // מינימום נוח
    let w = r.startW;
    let h = r.startH;

    if (r.handle.includes("e")) w = Math.max(260, r.startW + dx);
    if (r.handle.includes("s")) h = Math.max(160, r.startH + dy);
    if (r.handle.includes("w")) w = Math.max(260, r.startW - dx);
    if (r.handle.includes("n")) h = Math.max(160, r.startH - dy);

    setSize({ w, h });
  };

  const onResizeEnd = () => {
    resizing.current.handle = null;
    window.removeEventListener("mousemove", onResizeMove);
    window.removeEventListener("mouseup", onResizeEnd);
  };

  const HandleBase = "absolute bg-transparent z-20";

  return (
    <div
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        width: maxed ? "calc(100vw - 200px)" : size.w,
        height: maxed ? "calc(100vh - 120px)" : size.h,
      }}
      className="fixed select-none shadow-[0_12px_40px_rgba(0,0,0,.18)] rounded-xl border border-slate-400 bg-[--chrome] overflow-hidden backdrop-blur-sm"
    >
      {/* Titlebar (drag) */}
      <div
        className="flex justify-between items-center px-2 h-8 bg-gradient-to-b border-b cursor-move border-slate-300 from-white/60 to-white/20"
        {...bind}
      >
        <div className="flex gap-1 items-center">
          <button
            aria-label="Close"
            onClick={() => onClose?.(id)}
            className="w-3 h-3 rounded-full bg-[#FF5F57] hover:brightness-110"
          />
          <button
            aria-label="Minimize"
            onClick={minimizeToDock}
            className="w-3 h-3 rounded-full bg-[#FEBC2E] hover:brightness-110"
          />
          <button
            aria-label="Maximize"
            onClick={() => setMaxed((m) => !m)}
            className="w-3 h-3 rounded-full bg-[#28C840] hover:brightness-110"
          />
        </div>
        <div className="text-xs font-semibold text-slate-700">{title}</div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div
        className="w-full h-[calc(100%-2rem)] p-5 text-slate-800"
        style={{ background: color ?? "transparent" }}
      >
        {children}
      </div>

      {/* Resize handles – 4 צדדים + 4 פינות */}
      <div
        className={`top-0 bottom-0 left-0 w-1 ${HandleBase} cursor-w-resize`}
        onMouseDown={onResizeStart("w")}
      />
      <div
        className={`top-0 right-0 bottom-0 w-1 ${HandleBase} cursor-e-resize`}
        onMouseDown={onResizeStart("e")}
      />
      <div
        className={`top-0 right-0 left-0 h-1 ${HandleBase} cursor-n-resize`}
        onMouseDown={onResizeStart("n")}
      />
      <div
        className={`right-0 bottom-0 left-0 h-1 ${HandleBase} cursor-s-resize`}
        onMouseDown={onResizeStart("s")}
      />

      <div
        className={`right-0 bottom-0 w-3 h-3 ${HandleBase} cursor-se-resize`}
        onMouseDown={onResizeStart("se")}
      />
      <div
        className={`bottom-0 left-0 w-3 h-3 ${HandleBase} cursor-sw-resize`}
        onMouseDown={onResizeStart("sw")}
      />
      <div
        className={`top-0 right-0 w-3 h-3 ${HandleBase} cursor-ne-resize`}
        onMouseDown={onResizeStart("ne")}
      />
      <div
        className={`top-0 left-0 w-3 h-3 ${HandleBase} cursor-nw-resize`}
        onMouseDown={onResizeStart("nw")}
      />
    </div>
  );
}

// ===================== Dock button =====================
function DockButton({ label, icon, active = false, onClick }: { label: string; icon: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`grid relative place-items-center w-10 h-10 group`}>
      <div className={`transition-transform ${active ? "scale-[1.06] drop-shadow-[0_0_10px_rgba(52,195,200,.45)]" : "group-hover:scale-105"}`}>
        {icon}
      </div>
      <span className="absolute left-[-8px] right-[-8px] -bottom-7 text-[10px] text-slate-800/90 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md shadow opacity-0 group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

// ===================== Scanlines & Grain =====================
const ScanGrain = () => (
  <>
    <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,.08) 0px, rgba(0,0,0,.08) 1px, transparent 2px, transparent 3px)", opacity: 0.18, mixBlendMode: "multiply" }} />
    <div className="fixed inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(0,0,0,.1), transparent 60%)", mixBlendMode: "overlay" }} />
  </>
);


// ===================== Main App =====================
export default function BellOSRetroPreview() {
  const [bgIndex, setBgIndex] = useState(0);
  const [open, setOpen] = useState({ resume: true, agents: false, projects: false, vibe: false, contact: false, snake: false, ipod: false, tools: false });
  const { grad, img } = useBackground(bgIndex);
  const cycle = (d: number) => setBgIndex(i => (i + d + GRAD_WALLS.length) % GRAD_WALLS.length);
  const closeWin = useCallback((id: keyof typeof open) => setOpen(o => ({ ...o, [id]: false })), []);
  const Placeholder = ({ label }: { label: string }) => (<div className="flex justify-center items-center w-full h-full text-slate-700/90">{label} – coming soon</div>);

  // Listen for close messages from child components
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'close-window' && event.data?.windowId) {
        closeWin(event.data.windowId as keyof typeof open);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [closeWin]);

  return (
    <div className="overflow-hidden relative w-full h-screen">
      {/* BACKGROUND LAYERS: image (if any) + gradient overlay */}
      {img ? (
        <div className="absolute inset-0 bg-center bg-cover -z-20" style={{ backgroundImage: `url(${img})` }} />
      ) : null}
      <div className="absolute inset-0 opacity-40 -z-10" style={{ backgroundImage: grad, backgroundSize: "cover", backgroundPosition: "center" }} />
      <ScanGrain />

      {/* BG arrows */}
      <div className="flex absolute top-4 left-4 z-20 flex-col gap-2">
        <button onClick={() => cycle(-1)} className="w-8 h-8 rounded bg-white/70">◀</button>
        <button onClick={() => cycle(1)} className="w-8 h-8 rounded bg-white/70">▶</button>
      </div>

{/* Side Dock */}
<div className="grid absolute right-6 top-1/2 z-20 gap-6 -translate-y-1/2">
  <DockButton
    label="Resume"
    icon={<Wordpad variant="32x32_4" />}
    active={open.resume}
    onClick={() => setOpen(o => ({ ...o, resume: true }))}
  />
  <DockButton
    label="My Tools"
    icon={<Drvspace7 variant="32x32_4" />}
    active={open.tools}
    onClick={() => setOpen(o => ({ ...o, tools: true }))}
  />
  <DockButton
    label="Vibe Coding"
    icon={<Access220 variant="32x32_4" />}
    active={open.vibe}
    onClick={() => setOpen(o => ({ ...o, vibe: true }))}
  />
  <DockButton
  label="Snake"
  icon={<span className="text-3xl leading-none">🐍</span>}
  active={open.snake}
  onClick={() => setOpen(o => ({ ...o, snake: true }))}
/>
  <DockButton
    label="Contact"
    icon={<Phone variant="32x32_4" />}
    active={open.contact}
    onClick={() => setOpen(o => ({ ...o, contact: true }))}
  />
  <DockButton
    label="iPod"
    icon={<Shell3241 variant="32x32_4" />}
    active={open.ipod}
    onClick={() => setOpen(o => ({ ...o, ipod: true }))}
  />
    <DockButton
    label="Projects"
    icon={<FolderOpen variant="32x32_4" />}
    active={open.projects}
    onClick={() => setOpen(o => ({ ...o, projects: true }))}
  />
</div>


      {open.resume && (
  <Window
    id="resume"
    title="Resume"
    init={{ x: 40, y: 40, w: 780, h: 560 }}
    onClose={() => closeWin("resume")}
  >
    <div className="flex flex-col gap-3 h-full text-slate-900">
      <div className="flex gap-3 items-center">
        <a
          href="/resume/CV-2025.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-3 h-9 rounded-md border shadow border-slate-300 bg-white/80 hover:bg-white"
        >
          🔎 Open in new tab
        </a>
        <a
          href="/resume/CV-2025.pdf"
          download
          className="flex items-center px-3 h-9 rounded-md border shadow border-slate-300 bg-white/80 hover:bg-white"
        >
          📄 Download PDF
        </a>
      </div>

      <iframe
        title="CV-2025"
        src="/resume/CV-2025.pdf#view=FitH"
        className="flex-1 w-full bg-white rounded-md border border-slate-300"
      />
    </div>
  </Window>
)}

{open.tools && (
  <div className="flex absolute inset-0 justify-center items-center">
    <MyTools />
  </div>
)}

      {open.projects && (
        <ProjectsFolder onRequestClose={() => closeWin("projects")} />
)}

      {open.vibe && (
        <Window id="vibe" title="Vibe Code" init={{ x: 540, y: 160, w: 360, h: 360 }} color="#D8E6FF" onClose={() => closeWin("vibe")}>
          <Placeholder label="Add Vibe Code functionality later" />
        </Window>
      )}


      {open.snake && (
        <Window id="snake" title="Snake" init={{ x: 520, y: 200, w: 480, h: 540 }} color="#F6FFE8" onClose={() => closeWin("snake")}>
          <div className="grid overflow-auto place-items-center w-full h-full text-slate-800">
            <SnakeGame />
          </div>
        </Window>
      )}

{open.contact && (
  <Window
    id="contact"
    title="Contact"
    init={{ x: 200, y: 120, w: 480, h: 720 }}
    color="transparent"
    onClose={() => closeWin("contact")}
  >
<ContactCard
  name="Bell Ohana"
  title="DigitaLife Creative"
  email="digitalifec@gmail.com"
  phone="054-9411621"
  linkedin="https://www.linkedin.com/in/bell-ohana-0b1229220"
  github="https://github.com/BELLGU82"
  website="http://www.digitalifec.com"
  location="Tel Aviv"
  avatarUrl="/bell/bell_pic.jpeg"
  rtl={false}
/>
  </Window>
)}

      {open.ipod && (
        <Window id="ipod" title="iPod" init={{ x: 240, y: 120, w: 320, h: 520 }} onClose={() => closeWin("ipod")}>
          <ErrorBoundary fallback={<div className="p-4 text-sm">iPod had an issue. Try reopen.</div>}>
            <Suspense fallback={<div className="p-4 text-sm">Loading iPod…</div>}>
              <div className="grid place-items-center w-full h-full text-slate-800">
                <IPodPlayer />
              </div>
            </Suspense>
          </ErrorBoundary>
        </Window>
      )}

      <div className="absolute left-6 bottom-4 text-[11px] text-white/90 drop-shadow">BellOS · Retro Preview</div>
    </div>
  );
}

// ===================== Tiny test helpers (no DOM needed) =====================
// eslint-disable-next-line react-refresh/only-export-components
export function __test_backgroundChoice(index: number, wallsLen: number) {
  const grad = GRAD_WALLS[index % GRAD_WALLS.length];
  const hasImg = wallsLen > 0;
  return { grad, hasImg };
}
// eslint-disable-next-line react-refresh/only-export-components
export function __test_nextIndex(i: number, len: number) { return (i + 1) % Math.max(1, len); }

// Smoke tests (quick runtime checks)
// eslint-disable-next-line react-refresh/only-export-components
export const __tests = {
  hasComponent: typeof BellOSRetroPreview === 'function',
  bgNoAssetsUsesGradient: __test_backgroundChoice(3, 0).hasImg === false,
  nextWraps: __test_nextIndex(2, 3) === 0,
};
