'use client';

import React from 'react';
import { Activity } from 'lucide-react';

function clampByte(val: number): number {
  return val < 0 ? 0 : val > 255 ? 255 : val | 0;
}

export interface HistogramBins {
  r: number[];
  g: number[];
  b: number[];
  luma: number[];
}

/**
 * 1. Real-Time 64-Bin RGB & Luminance Histogram Calculator
 * Sub-samples every 16th pixel for 60fps responsiveness and normalizes against max values.
 */
export function computeCanvasHistogram(canvas: HTMLCanvasElement): HistogramBins {
  const binsCount = 64;
  const r = new Array<number>(binsCount).fill(0);
  const g = new Array<number>(binsCount).fill(0);
  const b = new Array<number>(binsCount).fill(0);
  const luma = new Array<number>(binsCount).fill(0);

  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    return { r, g, b, luma };
  }

  try {
    let imgData: Uint8Array | Uint8ClampedArray | null = null;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    } else {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        const glCtx = gl as WebGL2RenderingContext | WebGLRenderingContext;
        const pixels = new Uint8Array(canvas.width * canvas.height * 4);
        glCtx.readPixels(0, 0, canvas.width, canvas.height, glCtx.RGBA, glCtx.UNSIGNED_BYTE, pixels);
        imgData = pixels;
      }
    }

    if (!imgData || imgData.length === 0) {
      return { r, g, b, luma };
    }

    const step = 16 * 4; // Sample every 16th pixel for high frame-rate responsiveness

    for (let i = 0; i < imgData.length; i += step) {
      const rv = imgData[i];
      const gv = imgData[i + 1];
      const bv = imgData[i + 2];
      const lv = (rv * 77 + gv * 150 + bv * 29) >> 8;

      r[rv >> 2]++;
      g[gv >> 2]++;
      b[bv >> 2]++;
      luma[lv >> 2]++;
    }

    const maxVal = Math.max(
      1,
      ...r.slice(1, 63),
      ...g.slice(1, 63),
      ...b.slice(1, 63),
      ...luma.slice(1, 63)
    );

    for (let i = 0; i < binsCount; i++) {
      r[i] = Math.min(1, r[i] / maxVal);
      g[i] = Math.min(1, g[i] / maxVal);
      b[i] = Math.min(1, b[i] / maxVal);
      luma[i] = Math.min(1, luma[i] / maxVal);
    }
  } catch (err) {
    // Canvas security or context read fallback
  }

  return { r, g, b, luma };
}

/**
 * 2. Split-Tone Hue/Saturation to RGB Offset Converter
 */
export function hueSatToRgbOffset(hueDeg: number, satPercent: number): [number, number, number] {
  if (satPercent <= 0) return [0, 0, 0];
  const rad = (hueDeg * Math.PI) / 180;
  const strength = (satPercent / 100) * 42;
  return [
    Math.cos(rad) * strength,
    Math.cos(rad - (2 * Math.PI) / 3) * strength,
    Math.cos(rad - (4 * Math.PI) / 3) * strength,
  ];
}

/**
 * 3. 3-Point Spline Characteristic Tone Curve Lookup Table (256 entries)
 * Generates Gaussian-weighted tonal shifts at Shadow Toe (0.22), Midtone Gamma (0.50), and Highlight Shoulder (0.78).
 */
export function buildToneCurveLUT(
  toeOffset: number,
  midOffset: number,
  shoulderOffset: number
): Uint8Array | null {
  if (toeOffset === 0 && midOffset === 0 && shoulderOffset === 0) return null;

  const lut = new Uint8Array(256);
  for (let x = 0; x < 256; x++) {
    const t = x / 255;
    const wToe = Math.exp(-Math.pow((t - 0.22) / 0.22, 2));
    const wMid = Math.exp(-Math.pow((t - 0.5) / 0.26, 2));
    const wShoulder = Math.exp(-Math.pow((t - 0.78) / 0.22, 2));

    const delta =
      toeOffset * 1.15 * wToe +
      midOffset * 1.25 * wMid +
      shoulderOffset * 1.15 * wShoulder;

    lut[x] = clampByte(Math.round(x + delta));
  }
  return lut;
}

/**
 * 4. Ansel Adams 11-Zone Exposure Diagnostic Palette
 */
export function zoneSystemColor(luma255: number): [number, number, number] {
  const z = Math.min(10, Math.max(0, Math.floor((luma255 / 256) * 11)));
  const palette: [number, number, number][] = [
    [95, 35, 165],   // Zone 0: Pure Black Clip
    [55, 75, 200],   // Zone I: Near Black
    [35, 135, 215],  // Zone II: Deep Textured Shadow
    [40, 165, 155],  // Zone III: Average Dark Materials
    [55, 175, 95],   // Zone IV: Dark Foliage / Open Shadow
    [125, 195, 65],  // Zone V: 18% Middle Gray
    [225, 200, 55],  // Zone VI: Warm Skin Midtone
    [240, 150, 45],  // Zone VII: Light Skin / Bright Concrete
    [235, 95, 45],   // Zone VIII: Textured Highlight
    [225, 50, 95],   // Zone IX: Glaring White
    [255, 235, 245], // Zone X: Specular Highlight Clip
  ];
  return palette[z];
}

