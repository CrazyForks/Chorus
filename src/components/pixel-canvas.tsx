"use client";

import { useRef, useEffect, useCallback } from "react";

// ────────────────────────── Types ──────────────────────────

export type SlotState = "empty" | "idle" | "typing" | "celebrate" | "looking";

export interface SlotData {
  state: SlotState;
  sessionName?: string;
}

export type EffectType = "bulb" | "document" | "stars" | "flash";

export interface PixelCanvasEffect {
  type: EffectType;
  slotIndex?: number;
}

export interface PixelCanvasProps {
  slots: SlotData[];
  projectName: string;
  agentCount: number;
  collapsed?: boolean;
  effects?: PixelCanvasEffect[];
  onEffectsConsumed?: () => void;
}

// ────────────────────────── Sprite Types ──────────────────────────

interface SpriteRegion {
  srcX: number;
  srcY: number;
  srcW: number;
  srcH: number;
  destW: number;
  destH: number;
}

interface OffsetSprite extends SpriteRegion {
  dx: number;
  dy: number;
}

// ────────────────────────── Constants ──────────────────────────

const SCALE = 3;
const CANVAS_W = 240;
const CANVAS_H = 240;
const FLOOR_H = 177; // Floor background visible height
const TICK_MS = 10;
const CELEBRATE_MS = 3000;
const LOOKING_MS = 1500;

// ────────────────────────── Station Layout (from game.html) ──────────────────────────

const STATION_DEFS = [
  { index: 0, baseX: 141, baseY: 117, variant: 1 as const },
  { index: 1, baseX: 101, baseY: 77, variant: 1 as const },
  { index: 2, baseX: 63, baseY: 96, variant: 1 as const },
  { index: 3, baseX: 114, baseY: 80, variant: 0 as const },
  { index: 4, baseX: 77, baseY: 99, variant: 0 as const },
];

const EMP_POSITIONS = [
  { x: 146, y: 107 },
  { x: 106, y: 67 },
  { x: 68, y: 86 },
  { x: 135, y: 78 },
  { x: 98, y: 97 },
];

// Desk/chair offsets — source regions from AI-generated sprites
function getOffsets(v: number): {
  desk: OffsetSprite;
  chair: OffsetSprite;
  chairBack: OffsetSprite | null;
} {
  if (v === 1) {
    return {
      desk: {
        dx: 0,
        dy: -7,
        srcX: 99,
        srcY: 268,
        srcW: 430,
        srcH: 620,
        destW: 37,
        destH: 54,
      },
      chair: {
        dx: 4,
        dy: -10,
        srcX: 512,
        srcY: 457,
        srcW: 222,
        srcH: 334,
        destW: 18,
        destH: 27,
      },
      chairBack: null,
    };
  }
  return {
    desk: {
      dx: 0,
      dy: -7,
      srcX: 676,
      srcY: 232,
      srcW: 524,
      srcH: 664,
      destW: 50,
      destH: 63,
    },
    chair: {
      dx: 29,
      dy: 11,
      srcX: 112,
      srcY: 473,
      srcW: 241,
      srcH: 298,
      destW: 20,
      destH: 25,
    },
    chairBack: null,
  };
}

const STATIONS = STATION_DEFS.map((def) => ({
  ...def,
  offsets: getOffsets(def.variant),
}));

// ────────────────────────── Combined FaceBody Sprites ──────────────────────────

const FACEBODY_SPRITES: Record<string, SpriteRegion> = {
  fb12: {
    srcX: 135,
    srcY: 125,
    srcW: 558,
    srcH: 991,
    destW: 15,
    destH: 27,
  },
  fb34: {
    srcX: 67,
    srcY: 59,
    srcW: 634,
    srcH: 1113,
    destW: 19,
    destH: 32,
  },
};

// Each employee uses combined sit/type facebody images
const EMP_APPEARANCES = [
  { sit: "facebody1", type: "facebody2", sprite: "fb12" }, // #0 variant 1
  { sit: "facebody1", type: "facebody2", sprite: "fb12" }, // #1 variant 1
  { sit: "facebody1", type: "facebody2", sprite: "fb12" }, // #2 variant 1
  { sit: "facebody3", type: "facebody4", sprite: "fb34" }, // #3 variant 0
  { sit: "facebody3", type: "facebody4", sprite: "fb34" }, // #4 variant 0
];

