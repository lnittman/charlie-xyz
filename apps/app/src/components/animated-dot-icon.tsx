"use client";

import { animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedDotIconProps {
  active?: boolean;
  alwaysHeat?: boolean;
  triggerOnHover?: boolean;
  size?: number;
  className?: string;
  pattern?: "processing" | "sync" | "idle" | "error" | "success";
}

const initCanvas = (canvas: HTMLCanvasElement) => {
  const { width, height } = canvas.getBoundingClientRect();
  const ctx = canvas.getContext("2d")!;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const upscaleCanvas = () => {
    const scale = window.visualViewport?.scale || 1;
    const dpr = (window.devicePixelRatio || 1) * scale;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.scale(dpr, dpr);

    canvas.dispatchEvent(new Event('resize'));
  };

  upscaleCanvas();

  const handleResize = () => {
    setTimeout(upscaleCanvas, 500);
  };

  window.addEventListener("resize", handleResize);
  window.visualViewport?.addEventListener("resize", handleResize);

  return ctx;
};

// Charlie-specific patterns for workflow states
const patterns = {
  processing: {
    grid: [[12], [7, 11, 13, 17], [2, 6, 8, 10, 14, 16, 18, 22], [0, 1, 3, 4, 5, 9, 15, 19, 20, 21, 23, 24]],
    gridSize: 5,
    cellSize: 2,
    spacing: 2,
    offset: 3,
    color: '#3b82f6' // Blue for processing
  },
  sync: {
    grid: [[10, 11, 12, 13, 14], [5, 9, 15, 19], [0, 4, 20, 24], [1, 2, 3, 21, 22, 23]],
    gridSize: 5,
    cellSize: 2,
    spacing: 2,
    offset: 3,
    color: '#8b5cf6' // Purple for sync
  },
  idle: {
    grid: [[12], [10, 14], [8, 16], [6, 18], [4, 5, 19, 20]],
    gridSize: 5,
    cellSize: 2,
    spacing: 2,
    offset: 3,
    color: '#6b7280' // Gray for idle
  },
  error: {
    grid: [[0, 4], [5, 6, 8, 9], [10, 11, 13, 14], [15, 19]],
    gridSize: 5,
    cellSize: 2,
    spacing: 2,
    offset: 3,
    color: '#ef4444' // Red for error
  },
  success: {
    grid: [[24], [16, 18, 30, 32], [8, 12, 36, 40], [0, 3, 6, 21, 27, 42, 45, 48]],
    gridSize: 7,
    cellSize: 2,
    spacing: 2,
    offset: 3,
    color: '#10b981' // Green for success
  }
};

export function AnimatedDotIcon({ 
  active = true, 
  alwaysHeat = false, 
  triggerOnHover = false, 
  size = 20,
  className,
  pattern = "processing"
}: AnimatedDotIconProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fnRefs = useRef<{
    activate: () => void;
    deactivate: () => void;
  }>({ activate: () => {}, deactivate: () => {} });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = initCanvas(canvas);
    const config = patterns[pattern];

    let isRunning = false;
    let isActive = false;

    let activeGroup = 0;
    const rowAlphas = [0.2, 0.4, 1, 0.04];

    const scaler = size / 20;

    const render = () => {
      ctx.fillStyle = config.color;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const group of config.grid.slice(0, 4)) {
        const groupIndex = config.grid.indexOf(group);
        ctx.globalAlpha = rowAlphas[groupIndex];

        for (const index of group) {
          ctx.fillRect(
            (config.offset + index % config.gridSize * config.spacing) * scaler,
            (config.offset + Math.floor(index / config.gridSize) * config.spacing) * scaler,
            config.cellSize * scaler,
            config.cellSize * scaler
          );
        }
      }

      if (isRunning) {
        requestAnimationFrame(render);
      }
    };

    const timeouts: number[] = [];
    let runCount = 0;

    const cycle = () => {
      isRunning = true;
      activeGroup = (activeGroup + 1) % 5;

      rowAlphas.forEach((alpha, index) => {
        let targetAlpha = alpha;

        if (index === activeGroup) targetAlpha = 1;
        else if (index === (activeGroup + 1) % 4) targetAlpha = 0.12;
        else if (index === (activeGroup + 2) % 4) targetAlpha = 0.2;
        else if (index === (activeGroup + 3) % 4) targetAlpha = 0.4;

        animate(alpha, targetAlpha, {
          duration: 0.05,
          onUpdate: (value) => {
            rowAlphas[index] = value;
          }
        });
      });

      timeouts.forEach((timeout) => {
        window.clearTimeout(timeout);
      });

      timeouts.push(window.setTimeout(() => {
        isRunning = false;
      }, 300));

      if (activeGroup === 3) runCount += 1;

      if ((runCount === 2 || !isActive) && activeGroup === 2) return;

      timeouts.push(window.setTimeout(() => {
        cycle();
      }, 50));
    };

    fnRefs.current = {
      activate: () => {
        if (isActive) return;

        isActive = true;
        runCount = 0;
        cycle();
        render();
      },
      deactivate: () => {
        if (!isActive) return;
        isActive = false;
      }
    };

    render();
    canvas.addEventListener('resize', render);

    if (triggerOnHover) {
      const group = canvasRef.current!.closest('.group');

      if (group) {
        group.addEventListener('mouseenter', fnRefs.current.activate);
        group.addEventListener('mouseleave', fnRefs.current.deactivate);

        return () => {
          group.removeEventListener('mouseenter', fnRefs.current.activate);
          group.removeEventListener('mouseleave', fnRefs.current.deactivate);
        };
      }
    }
  }, [triggerOnHover, size, pattern]);

  useEffect(() => {
    if (triggerOnHover) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && active) {
          fnRefs.current.activate();
        } else {
          fnRefs.current.deactivate();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(canvasRef.current!);

    return () => {
      observer.disconnect();
    };
  }, [active, triggerOnHover]);

  return (
    <canvas
      className={cn(
        alwaysHeat ? '' : ['[&.grayscale]:opacity-60 transition-[filter,opacity]', !active && 'grayscale'],
        className
      )}
      ref={canvasRef}
      style={{ width: size, height: size }}
    />
  );
}