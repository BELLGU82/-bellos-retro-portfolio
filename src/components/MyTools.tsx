import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ================= Icons (typed) ================= */
const IcSearch = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m16.5 16.5 4 4" />
  </svg>
);
const IcMore = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" {...p}>
    <circle cx="6" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="18" cy="12" r="1.6" />
  </svg>
);
const IcShare = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
    <path d="M12 16v-9m0 0 4 4m-4-4-4 4" />
    <rect x="5" y="16" width="14" height="5" rx="2" />
  </svg>
);
const IcGrid = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
    <rect x="4" y="4" width="6" height="6" rx="1" />
    <rect x="14" y="4" width="6" height="6" rx="1" />
    <rect x="4" y="14" width="6" height="6" rx="1" />
    <rect x="14" y="14" width="6" height="6" rx="1" />
  </svg>
);
const IcList = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1.5" />
    <circle cx="4.5" cy="12" r="1.5" />
    <circle cx="4.5" cy="18" r="1.5" />
  </svg>
);
const IcAlign = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
    <path d="M4 7h16M4 12h12M4 17h16" />
  </svg>
);
const IcEdit = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
    <path d="M4 20h5l10-10a2.8 2.8 0 1 0-4-4L5 16l-1 4z" />
  </svg>
);
const IcAdd = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/* ================= Types & data ================= */
type Tool = { id: string; name: string; note: string; link: string };

const DEFAULT_TOOLS: Tool[] = [
  { id: "1",  name: "Lovable",            note: "Rapid app builder",         link: "https://lovable.dev" },
  { id: "2",  name: "CodePen",            note: "UI, inspiration",           link: "https://codepen.io" },
  { id: "3",  name: "n8n",                note: "Automations",               link: "https://n8n.io" },
  { id: "4",  name: "Notion",             note: "Workspace",                 link: "https://www.notion.so" },
  { id: "5",  name: "Google Labs",        note: "AI experiments",            link: "https://labs.google" },
  { id: "6",  name: "NotebookLM",         note: "AI research notes",         link: "https://notebooklm.google.com" },
  { id: "7",  name: "GPT",                note: "ChatGPT",                   link: "https://chatgpt.com" },
  { id: "8",  name: "Claude",             note: "Anthropic",                 link: "https://claude.ai" },
  { id: "9",  name: "Cursor",             note: "AI IDE",                    link: "https://cursor.sh" },
  { id: "10", name: "Comet",              note: "Browser",                   link: "https://www.perplexity.ai/comet" }, 
  { id: "11", name: "Arc",                note: "Browser",                   link: "https://arc.net" },
  { id: "12", name: "GitHub",             note: "Code & Issues",             link: "https://github.com/BELLGU82" },
  { id: "13", name: "Supabase",           note: "DB & Auth",                 link: "https://supabase.com" },
  { id: "14", name: "Behance",            note: "Inspiration",               link: "https://www.behance.net" },
  { id: "15", name: "rube",               note: "MCP tool",                  link: "https://rube.app" }, 
  { id: "16", name: "mem0.ai",            note: "AI agents memory",          link: "https://mem0.ai" }
];