/**
 * 5. Live RGB & Luminance Waveform Scope Component
 * Brutalist monochromatic UI displaying 64-bin real-time signal waveforms.
 */
export const LiveRgbHistogramScope: React.FC<{
  histogram: HistogramBins | null;
  className?: string;
}> = ({ histogram, className = '' }) => {
  const buildPath = (bins: number[]) => {
    if (!bins || bins.length === 0) return '';
    const w = 240;
    const h = 50;
    const points = bins.map((v, idx) => {
      const x = (idx / (bins.length - 1)) * w;
      const y = h - Math.max(1, v * (h - 4));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M 0,${h} L ${points.join(' L ')} L ${w},${h} Z`;
  };

  return (
    <div className={`p-2.5 border-b border-white/20 bg-black font-mono select-none ${className}`}>
      <div className="flex items-center justify-between text-[9px] text-zinc-400 mb-1.5 uppercase font-bold tracking-wider">
        <span className="flex items-center gap-1.5 text-white">
          <Activity className="w-3 h-3 text-white" />
          <span>RGB & LUMA WAVEFORM</span>
        </span>
        <span className="text-zinc-500">D-MIN · ZONE V · D-MAX</span>
      </div>

      <div className="relative h-[48px] w-full bg-[#080808] border border-white/20 overflow-hidden">
        {histogram ? (
          <svg viewBox="0 0 240 50" preserveAspectRatio="none" className="w-full h-full block">
            <path d={buildPath(histogram.r)} fill="rgba(235, 60, 60, 0.28)" stroke="rgba(255, 80, 80, 0.85)" strokeWidth="1" />
            <path d={buildPath(histogram.g)} fill="rgba(60, 200, 100, 0.24)" stroke="rgba(80, 230, 120, 0.85)" strokeWidth="1" />
            <path d={buildPath(histogram.b)} fill="rgba(60, 150, 240, 0.24)" stroke="rgba(90, 180, 255, 0.85)" strokeWidth="1" />
            <path d={buildPath(histogram.luma)} fill="rgba(255, 255, 255, 0.15)" stroke="rgba(255, 255, 255, 0.95)" strokeWidth="1.2" />
          </svg>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[9px] text-zinc-500 uppercase tracking-widest">
            [NO WAVEFORM SIGNAL]
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 6. Interactive 3-Point Characteristic D-Log-E Spline Curve Component
 * Brutalist SVG curve display with Shadow Toe, Midtone Anchor, and Highlight Shoulder visualization.
 */
export const CharacteristicToneCurve: React.FC<{
  toe: number;
  mid: number;
  shoulder: number;
  onReset: () => void;
}> = ({ toe, mid, shoulder, onReset }) => {
  const w = 240;
  const h = 90;
  const pts: string[] = [];

  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    const x = t * 255;
    const wToe = Math.exp(-Math.pow((t - 0.22) / 0.22, 2));
    const wMid = Math.exp(-Math.pow((t - 0.5) / 0.26, 2));
    const wShoulder = Math.exp(-Math.pow((t - 0.78) / 0.22, 2));
    const delta = toe * 1.15 * wToe + mid * 1.25 * wMid + shoulder * 1.15 * wShoulder;
    const yVal = Math.max(0, Math.min(255, x + delta));
    pts.push(`${(t * w).toFixed(1)},${(h - (yVal / 255) * h).toFixed(1)}`);
  }

  const isLinear = toe === 0 && mid === 0 && shoulder === 0;

  return (
    <div className="p-2.5 border border-white/20 bg-[#080808] space-y-2 font-mono">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white">
          D-Log-E Characteristic Curve
        </span>
        {!isLinear && (
          <button
            type="button"
            onClick={onReset}
            className="text-[9px] font-bold uppercase tracking-wider text-white underline hover:no-underline cursor-pointer"
          >
            [LINEAR RESET]
          </button>
        )}
      </div>

      <div className="relative h-[80px] w-full bg-black border border-white/20 overflow-hidden">
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full block">
          <line x1="0" y1={h} x2={w} y2="0" stroke="rgba(255, 255, 255, 0.2)" strokeDasharray="3 3" strokeWidth="1" />
          <polyline fill="none" stroke="#ffffff" strokeWidth="2" points={pts.join(' ')} />
        </svg>
      </div>
    </div>
  );
};