// ────────────────────────── PC Screen ──────────────────────────

const PC_SCREEN_DEFS: {
  stationIndex: number;
  x: number;
  y: number;
  col: number;
}[] = [
  { stationIndex: 3, x: 130, y: 82, col: 0 },
  { stationIndex: 4, x: 93, y: 101, col: 1 },
];

// ────────────────────────── Internal State Types ──────────────────────────

interface SlotMachine {
  state: SlotState;
  cycleIndex: number;
  frameTicks: number;
  ticksPerFrame: number;
  stateTimer: number;
}

interface ActiveEffect {
  type: EffectType;
  slotIndex: number;
  elapsed: number;
  duration: number;
}

const EFFECT_DURATIONS: Record<EffectType, number> = {
  bulb: 2000,
  document: 1500,
  stars: 2500,
  flash: 400,
};

// ────────────────────────── Image Loading ──────────────────────────

const SPRITE_BASE = "/sprites/";
const IMAGE_SOURCES: Record<string, string> = {
  floor: "floor.jpeg",
  desk: "desk0new.png",
  chair: "chair_new.png",
  facebody1: "facebody1.png",
  facebody2: "facebody2.png",
  facebody3: "facebody3.png",
  facebody4: "facebody4.png",
  pc: "pc.png",
};

function loadImages(): Promise<Record<string, HTMLImageElement>> {
  return new Promise((resolve) => {
    const images: Record<string, HTMLImageElement> = {};
    const entries = Object.entries(IMAGE_SOURCES);
    let loaded = 0;
    const total = entries.length;

    entries.forEach(([name, file]) => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        if (loaded === total) resolve(images);
      };
      img.onerror = () => {
        console.warn("Failed to load sprite:", name, file);
        loaded++;
        if (loaded === total) resolve(images);
      };
      img.src = `${SPRITE_BASE}${file}`;
      images[name] = img;
    });
  });
}

// ────────────────────────── Sprite Drawing ──────────────────────────

function drawSprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  x: number,
  y: number,
  sp: SpriteRegion
) {
  if (!img || !img.complete || !img.naturalWidth) return;
  ctx.drawImage(
    img,
    sp.srcX,
    sp.srcY,
    sp.srcW,
    sp.srcH,
    x,
    y,
    sp.destW,
    sp.destH
  );
}

// ────────────────────────── Component ──────────────────────────

