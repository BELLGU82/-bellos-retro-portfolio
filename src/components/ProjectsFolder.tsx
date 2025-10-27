import React, { useEffect, useMemo, useRef, useState } from "react";
import ProjectViewerWindow from "./ProjectViewerWindow";
import type { ViewerProject } from "./ProjectViewerWindow"; // ← type-only import fixes verbatimModuleSyntax

/** ---------------- File System Model (in-memory) ---------------- */
type FsBase = { id: string; name: string; icon?: string };
type FsFolder = FsBase & { kind: "folder"; children: FsNode[] };
type FsFile   = FsBase & { kind: "file"; url: string };     // pdf / image / other file in /public
type FsLink   = FsBase & { kind: "link"; url: string };     // external/internal link
type FsNode   = FsFolder | FsFile | FsLink;

// Root
const FS_ROOT: FsFolder = {
  id: "root",
  name: "Root",
  kind: "folder",
  children: [
    { id: "resume",  name: "Resume",  kind: "file",  icon: "/icons/folder-resume.png",  url: "/resume/CV-2025.pdf" },
    { id: "tools",   name: "Tools",   kind: "link",  icon: "/icons/folder-tools.png",   url: "#open-tools" },
    {
      id: "projects",
      name: "Projects",
      kind: "folder",
      icon: "/icons/folder-projects.png",
      children: [
        {
          id: "crcl",
          name: "crcl",
          kind: "folder",
          icon: "/icons/folder-crcl.png",
          children: [
            { id: "crcl-deck", name: "Investor Deck.pdf", kind: "file", url: "/project/crcl/crcl.pdf" },
            // אפשר להוסיף כאן עוד קבצים:
            // { id: "cover", name: "cover.png", kind: "file", url: "/project/crcl/cover.png" },
            // { id: "site", name: "Live site", kind: "link", url: "https://example.com" },
          ],
        },
      ],
    },
  ],
};

/** ---------------- Small UI icons ---------------- */
const IcGrid = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const IcList = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
    <path d="M9 6h12M9 12h12M9 18h12" />
    <circle cx="5" cy="6" r="1.5" />
    <circle cx="5" cy="12" r="1.5" />
    <circle cx="5" cy="18" r="1.5" />
  </svg>
);
const IcBack = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
    <path d="M15 6 9 12l6 6" />
  </svg>
);
const IcFwd = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
const IcUp = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
    <path d="M6 14 12 8l6 6" />
  </svg>
);
const IcSearch = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m16.5 16.5 4 4" />
  </svg>
);

/** Fallback icon when image is missing */
const FolderFallback = () => (
  <svg viewBox="0 0 48 48" className="w-14 h-14 text-slate-500">
    <path fill="currentColor" d="M6 12a4 4 0 0 1 4-4h9l4 4h15a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V12z" opacity=".25" />
    <path fill="currentColor" d="M6 16h36v18a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V16z" />
  </svg>
);

