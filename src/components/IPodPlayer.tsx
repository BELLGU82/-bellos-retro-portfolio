import { useEffect, useMemo, useRef, useState } from "react";

type Track = { title: string; file: string; dur?: number };

const RAW_TRACKS: Track[] = [
  { title: "GreentoBlue", file: "/music/GreentoBlue.mp3" },
  { title: "Idea10",      file: "/music/Idea10.mp3" },
];

export default function IPodPlayer() {
  const audio = useRef<HTMLAudioElement>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const tracks = useMemo(() => RAW_TRACKS, []);

  // טעינת רצועה
  useEffect(() => {
    if (!audio.current) return;
    audio.current.src = tracks[idx].file;
    audio.current.currentTime = 0;
    setTime(0);
    // אוטו-פליי רק אם כבר היינו ב-play
    if (playing) audio.current.play().catch((e) => console.debug("autoplay blocked", e));
  }, [idx, playing, tracks]);

  // מאזיני אירועים
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const onTime = () => setTime(el.currentTime);
    const onEnd = () => setIdx(i => (i + 1) % tracks.length);
    const onErr = () => console.warn("Audio error:", el.error);

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnd);
    el.addEventListener("error", onErr);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("error", onErr);
    };
  }, [tracks.length]);

  const toggle = async () => {
    if (!audio.current) return;
    try {
      if (playing) { audio.current.pause(); setPlaying(false); }
      else { await audio.current.play(); setPlaying(true); }
    } catch (e) { console.debug("play/pause blocked", e); }
  };
  const next = () => setIdx(i => (i + 1) % tracks.length);
  const prev = () => setIdx(i => (i - 1 + tracks.length) % tracks.length);
  const fmt = (s: number) => {
    const m = Math.floor(s / 60); const ss = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
    };

  return (
    <div className="w-[260px] h-[420px] rounded-[22px] bg-white shadow-[0_10px_30px_rgba(0,0,0,.25)] border border-neutral-300 p-3 select-none">
      <audio ref={audio} preload="auto" />
      
      {/* מסך iPod */}
      <div className="px-2 pt-1 pb-2 rounded-md border border-neutral-400 bg-neutral-200/60 text-neutral-900">
        {/* כותרת עליונה */}
        <div className="flex items-center justify-between text-[10px] tracking-wide font-medium">
          <span className="flex gap-1 items-center">
            <span className="text-[8px]"></span>
            Now Playing
          </span>
          <span className="text-[9px]">{idx + 1} of {tracks.length}</span>
        </div>
        
        {/* שם השיר */}
        <div className="mt-1 text-center font-semibold text-[12px] leading-tight line-clamp-2">
          {tracks[idx].title}
        </div>
        <div className="text-center text-[10px] opacity-70">bell</div>
        
        {/* סרגל התקדמות */}
        <div className="mt-2">
          <div 
            className="h-1.5 bg-neutral-400/60 rounded cursor-pointer" 
            onClick={(e) => {
              if (!audio.current?.duration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              const newTime = ratio * audio.current.duration;
              audio.current.currentTime = newTime;
              setTime(newTime);
            }}
          >
            <div 
              className="h-1.5 bg-neutral-900/80 rounded" 
              style={{ 
                width: audio.current && audio.current.duration
                  ? `${(time / audio.current.duration) * 100}%`
                  : "0%"
              }} 
            />
          </div>
          <div className="flex items-center justify-between text-[10px] mt-1">
            <span>{fmt(time)}</span>
            <span>-{fmt(Math.max(0, (audio.current?.duration ?? 0) - time))}</span>
          </div>
        </div>
      </div>

      {/* גלגל השליטה */}
      <div className="grid relative place-items-center mt-5">
        <div className="w-[180px] h-[180px] rounded-full bg-neutral-200 border-2 border-white shadow-inner relative">
          {/* טקסטים על הגלגל */}
          <div className="absolute top-3 left-0 right-0 text-center text-[11px] tracking-wider opacity-60">menu</div>
          <div className="absolute bottom-3 left-0 right-0 text-center text-[11px] opacity-60">▶︎▮▮</div>
          <div className="absolute left-3 top-0 bottom-0 grid place-items-center text-[11px] opacity-60">◀︎◀︎</div>
          <div className="absolute right-3 top-0 bottom-0 grid place-items-center text-[11px] opacity-60">▶︎▶︎</div>
          
          {/* כפתורים */}
          <button 
            onClick={toggle} 
            className="absolute bottom-2 inset-x-16 h-8" 
            aria-label="Play/Pause" 
          />
          <button 
            onClick={prev} 
            className="absolute left-2 inset-y-16 w-8" 
            aria-label="Previous" 
          />
          <button 
            onClick={next} 
            className="absolute right-2 inset-y-16 w-8" 
            aria-label="Next" 
          />
          <button 
            onClick={toggle} 
            aria-label="Center" 
            className="absolute top-1/2 left-1/2 w-16 h-16 bg-white rounded-full border shadow -translate-x-1/2 -translate-y-1/2 border-neutral-300"
          />
        </div>
      </div>
      
      {/* סטטוס */}
      <div className="mt-3 text-center text-[10px] text-neutral-500">
        {playing ? "Playing…" : "Paused"}
      </div>
    </div>
  );
}
