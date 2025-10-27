import { useEffect, useRef, useState, useReducer } from "react";

type Cell = { x: number; y: number };
type Dir = { x: number; y: number };

const COLS = 20, ROWS = 20;
const STEP_MS = 120; // מהירות המשחק

const UP: Dir = { x: 0, y: -1 };
const DOWN: Dir = { x: 0, y: 1 };
const LEFT: Dir = { x: -1, y: 0 };
const RIGHT: Dir = { x: 1, y: 0 };

function rndEmpty(body: Cell[]): Cell {
  while (true) {
    const a = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    if (!body.some(p => p.x === a.x && p.y === a.y)) return a;
  }
}

export default function SnakeGame() {
  // ----- state לתצוגה -----
  const [score, setScore] = useState(0);
  const [high, setHigh] = useState<number>(() => Number(localStorage.getItem("snake_high") || 0));
  // רינדור קל בלי "unused": כל קריאה ל-bump מרעננת את הקומפוננטה
  const [, bump] = useReducer((x: number) => x + 1, 0);

  // ----- refs ללוגיקה -----
  const snakeRef = useRef<Cell[]>([{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }]);
  const dirRef = useRef<Dir>(RIGHT);
  const nextDirRef = useRef<Dir>(RIGHT);
  const appleRef = useRef<Cell>({ x: 12, y: 10 });
  const runningRef = useRef(true);
  const lastTickRef = useRef<number>(performance.now());
  const accRef = useRef(0);

  // קלט מקלדת
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") { runningRef.current = !runningRef.current; return; }
      if (!runningRef.current) return;

      const cur = dirRef.current;
      if (["ArrowUp","w","W"].includes(e.key) && cur !== DOWN) nextDirRef.current = UP;
      if (["ArrowDown","s","S"].includes(e.key) && cur !== UP) nextDirRef.current = DOWN;
      if (["ArrowLeft","a","A"].includes(e.key) && cur !== RIGHT) nextDirRef.current = LEFT;
      if (["ArrowRight","d","D"].includes(e.key) && cur !== LEFT) nextDirRef.current = RIGHT;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // לולאת משחק יציבה עם RAF + מצטבר זמן
  useEffect(() => {
    let raf = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!runningRef.current) return;

      const dt = now - lastTickRef.current;
      lastTickRef.current = now;
      accRef.current += dt;

      while (accRef.current >= STEP_MS) {
        accRef.current -= STEP_MS;

        // tick פנימי: משתמש ב-refs ובסטייטים, לא תלוי ב-deps חיצוניים
        const snake = snakeRef.current;
        const apple = appleRef.current;

        // לאשר כיוון חדש רק על גבול טיק
        dirRef.current = nextDirRef.current;

        const head = snake[0];
        const next = {
          x: (head.x + dirRef.current.x + COLS) % COLS,
          y: (head.y + dirRef.current.y + ROWS) % ROWS
        };

        // Self-hit → Game over
        if (snake.some(p => p.x === next.x && p.y === next.y)) {
          runningRef.current = false;
          setHigh(h => {
            const nh = Math.max(h, score);
            localStorage.setItem("snake_high", String(nh));
            return nh;
          });
          bump(); // לרענן סטטוס "Game Over"
          continue;
        }

        const ate = (next.x === apple.x && next.y === apple.y);
        const body = [next, ...snake.slice(0, ate ? snake.length : snake.length - 1)];
        snakeRef.current = body;

        if (ate) {
          setScore(s => s + 10);
          appleRef.current = rndEmpty(body);
        }

        bump(); // רענון תצוגה לכל טיק
      }
    };

    lastTickRef.current = performance.now();
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [score]); // שינוי score לא פוגע ביציבות; אפשר גם להשאיר [] אם מעדיפות

  const reset = () => {
    snakeRef.current = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
    dirRef.current = RIGHT;
    nextDirRef.current = RIGHT;
    appleRef.current = { x: 12, y: 10 };
    runningRef.current = true;
    setScore(0);
    bump();
  };

  // ציור (קורא מצב מתוך refs)
  const snake = snakeRef.current;
  const apple = appleRef.current;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center text-sm">
        <div>Score: <b>{score}</b></div>
        <div>High: <b>{high}</b></div>
        <div className="flex gap-2">
          <button onClick={() => { runningRef.current = !runningRef.current; bump(); }} className="px-2 h-8 rounded border bg-white/80 hover:bg-white">⏯ Pause</button>
          <button onClick={reset} className="px-2 h-8 rounded border bg-white/80 hover:bg-white">↺ Restart</button>
        </div>
      </div>

      <div
        className="grid overflow-hidden rounded-md bg-neutral-900"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, width: 400, height: 400 }}
      >
        {Array.from({ length: ROWS * COLS }, (_, i) => {
          const x = i % COLS, y = Math.floor(i / COLS);
          const isHead = (snake[0].x === x && snake[0].y === y);
          const isBody = snake.some(p => p.x === x && p.y === y);
          const isApple = (apple.x === x && apple.y === y);
          return (
            <div
              key={i}
              style={{
                outline: "1px solid #111",
                background:
                  isHead ? "#34c3c8" :
                  isBody ? "#76e7eb" :
                  isApple ? "#ff6b6b" : "transparent"
              }}
            />
          );
        })}
      </div>

      <div className="text-xs opacity-70">
        חיצים = תנועה · רווח = Pause/Resume · ↺ = Reset
      </div>
      {!runningRef.current && (
        <div className="text-sm font-semibold text-red-600">Game Over — לחצי ↺ כדי להתחיל מחדש</div>
      )}
    </div>
  );
}