/* ================= Tiny UI atoms ================= */
function BtnRound({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 grid place-items-center rounded-full bg-white/80 border border-black/10 shadow-sm hover:bg-white active:scale-[.98] transition text-slate-500"
    >
      {children}
    </button>
  );
}
function BtnCapsule({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`h-8 px-3 grid place-items-center rounded-full border shadow-sm active:scale-[.98] transition text-slate-500 ${
        active ? "bg-white border-black/20" : "bg-white/80 border-black/10 hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}

/* ================= Sortable item ================= */
function SortableItem({
  tool,
  edit,
  updateTool,
  removeTool,
  align,
}: {
  tool: Tool;
  edit: boolean;
  updateTool: (id: string, patch: Partial<Tool>) => void;
  removeTool: (id: string) => void;
  align: "left" | "center" | "right";
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: tool.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center py-3 cursor-grab active:cursor-grabbing"
    >
      <div
        className={`flex-1 ${
          align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"
        }`}
      >
        {edit ? (
          <div className="grid gap-1 sm:grid-cols-[1fr_1fr]">
            <input
              className="px-2 h-8 text-black rounded border border-black/10 bg-white/80"
              value={tool.name}
              onChange={(e) => updateTool(tool.id, { name: e.target.value })}
            />
            <input
              className="px-2 h-8 text-black rounded border border-black/10 bg-white/80"
              value={tool.note}
              onChange={(e) => updateTool(tool.id, { note: e.target.value })}
            />
            <input
              className="px-2 h-8 text-black rounded border border-black/10 bg-white/80 sm:col-span-2"
              value={tool.link}
              onChange={(e) => updateTool(tool.id, { link: e.target.value })}
            />
            <div className="sm:col-span-2">
              <button
                onClick={() => removeTool(tool.id)}
                className="text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-[15px] text-black font-medium">{tool.name}</div>
            <div className="text-[12px] text-green-600">{tool.note}</div>
          </>
        )}
      </div>
      {!edit && (
        <a
          href={tool.link}
          target="_blank"
          rel="noreferrer"
          className="text-[14px] text-slate-600 hover:text-slate-900 underline"
        >
          Open
        </a>
      )}
    </li>
  );
}

/* ================= Main component ================= */
export default function MyTools() {
  const [tools, setTools] = useState<Tool[]>(() => {
    const stored = localStorage.getItem("my-tools");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // אם יש פחות כלים מאשר ב-DEFAULT_TOOLS, עדכן
        if (parsed.length < DEFAULT_TOOLS.length) {
          return DEFAULT_TOOLS;
        }
        return parsed;
      } catch {
        return DEFAULT_TOOLS;
      }
    }
    return DEFAULT_TOOLS;
  });
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [view, setView] = useState<"list" | "grid">("grid");
  const [align, setAlign] = useState<"left" | "center" | "right">("left");
  const [edit, setEdit] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  /* persist */
  useEffect(() => {
    localStorage.setItem("my-tools", JSON.stringify(tools));
  }, [tools]);

  /* search filter */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter((t) =>
      (t.name + " " + t.note + " " + t.link).toLowerCase().includes(q)
    );
  }, [query, tools]);

  /* dnd config */
  const sensors = useSensors(useSensor(PointerSensor));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = tools.findIndex((t) => t.id === active.id);
    const newIndex = tools.findIndex((t) => t.id === over.id);
    setTools((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  /* more menu outside click */
  useEffect(() => {
    const handler = (ev: MouseEvent) => {
      if (!moreRef.current) return;
      if (!moreRef.current.contains(ev.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* actions */
  const addTool = () => {
    const id = Math.random().toString(36).slice(2);
    setTools((prev) => [...prev, { id, name: "New Tool", note: "Note", link: "" }]);
  };
  const updateTool = (id: string, patch: Partial<Tool>) =>
    setTools((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const removeTool = (id: string) => setTools((prev) => prev.filter((t) => t.id !== id));

  const handleShare = async () => {
    const text = tools.map((t) => `• ${t.name} — ${t.note} (${t.link})`).join("\n");
    const data: ShareData = { title: "My Tools", text, url: window.location.href };
    try {
      if (navigator.canShare?.(data) || navigator.share) {
        await navigator.share(data);
        return;
      }
    } catch {
      /* ignore */
    }
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied tools list to clipboard ✅");
    } catch {
      window.prompt("Copy tools list:", text);
    }
  };

  const openAll = () => filtered.forEach((t) => window.open(t.link, "_blank"));
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(tools, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "my-tools.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const resetList = () => setTools(DEFAULT_TOOLS);

  /* Mac window controls */
  const handleClose = () => {
    // Close the MyTools application by hiding the entire component
    const myToolsContainer = document.querySelector('[data-mytools-container]') as HTMLElement;
    if (myToolsContainer) {
      myToolsContainer.style.display = 'none';
    }
  };
  
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    // Reset position when maximizing
    if (!isMaximized) {
      setPosition({ x: 0, y: 0 });
    }
  };

  /* Drag functionality */
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, handleMouseMove]);

  return (
    <div 
      data-mytools-container
      className={`mx-auto bg-white/70 backdrop-blur-xl border border-black/10 rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,.18)] ${
        isMaximized ? 'w-[95vw] h-[90vh]' : 'w-[760px]'
      }`}
      style={{ 
        transform: isMaximized ? 'none' : `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isMaximized ? 'all 0.3s ease' : 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Toolbar */}
      <div className="relative px-4 pt-3 pb-2 sm:px-6 drag-handle">
        <div className="flex gap-2 items-center">
          <div className="flex gap-2 mr-2">
            <button 
              onClick={handleClose}
              className="w-3.5 h-3.5 rounded-full bg-[#ff5f57] border border-black/10 hover:bg-[#ff3b30] transition-colors cursor-pointer"
              title="Close"
            />
            <button 
              onClick={handleMinimize}
              className="w-3.5 h-3.5 rounded-full bg-[#febc2e] border border-black/10 hover:bg-[#ff9500] transition-colors cursor-pointer"
              title="Minimize"
            />
            <button 
              onClick={handleMaximize}
              className="w-3.5 h-3.5 rounded-full bg-[#28c840] border border-black/10 hover:bg-[#30d158] transition-colors cursor-pointer"
              title="Maximize"
            />
          </div>

          <BtnRound title="Search" onClick={() => setShowSearch((v) => !v)}>
            <IcSearch />
          </BtnRound>

          <div className="relative" ref={moreRef}>
            <BtnRound title="More" onClick={() => setMoreOpen((v) => !v)}>
              <IcMore />
            </BtnRound>
            {moreOpen && (
              <div className="overflow-hidden absolute left-0 z-10 mt-2 w-44 text-sm bg-white rounded-xl border shadow-lg border-black/10">
                <button className="px-3 py-2 w-full text-left text-black hover:bg-black/5" onClick={openAll}>
                  Open all (filtered)
                </button>
                <button className="px-3 py-2 w-full text-left text-black hover:bg-black/5" onClick={exportJSON}>
                  Export JSON
                </button>
                <button className="px-3 py-2 w-full text-left text-black hover:bg-black/5" onClick={resetList}>
                  Reset list
                </button>
              </div>
            )}
          </div>

          <BtnRound title="Share" onClick={handleShare}>
            <IcShare />
          </BtnRound>

          <div className="flex gap-2 ml-2">
            <BtnCapsule title="Grid view" active={view === "grid"} onClick={() => setView("grid")}>
              <IcGrid />
            </BtnCapsule>
            <BtnCapsule title="List view" active={view === "list"} onClick={() => setView("list")}>
              <IcList />
            </BtnCapsule>
            <BtnCapsule
              title="Toggle align"
              onClick={() =>
                setAlign((a) => (a === "left" ? "center" : a === "center" ? "right" : "left"))
              }
            >
              <IcAlign />
            </BtnCapsule>
            <BtnRound title={edit ? "Done editing" : "Edit"} onClick={() => setEdit((e) => !e)}>
              <IcEdit />
            </BtnRound>
            <BtnRound title="Add tool" onClick={addTool}>
              <IcAdd />
            </BtnRound>
          </div>

          <div className="ml-auto text-sm select-none text-slate-500">My Tools</div>
        </div>

        {showSearch && (
          <div className="mt-3">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools…"
              className="px-3 w-full h-9 text-black rounded-lg border outline-none border-black/10 bg-white/80 focus:ring-2 focus:ring-black/10 placeholder-slate-500"
            />
          </div>
        )}
      </div>

      {/* Body */}
      {!isMinimized && (
        <div className="px-6 pt-2 pb-6">
          <div className={`rounded-[20px] bg-[#f7f7f8] border border-[#e6e6e6] shadow-[inset_0_1px_0_rgba(255,255,255,.8)] p-5 transition-all duration-300 ${
            isMaximized ? 'max-h-[80vh] overflow-y-auto' : ''
          }`}>
          {view === "list" ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={tools.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <ul className="divide-y divide-black/5">
                  {filtered.map((tool) => (
                    <SortableItem
                      key={tool.id}
                      tool={tool}
                      edit={edit}
                      updateTool={updateTool}
                      removeTool={removeTool}
                      align={align}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtered.map((t) => (
                <div key={t.id} className="p-3 rounded-xl border border-black/10 bg-white/70">
                  {edit ? (
                    <div className="space-y-2">
                      <input
                        className="px-2 w-full h-8 text-black rounded border border-black/10 bg-white/90"
                        value={t.name}
                        onChange={(e) => updateTool(t.id, { name: e.target.value })}
                      />
                      <input
                        className="px-2 w-full h-8 text-black rounded border border-black/10 bg-white/90"
                        value={t.note}
                        onChange={(e) => updateTool(t.id, { note: e.target.value })}
                      />
                      <input
                        className="px-2 w-full h-8 text-black rounded border border-black/10 bg-white/90"
                        value={t.link}
                        onChange={(e) => updateTool(t.id, { link: e.target.value })}
                      />
                      <button
                        onClick={() => removeTool(t.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`text-[15px] font-medium text-black ${
                          align === "center"
                            ? "text-center"
                            : align === "right"
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {t.name}
                      </div>
                      <div
                        className={`text-[12px] text-green-600 ${
                          align === "center"
                            ? "text-center"
                            : align === "right"
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {t.note}
                      </div>
                      {!edit && (
                        <div className="flex justify-end mt-2">
                          <a
                            href={t.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[13px] underline text-slate-600 hover:text-slate-900"
                          >
                            Open
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

          <div className="text-center text-[12px] text-slate-400 mt-3 select-none">
            {filtered.length} tools · {edit ? "Edit mode" : "Updated automatically"}
          </div>
        </div>
      )}
    </div>
  );
}