/** ---------------- Finder-like Window ---------------- */
export default function ProjectsFolder({ onRequestClose }: { onRequestClose?: () => void }) {
  const [visible, setVisible] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");

  // geometry + drag
  const [pos, setPos] = useState({ x: 120, y: 120 });
  const [size, setSize] = useState({ w: 780, h: 540 });
  const [maximized, setMaximized] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const saved = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const beginDrag = (e: React.MouseEvent) => {
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
    document.body.style.userSelect = "none";
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.sx;
      const dy = ev.clientY - dragRef.current.sy;
      setPos({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy });
    };
    const onUp = () => {
      dragRef.current = null;
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const zoom = () => {
    if (!maximized) {
      saved.current = { ...pos, ...size };
      const mX = 36, mY = 56;
      const W = Math.min(window.innerWidth - mX * 2, 1100);
      const H = Math.min(window.innerHeight - mY * 2, 720);
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

  // history + path (breadcrumbs)
  const [history, setHistory] = useState<string[][]>([[FS_ROOT.id]]);
  const [hi, setHi] = useState(0);
  const path = history[hi];

  // traverse FS by path
  const getNodeByPath = (p: string[]): FsFolder => {
    let node: FsFolder = FS_ROOT;
    for (let i = 1; i < p.length; i++) {
      const seg = p[i];
      const next = node.children.find((c) => c.kind === "folder" && c.id === seg) as FsFolder | undefined;
      if (!next) break;
      node = next;
    }
    return node;
  };
  const currentFolder = getNodeByPath(path);

  // open helpers
  const go = (nextPath: string[]) => {
    const newHist = history.slice(0, hi + 1).concat([nextPath]);
    setHistory(newHist);
    setHi(newHist.length - 1);
  };
  const openNode = (n: FsNode) => {
    if (n.kind === "folder") {
      go([...path, n.id]);
      return;
    }
    if (n.kind === "file") {
      setPreview({ id: n.id, name: n.name, url: n.url });
      return;
    }
    if (n.kind === "link") {
      if (n.url.startsWith("#")) return; // internal hook
      window.open(n.url, "_blank", "noopener,noreferrer");
    }
  };
  const back = () => { if (hi > 0) setHi(hi - 1); };
  const forward = () => { if (hi < history.length - 1) setHi(hi + 1); };
  const up = () => { if (path.length > 1) go(path.slice(0, -1)); };

  // search in current folder
  const visibleItems = useMemo(() => {
    const items = currentFolder.children;
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((n) => n.name.toLowerCase().includes(q));
  }, [currentFolder, search]);

  // viewer
  const [preview, setPreview] = useState<ViewerProject | null>(null);

  // shortcuts
  const searchRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.metaKey) return;
      if (e.key === "1") setView("grid");
      if (e.key === "2") setView("list");
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!visible) return null;

  return (
    <>
      <div
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, width: size.w, height: size.h }}
        className="fixed z-[70] rounded-xl overflow-hidden border border-white/30 bg-white/10 backdrop-blur-xl shadow-[0_16px_50px_rgba(0,0,0,.28)]"
      >
        {/* Titlebar (glass) */}
        <div
          onMouseDown={beginDrag}
          className="flex gap-2 items-center px-3 py-2 border-b cursor-move bg-white/15 border-white/25"
        >
          {/* Mac controls */}
          <div className="flex gap-2 mr-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onRequestClose) { onRequestClose(); } else { setVisible(false); } // ← no-unused-expressions fix
              }}
              className="w-3 h-3 rounded-full bg-[#ff5f57] border border-black/15"
              aria-label="Close"
            />
            <button
              onClick={(e) => { e.stopPropagation(); setMinimized(m => !m); }}
              className="w-3 h-3 rounded-full bg-[#febc2e] border border-black/15"
              aria-label="Minimize"
            />
            <button
              onClick={(e) => { e.stopPropagation(); zoom(); }}
              className="w-3 h-3 rounded-full bg-[#28c840] border border-black/15"
              aria-label="Zoom"
            />
          </div>

          {/* Nav */}
          <div className="flex gap-1 items-center">
            <button onClick={(e) => { e.stopPropagation(); back(); }}
              className="px-2 py-1 rounded border border-white/20 text-white/90 bg-white/10 hover:bg-white/15 disabled:opacity-40"
              disabled={hi === 0}
              title="Back"
            >
              <IcBack />
            </button>
            <button onClick={(e) => { e.stopPropagation(); forward(); }}
              className="px-2 py-1 rounded border border-white/20 text-white/90 bg-white/10 hover:bg-white/15 disabled:opacity-40"
              disabled={hi === history.length - 1}
              title="Forward"
            >
              <IcFwd />
            </button>
            <button onClick={(e) => { e.stopPropagation(); up(); }}
              className="px-2 py-1 rounded border border-white/20 text-white/90 bg-white/10 hover:bg-white/15"
              title="Up"
            >
              <IcUp />
            </button>
          </div>

          {/* Breadcrumbs */}
          <div className="ml-2 flex items-center gap-1 text-[12px]">
            {path.map((segId, idx) => {
              const isLast = idx === path.length - 1;
              const label = segId === "root" ? "Root" : getNodeByPath(path.slice(0, idx + 1)).name;
              return (
                <div key={segId} className="flex items-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); go(path.slice(0, idx + 1)); }}
                    className={`px-2 py-0.5 rounded border ${isLast ? "bg-white/60 text-slate-800 border-white/70 shadow-inner" : "bg-white/10 text-white/90 border-white/20 hover:bg-white/15"}`}
                  >
                    {label}
                  </button>
                  {!isLast && <span className="mx-1 text-white/60">›</span>}
                </div>
              );
            })}
          </div>

          {/* Search + view */}
          <div className="flex gap-2 items-center ml-auto">
            <div className="flex gap-1 items-center px-2 h-7 rounded border bg-white/85 border-white/70">
              <IcSearch className="text-slate-600" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search this folder"
                className="bg-transparent outline-none text-[12.5px] text-slate-700 placeholder:text-slate-400 w-40"
              />
            </div>
            <div className="flex">
              <button
                onClick={() => setView("grid")}
                className={`h-7 px-3 rounded-l border border-white/70 bg-white/85 hover:bg-white ${view === "grid" ? "shadow-inner" : ""}`}
                title="Icon View (⌘1)"
              >
                <IcGrid />
              </button>
              <button
                onClick={() => setView("list")}
                className={`h-7 px-3 -ml-px rounded-r border border-white/70 bg-white/85 hover:bg-white ${view === "list" ? "shadow-inner" : ""}`}
                title="List View (⌘2)"
              >
                <IcList />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        {minimized ? (
          <div className="grid place-items-center h-10 text-sm text-white/85">Finder · minimized</div>
        ) : (
          <div className="bg-white" style={{ height: size.h - 76 }}>
            {view === "grid" ? (
              <div className="grid grid-cols-4 gap-y-7 gap-x-10 p-8">
                {visibleItems.map((n) => (
                  <button
                    key={n.id}
                    onDoubleClick={() => openNode(n)}
                    className="flex flex-col items-center group focus:outline-none"
                    title={n.name}
                  >
                    {n.icon ? (
                      <img src={n.icon} alt="" className="w-14 h-14 object-contain drop-shadow-sm group-hover:scale-[1.05] transition" />
                    ) : (
                      <FolderFallback />
                    )}
                    {/* label — black like desktop */}
                    <span className="mt-1 text-[12px] text-slate-800 text-center leading-tight">{n.name}</span>
                  </button>
                ))}
                {visibleItems.length === 0 && (
                  <div className="col-span-4 text-slate-600">No results in this folder.</div>
                )}
              </div>
            ) : (
              <div className="p-4">
                <div className="rounded-lg border border-[#e1e1e1] overflow-hidden bg-white">
                  <div className="grid grid-cols-[1fr_140px_100px] px-3 py-2 text-[12px] font-medium text-slate-600 bg-[#f6f6f6] border-b border-[#eaeaea]">
                    <div>Name</div>
                    <div>Kind</div>
                    <div className="pr-2 text-right">Open</div>
                  </div>
                  {visibleItems.map((n, i) => (
                    <div key={n.id} className={`grid grid-cols-[1fr_140px_100px] items-center px-3 py-2 text-[14px] ${i % 2 ? "bg-[#fafafa]" : "bg-white"}`}>
                      <div className="truncate text-slate-800">{n.name}</div>
                      <div className="text-slate-500">{n.kind}</div>
                      <div className="text-right">
                        <button
                          className="text-[13px] underline text-slate-700 hover:text-slate-900"
                          onClick={() => openNode(n)}
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ))}
                  {visibleItems.length === 0 && <div className="px-3 py-4 text-slate-600">No results.</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-1.5 text-[12px] text-slate-600 bg-gradient-to-t from-[#e9e9e9] to-[#fafafa] border-t border-[#d9d9d9] flex justify-between">
          <span>{visibleItems.length} items</span>
          <span>icon: ⌘1 · list: ⌘2 · search: ⌘F</span>
        </div>
      </div>

      {/* Viewer window */}
      {preview && (
        <ProjectViewerWindow
          project={preview}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}
