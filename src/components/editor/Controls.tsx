'use client';

import React from 'react';
import { useEditorStore } from '@/lib/store';
import { 
  Sun, 
  Contrast, 
  Sparkles, 
  RotateCcw, 
  Sliders, 
  SlidersHorizontal,
  Flame,
  CircleDot,
  Palette,
  Film,
  Layers
} from 'lucide-react';

interface SliderRowProps {
  label: string;
  icon?: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  formatValue?: (val: number) => string;
  onChange: (value: number) => void;
}

function SliderRow({
  label,
  icon,
  value,
  min,
  max,
  step = 1,
  defaultValue = 0,
  unit = '',
  formatValue,
  onChange,
}: SliderRowProps) {
  const displayVal = formatValue ? formatValue(value) : `${value > 0 && min < 0 ? '+' : ''}${value}${unit}`;

  return (
    <div className="space-y-1.5 group">
      <div className="flex items-center justify-between text-xs font-mono">
        <label 
          onDoubleClick={() => onChange(defaultValue)}
          title="Double-click to reset"
          className="flex items-center gap-1.5 text-zinc-400 group-hover:text-zinc-200 transition-colors cursor-pointer"
        >
          {icon && <span className="text-zinc-500 group-hover:text-amber-500 transition-colors">{icon}</span>}
          <span>{label}</span>
        </label>
        <span 
          onDoubleClick={() => onChange(defaultValue)}
          title="Double-click to reset"
          className={`px-1.5 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
            value !== defaultValue 
              ? 'text-amber-400 bg-amber-950/40 border border-amber-500/20' 
              : 'text-zinc-500 bg-zinc-800/40'
          }`}
        >
          {displayVal}
        </span>
      </div>

      <div className="relative flex items-center">
        {/* Zero indicator line for bipolar sliders */}
        {min < 0 && max > 0 && (
          <div 
            className="absolute h-2 w-[1px] bg-zinc-600 top-1/2 -translate-y-1/2 pointer-events-none z-10"
            style={{ left: `${((0 - min) / (max - min)) * 100}%` }}
          />
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}

export default function Controls() {
  const intensity = useEditorStore(s => s.intensity);
  const grain = useEditorStore(s => s.grain);
  const softness = useEditorStore(s => s.softness);
  const halation = useEditorStore(s => s.halation);
  const vignette = useEditorStore(s => s.vignette);
  const exposure = useEditorStore(s => s.exposure);
  const contrast = useEditorStore(s => s.contrast);
  const saturation = useEditorStore(s => s.saturation);
  const temperature = useEditorStore(s => s.temperature);
  const highlights = useEditorStore(s => s.highlights);
  const shadows = useEditorStore(s => s.shadows);
  
  const setIntensity = useEditorStore(s => s.setIntensity);
  const setGrain = useEditorStore(s => s.setGrain);
  const setSoftness = useEditorStore(s => s.setSoftness);
  const setHalation = useEditorStore(s => s.setHalation);
  const setVignette = useEditorStore(s => s.setVignette);
  const setExposure = useEditorStore(s => s.setExposure);
  const setContrast = useEditorStore(s => s.setContrast);
  const setSaturation = useEditorStore(s => s.setSaturation);
  const setTemperature = useEditorStore(s => s.setTemperature);
  const setHighlights = useEditorStore(s => s.setHighlights);
  const setShadows = useEditorStore(s => s.setShadows);
  const resetAdjustments = useEditorStore(s => s.resetAdjustments);
  const applyFilmDefaults = useEditorStore(s => s.applyFilmDefaults);
  const selectedFilm = useEditorStore(s => s.selectedFilm);
  const activeTab = useEditorStore(s => s.activeControlTab);
  const setActiveTab = useEditorStore(s => s.setActiveControlTab);

  return (
    <div className="flex flex-col h-full bg-[#0d0d10] select-none">
      {/* Tab Switcher */}
      <div className="flex border-b border-white/10 bg-zinc-900/60 p-1.5 gap-1">
        <button
          onClick={() => setActiveTab('film')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
            activeTab === 'film'
              ? 'bg-zinc-800 text-white shadow-sm border border-white/10'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>FILM</span>
        </button>

        <button
          onClick={() => setActiveTab('tone')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
            activeTab === 'tone'
              ? 'bg-zinc-800 text-white shadow-sm border border-white/10'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>TONE</span>
        </button>

        <button
          onClick={() => setActiveTab('effects')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
            activeTab === 'effects'
              ? 'bg-zinc-800 text-white shadow-sm border border-white/10'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>OPTICS</span>
        </button>
      </div>

      {/* Sliders Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* TAB 1: FILM PROFILE & EMULATION */}
        {activeTab === 'film' && (
          <div className="space-y-5">
            {selectedFilm ? (
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase">
                      ACTIVE FILM PROFILE
                    </span>
                    <h3 className="text-sm font-bold font-mono text-white mt-0.5">
                      {selectedFilm.name}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/10">
                    {selectedFilm.category}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {selectedFilm.description}
                </p>

                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>PRESET GRAIN: {Math.round(selectedFilm.grain * 100)}%</span>
                  <button
                    onClick={() => applyFilmDefaults(selectedFilm)}
                    className="text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-zinc-800 text-center space-y-2">
                <Film className="w-6 h-6 text-zinc-600 mx-auto" />
                <div className="text-xs font-mono text-zinc-400">NO FILM STOCK SELECTED</div>
                <p className="text-[11px] text-zinc-600">Select any film stock from the left browser to apply authentic color profiles.</p>
              </div>
            )}

            <SliderRow
              label="LUT Intensity"
              icon={<Sliders className="w-3.5 h-3.5" />}
              value={intensity}
              min={0}
              max={100}
              defaultValue={100}
              unit="%"
              onChange={setIntensity}
            />

            <div className="pt-3 border-t border-zinc-800/60 space-y-4">
              <span className="text-[10px] font-mono text-zinc-500 tracking-wider">
                FILM CHARACTERISTICS
              </span>
              <SliderRow
                label="Grain Texture"
                icon={<Sparkles className="w-3.5 h-3.5" />}
                value={grain}
                min={0}
                max={100}
                defaultValue={0}
                unit="%"
                onChange={setGrain}
              />
              <SliderRow
                label="Halation Glow"
                icon={<Flame className="w-3.5 h-3.5" />}
                value={halation}
                min={0}
                max={100}
                defaultValue={0}
                unit="%"
                onChange={setHalation}
              />
              <SliderRow
                label="Lens Vignette"
                icon={<CircleDot className="w-3.5 h-3.5" />}
                value={vignette}
                min={0}
                max={100}
                defaultValue={0}
                unit="%"
                onChange={setVignette}
              />
            </div>
          </div>
        )}

        {/* TAB 2: TONE & EXPOSURE */}
        {activeTab === 'tone' && (
          <div className="space-y-4">
            <SliderRow
              label="Exposure"
              icon={<Sun className="w-3.5 h-3.5" />}
              value={exposure}
              min={-100}
              max={100}
              defaultValue={0}
              formatValue={(v) => `${v > 0 ? '+' : ''}${(v / 50).toFixed(2)} EV`}
              onChange={setExposure}
            />

            <SliderRow
              label="Contrast"
              icon={<Contrast className="w-3.5 h-3.5" />}
              value={contrast}
              min={-100}
              max={100}
              defaultValue={0}
              unit="%"
              onChange={setContrast}
            />

            <SliderRow
              label="Highlights"
              icon={<Sun className="w-3.5 h-3.5" />}
              value={highlights}
              min={-100}
              max={100}
              defaultValue={0}
              unit="%"
              onChange={setHighlights}
            />

            <SliderRow
              label="Shadows"
              icon={<Layers className="w-3.5 h-3.5" />}
              value={shadows}
              min={-100}
              max={100}
              defaultValue={0}
              unit="%"
              onChange={setShadows}
            />
          </div>
        )}

        {/* TAB 3: COLOR & OPTICS */}
        {activeTab === 'effects' && (
          <div className="space-y-4">
            <SliderRow
              label="Saturation"
              icon={<Palette className="w-3.5 h-3.5" />}
              value={saturation}
              min={-100}
              max={100}
              defaultValue={0}
              unit="%"
              onChange={setSaturation}
            />

            <SliderRow
              label="Color Temp"
              icon={<Flame className="w-3.5 h-3.5" />}
              value={temperature}
              min={-100}
              max={100}
              defaultValue={0}
              unit="%"
              onChange={setTemperature}
            />

            <SliderRow
              label="Softness / Bloom"
              icon={<Sparkles className="w-3.5 h-3.5" />}
              value={softness}
              min={0}
              max={100}
              defaultValue={0}
              unit="%"
              onChange={setSoftness}
            />

            <SliderRow
              label="Halation Glow"
              icon={<Flame className="w-3.5 h-3.5" />}
              value={halation}
              min={0}
              max={100}
              defaultValue={0}
              unit="%"
              onChange={setHalation}
            />

            <SliderRow
              label="Grain Texture"
              icon={<Sparkles className="w-3.5 h-3.5" />}
              value={grain}
              min={0}
              max={100}
              defaultValue={0}
              unit="%"
              onChange={setGrain}
            />

            <SliderRow
              label="Lens Vignette"
              icon={<CircleDot className="w-3.5 h-3.5" />}
              value={vignette}
              min={0}
              max={100}
              defaultValue={0}
              unit="%"
              onChange={setVignette}
            />
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="p-3 border-t border-white/10 bg-zinc-900/40">
        <button
          onClick={resetAdjustments}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-mono font-medium text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/10 rounded-lg transition-all active:scale-98 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET ALL ADJUSTMENTS</span>
        </button>
      </div>
    </div>
  );
}
