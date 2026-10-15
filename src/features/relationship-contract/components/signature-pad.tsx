"use client";

import { useEffect, useRef, useState } from "react";

interface SignaturePadProps {
  label: string;
  onChange: (image: string | null) => void;
}

const WIDTH = 700;
const HEIGHT = 240;

export function SignaturePad({ label, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const distance = useRef(0);
  const keyboard = useRef({ x: WIDTH / 2, y: HEIGHT / 2, pen: false });
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 3.1;
    context.strokeStyle = "#243e59";
  }, []);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * WIDTH,
      y: ((event.clientY - bounds.top) / bounds.height) * HEIGHT,
    };
  }

  function finish() {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.closePath();
    if (distance.current >= 28) {
      setHasInk(true);
      onChange(canvas.toDataURL("image/png"));
    }
  }

  function clear() {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, WIDTH, HEIGHT);
    distance.current = 0;
    keyboard.current = { x: WIDTH / 2, y: HEIGHT / 2, pen: false };
    setHasInk(false);
    onChange(null);
  }

  return (
    <div className="contract-pad">
      <div className="contract-pad__head">
        <span>{label}</span>
        <button className="contract-text-button" onClick={clear} type="button">
          Clear signature
        </button>
      </div>
      <canvas
        ref={canvasRef}
        aria-label={`Draw ${label.toLowerCase()} here with a finger, mouse or stylus. Keyboard: press Space to lower or lift the pen, then use arrow keys to draw.`}
        className="contract-pad__canvas"
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          const context = event.currentTarget.getContext("2d");
          const { x, y } = point(event);
          context?.beginPath();
          context?.moveTo(x, y);
          keyboard.current.x = x;
          keyboard.current.y = y;
          drawing.current = true;
        }}
        onPointerMove={(event) => {
          if (!drawing.current) return;
          const context = event.currentTarget.getContext("2d");
          const { x, y } = point(event);
          const previous = context
            ? { x: keyboard.current.x, y: keyboard.current.y }
            : { x, y };
          // Browser pointer events remain the source of the actual handwritten path.
          context?.lineTo(x, y);
          context?.stroke();
          distance.current += Math.hypot(x - previous.x, y - previous.y);
          keyboard.current.x = x;
          keyboard.current.y = y;
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
        onKeyDown={(event) => {
          const context = event.currentTarget.getContext("2d");
          if (!context) return;
          if (event.code === "Space") {
            event.preventDefault();
            keyboard.current.pen = !keyboard.current.pen;
            context.beginPath();
            context.moveTo(keyboard.current.x, keyboard.current.y);
            if (!keyboard.current.pen && distance.current >= 28) {
              setHasInk(true);
              onChange(event.currentTarget.toDataURL("image/png"));
            }
            return;
          }
          const delta: Record<string, [number, number]> = {
            ArrowUp: [0, -8],
            ArrowDown: [0, 8],
            ArrowLeft: [-8, 0],
            ArrowRight: [8, 0],
          };
          const move = delta[event.key];
          if (!move) return;
          event.preventDefault();
          const nextX = Math.max(
            4,
            Math.min(WIDTH - 4, keyboard.current.x + move[0]),
          );
          const nextY = Math.max(
            4,
            Math.min(HEIGHT - 4, keyboard.current.y + move[1]),
          );
          if (keyboard.current.pen) {
            context.lineTo(nextX, nextY);
            context.stroke();
            distance.current += Math.hypot(
              nextX - keyboard.current.x,
              nextY - keyboard.current.y,
            );
          } else {
            context.beginPath();
            context.moveTo(nextX, nextY);
          }
          keyboard.current.x = nextX;
          keyboard.current.y = nextY;
        }}
        role="img"
        tabIndex={0}
      />
      <p className="contract-pad__hint">
        {hasInk
          ? "Signature ready for review. You may clear and redraw it."
          : "Use your finger, mouse or stylus. Keyboard: Space toggles the pen; arrows draw."}
      </p>
    </div>
  );
}