export function PixelCanvas({
  slots,
  projectName,
  agentCount,
  collapsed = false,
  effects,
  onEffectsConsumed,
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const imagesLoadedRef = useRef(false);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const tickAccumRef = useRef(0);

  // Slot state machines
  const slotsRef = useRef<SlotMachine[]>(
    Array.from({ length: 5 }, () => ({
      state: "empty" as SlotState,
      cycleIndex: 0,
      frameTicks: 0,
      ticksPerFrame: 1,
      stateTimer: 0,
    }))
  );

  // Props refs for access in game loop
  const slotsDataRef = useRef(slots);
  const projectNameRef = useRef(projectName);
  const agentCountRef = useRef(agentCount);
  const collapsedRef = useRef(collapsed);

  // Effects
  const activeEffectsRef = useRef<ActiveEffect[]>([]);

  // PC screen animation
  const pcFrameRef = useRef(0);
  const pcTickCountRef = useRef(0);
  const PC_TICKS_PER_FRAME = 20;

  // Sync props to refs
  useEffect(() => {
    slotsDataRef.current = slots;
    for (let i = 0; i < 5; i++) {
      const externalState = slots[i]?.state ?? "empty";
      const machine = slotsRef.current[i];
      if (machine.state !== externalState) {
        machine.state = externalState;
        machine.cycleIndex = 0;
        machine.frameTicks = 0;
        machine.stateTimer = 0;
      }
    }
  }, [slots]);

  useEffect(() => {
    projectNameRef.current = projectName;
  }, [projectName]);

  useEffect(() => {
    agentCountRef.current = agentCount;
  }, [agentCount]);

  useEffect(() => {
    collapsedRef.current = collapsed;
  }, [collapsed]);

  // Consume incoming effects
  useEffect(() => {
    if (!effects || effects.length === 0) return;
    effects.forEach((eff) => {
      activeEffectsRef.current.push({
        type: eff.type,
        slotIndex: eff.slotIndex ?? 0,
        elapsed: 0,
        duration: EFFECT_DURATIONS[eff.type],
      });
    });
    onEffectsConsumed?.();
  }, [effects, onEffectsConsumed]);

  // ── Render functions ──

  const renderTopBar = useCallback((ctx: CanvasRenderingContext2D) => {
    const H = 16;
    ctx.fillStyle = "#d0d0e0";
    ctx.fillRect(0, 0, CANVAS_W, H);
    ctx.fillStyle = "#e4e4f0";
    ctx.fillRect(0, 0, CANVAS_W, 1);
    ctx.fillStyle = "#9999aa";
    ctx.fillRect(0, H - 1, CANVAS_W, 1);

    ctx.font = "bold 7px monospace";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#333";
    ctx.textAlign = "left";
    const name = projectNameRef.current;
    const displayName =
      name.length > 20 ? name.slice(0, 18) + ".." : name;
    ctx.fillText(displayName, 6, H / 2);

    ctx.textAlign = "right";
    ctx.fillStyle = "#336";
    const count = agentCountRef.current;
    ctx.fillText(`${count} agent${count !== 1 ? "s" : ""}`, 234, H / 2);

    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }, []);

  const renderSessionLabel = useCallback(
    (ctx: CanvasRenderingContext2D, slotIndex: number) => {
      const sd = slotsDataRef.current[slotIndex];
      if (!sd?.sessionName) return;
      const pos = EMP_POSITIONS[slotIndex];
      ctx.font = "5px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      const text =
        sd.sessionName.length > 12
          ? sd.sessionName.slice(0, 10) + ".."
          : sd.sessionName;
      const tw = ctx.measureText(text).width;
      const px = pos.x + 8;
      const py = pos.y - 4;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(px - tw / 2 - 2, py - 6, tw + 4, 7);
      ctx.fillStyle = "#fff";
      ctx.fillText(text, px, py);
      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";
    },
    []
  );

  const renderEffects = useCallback((ctx: CanvasRenderingContext2D) => {
    const effs = activeEffectsRef.current;
    for (const eff of effs) {
      const progress = eff.elapsed / eff.duration;
      const pos = EMP_POSITIONS[eff.slotIndex] || EMP_POSITIONS[0];

      switch (eff.type) {
        case "bulb": {
          const alpha =
            progress < 0.1
              ? progress / 0.1
              : progress > 0.8
                ? (1 - progress) / 0.2
                : 1;
          const bx = pos.x + 8;
          const by = pos.y - 14 - Math.sin(progress * Math.PI * 4) * 2;
          ctx.fillStyle = `rgba(255, 220, 50, ${alpha * 0.3})`;
          ctx.beginPath();
          ctx.arc(bx, by, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(255, 230, 80, ${alpha})`;
          ctx.beginPath();
          ctx.arc(bx, by, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
          ctx.fillRect(bx - 1, by - 1, 2, 2);
          ctx.fillStyle = `rgba(180, 180, 180, ${alpha})`;
          ctx.fillRect(bx - 2, by + 3, 4, 2);
          break;
        }
        case "document": {
          const startX = CANVAS_W;
          const endX = pos.x;
          const curX = startX + (endX - startX) * Math.min(progress * 2, 1);
          const curY = pos.y - 10 + Math.sin(progress * Math.PI) * -15;
          const alpha = progress > 0.8 ? (1 - progress) / 0.2 : 1;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = "#f8f8f0";
          ctx.fillRect(curX, curY, 8, 10);
          ctx.strokeStyle = "#aaa";
          ctx.lineWidth = 0.5;
          ctx.strokeRect(curX, curY, 8, 10);
          ctx.fillStyle = "#ccc";
          ctx.fillRect(curX + 1.5, curY + 2, 5, 1);
          ctx.fillRect(curX + 1.5, curY + 4, 4, 1);
          ctx.fillRect(curX + 1.5, curY + 6, 5, 1);
          ctx.globalAlpha = 1;
          break;
        }
        case "stars": {
          const alpha = progress > 0.7 ? (1 - progress) / 0.3 : 1;
          const cx = pos.x + 8;
          const cy = pos.y + 5;
          for (let i = 0; i < 8; i++) {
            const angle =
              (i / 8) * Math.PI * 2 + progress * Math.PI * 3;
            const radius = 10 + progress * 15;
            const sx = cx + Math.cos(angle) * radius;
            const sy = cy + Math.sin(angle) * radius;
            const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#A78BFA"];
            ctx.fillStyle = colors[i % colors.length];
            ctx.globalAlpha =
              alpha *
              (0.5 + Math.sin(progress * Math.PI * 6 + i) * 0.5);
            const size =
              1.5 + Math.sin(progress * Math.PI * 4 + i) * 0.5;
            ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
          }
          ctx.globalAlpha = 1;
          break;
        }
        case "flash": {
          const alpha =
            progress < 0.3 ? progress / 0.3 : (1 - progress) / 0.7;
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
          ctx.fillRect(0, 16, CANVAS_W, CANVAS_H - 16);
          break;
        }
      }
    }
  }, []);

  const render = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      images: Record<string, HTMLImageElement>
    ) => {
      ctx.clearRect(0, 0, CANVAS_W * SCALE, CANVAS_H * SCALE);
      ctx.save();
      ctx.scale(SCALE, SCALE);

      // Floor background (scaled from 1200x880 source to 240x177)
      if (images.floor?.complete && images.floor.naturalWidth) {
        ctx.drawImage(images.floor, 0, 0, CANVAS_W, FLOOR_H);
      }

      // Dark bottom area below the floor
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, FLOOR_H, CANVAS_W, CANVAS_H - FLOOR_H);

      // Top bar overlay
      renderTopBar(ctx);

      // Collect all sprites for Y-sort
      const sprites: { type: string; y: number; draw: () => void }[] = [];

      STATIONS.forEach((st, si) => {
        const o = st.offsets;
        const bx = st.baseX;
        const by = st.baseY;
        const deskSortY = by + o.desk.dy + o.desk.destH;
        const chairInFront = st.variant === 0;

        // Chair
        sprites.push({
          type: "chair",
          y: chairInFront ? deskSortY + 2 : deskSortY - 2,
          draw() {
            drawSprite(
              ctx,
              images.chair,
              bx + o.chair.dx,
              by + o.chair.dy,
              o.chair
            );
          },
        });
        if (o.chairBack) {
          const cb = o.chairBack;
          sprites.push({
            type: "chairBack",
            y: chairInFront ? deskSortY + 3 : deskSortY - 3,
            draw() {
              drawSprite(
                ctx,
                images.chair,
                bx + cb.dx,
                by + cb.dy,
                cb
              );
            },
          });
        }

        // Employee (only if slot is not empty)
        const machine = slotsRef.current[si];
        if (machine.state !== "empty") {
          const app = EMP_APPEARANCES[si];
          const fbSprite = FACEBODY_SPRITES[app.sprite];
          const pos = EMP_POSITIONS[si];
          const empAboveDesk = si === 3 || si === 4;

          sprites.push({
            type: "employee",
            y: empAboveDesk ? deskSortY + 3 : deskSortY - 1,
            draw() {
              // Celebrate: golden tint via alpha pulsing
              if (machine.state === "celebrate") {
                ctx.save();
                ctx.globalAlpha =
                  0.85 + Math.sin(Date.now() / 200) * 0.15;
              }

              // Looking: slight head bob
              const lookOffset =
                machine.state === "looking"
                  ? Math.sin(Date.now() / 300) * 1
                  : 0;

              // Combined facebody: toggle sit/type image based on cycleIndex
              const isTyping =
                machine.state === "typing" &&
                machine.cycleIndex % 2 === 1;
              const imgName = isTyping ? app.type : app.sit;

              drawSprite(
                ctx,
                images[imgName],
                pos.x,
                pos.y + lookOffset,
                fbSprite
              );

              if (machine.state === "celebrate") {
                ctx.restore();
              }

              // Session name label above character
              renderSessionLabel(ctx, si);
            },
          });
        }

        // Desk
        sprites.push({
          type: "desk",
          y: deskSortY,
          draw() {
            drawSprite(
              ctx,
              images.desk,
              bx + o.desk.dx,
              by + o.desk.dy,
              o.desk
            );
          },
        });
      });

      // PC screens on variant-0 desks (visible when typing)
      PC_SCREEN_DEFS.forEach((pc) => {
        const machine = slotsRef.current[pc.stationIndex];
        if (machine.state !== "typing") return;

        const st = STATIONS[pc.stationIndex];
        const o = st.offsets;
        const deskSortY = st.baseY + o.desk.dy + o.desk.destH;

        sprites.push({
          type: "pc",
          y: deskSortY + 0.5,
          draw() {
            const img = images.pc;
            if (!img?.complete || !img.naturalWidth) return;
            const fw = img.naturalWidth / 2;
            const fh = img.naturalHeight / 4;
            ctx.drawImage(
              img,
              pc.col * fw,
              pcFrameRef.current * fh,
              fw,
              fh,
              pc.x,
              pc.y,
              8,
              11
            );
          },
        });
      });

      // Y-sort and draw
      sprites.sort((a, b) => a.y - b.y);
      sprites.forEach((s) => s.draw());

      // Effects overlay
      renderEffects(ctx);

      ctx.restore();
    },
    [renderTopBar, renderSessionLabel, renderEffects]
  );

  // ── Game Loop ──

  const tick = useCallback((deltaMs: number) => {
    for (let i = 0; i < 5; i++) {
      const machine = slotsRef.current[i];
      if (machine.state === "empty") continue;

      machine.stateTimer += deltaMs;

      // Auto-transitions
      if (
        machine.state === "celebrate" &&
        machine.stateTimer >= CELEBRATE_MS
      ) {
        machine.state = "idle";
        machine.cycleIndex = 0;
        machine.frameTicks = 0;
        machine.stateTimer = 0;
      }
      if (
        machine.state === "looking" &&
        machine.stateTimer >= LOOKING_MS
      ) {
        machine.state = "idle";
        machine.cycleIndex = 0;
        machine.frameTicks = 0;
        machine.stateTimer = 0;
      }

      // Frame cycling for typing (toggle between sit/type frames)
      if (machine.state === "typing") {
        machine.frameTicks++;
        if (machine.frameTicks >= machine.ticksPerFrame) {
          machine.frameTicks = 0;
          machine.cycleIndex = (machine.cycleIndex + 1) % 2;
        }
      }
    }

    // PC screen frame cycling
    pcTickCountRef.current++;
    if (pcTickCountRef.current >= PC_TICKS_PER_FRAME) {
      pcTickCountRef.current = 0;
      pcFrameRef.current = (pcFrameRef.current + 1) % 4;
    }

    // Update effects
    const effs = activeEffectsRef.current;
    for (let i = effs.length - 1; i >= 0; i--) {
      effs[i].elapsed += deltaMs;
      if (effs[i].elapsed >= effs[i].duration) {
        effs.splice(i, 1);
      }
    }
  }, []);

  const gameLoop = useCallback(
    (now: number) => {
      if (collapsedRef.current) {
        animFrameRef.current = requestAnimationFrame(gameLoop);
        lastTimeRef.current = now;
        return;
      }

      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;
      tickAccumRef.current += delta;

      let ticked = false;
      while (tickAccumRef.current >= TICK_MS) {
        tickAccumRef.current -= TICK_MS;
        tick(TICK_MS);
        ticked = true;
      }

      if (ticked) {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx && imagesLoadedRef.current) {
          render(ctx, imagesRef.current);
        }
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    },
    [tick, render]
  );

  // ── Init ──

  useEffect(() => {
    let cancelled = false;

    loadImages().then((images) => {
      if (cancelled) return;
      imagesRef.current = images;
      imagesLoadedRef.current = true;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        render(ctx, images);
      }

      lastTimeRef.current = performance.now();
      animFrameRef.current = requestAnimationFrame(gameLoop);
    });

    return () => {
      cancelled = true;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [render, gameLoop]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W * SCALE}
      height={CANVAS_H * SCALE}
      className="w-full"
      style={{
        imageRendering: "pixelated",
        aspectRatio: "1 / 1",
      }}
    />
  );
}
