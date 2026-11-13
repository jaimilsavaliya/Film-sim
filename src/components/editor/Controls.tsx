'use client';

import React from 'react';
import { useEditorStore } from '@/lib/store';
import { 
  Sun, 
  Contrast, 
  Sparkles, 
  RotateCcw, 
  SlidersHorizontal,
  Flame,
  CircleDot,
  Palette,
  Film,
  Layers
} from 'lucide-react';

interface SliderRowProps {
  numberTag: string;
  label: string;
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
  numberTag,
  label,
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
    <div className="p-2 border border-white/10 hover:border-white/30 bg-[#080808] transition-colors space-y-1.5 group">
      <div className="flex items-center justify-between text-xs font-mono">
        <label 
          onDoubleClick={() => onChange(defaultValue)}
          title="Double-click to reset to default"
          className="flex items-center gap-1.5 text-zinc-300 group-hover:text-white transition-colors cursor-pointer select-none"
        >
          <span className="text-[10px] font-bold text-zinc-500 font-mono">[{numberTag}]</span>
          <span className="font-bold uppercase tracking-wider text-[11px]">{label}</span>
        </label>
        <span 
          onDoubleClick={() => onChange(defaultValue)}
          title="Double-click to reset"
          className={`px-1.5 py-0.2 border text-[10px] font-mono font-bold cursor-pointer transition-colors ${
            value !== defaultValue 
              ? 'text-black bg-white border-white' 
              : 'text-zinc-400 bg-black border-white/20'
          }`}
        >
          {displayVal}
        </span>
      </div>

      <div className="relative flex items-center pt-0.5">
        {/* Zero indicator line for bipolar sliders */}
        {min < 0 && max > 0 && (
          <div 
            className="absolute h-2.5 w-[1px] bg-white/40 top-1/2 -translate-y-1/2 pointer-events-none z-10"
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
    <div className="flex flex-col h-full bg-black select-none text-white font-mono">
      {/* Numbered Tab Switcher */}
      <div className="flex border-b border-white/20 bg-[#050505] p-2 gap-1.5 shrink-0">
        <button
          onClick={() => setActiveTab('film')}
          className={`flex-1 flex items-center justify-center py-2 text-[11px] font-mono font-bold tracking-wider transition-colors cursor-pointer border active:scale-98 ${
            activeTab === 'film'
              ? 'bg-white text-black border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)]'
              : 'bg-black text-zinc-400 hover:text-white border-white/15 hover:border-white/40'
          }`}
        >
          <span>[01 // MASTER]</span>
        </button>

        <button
          onClick={() => setActiveTab('tone')}
          className={`flex-1 flex items-center justify-center py-2 text-[11px] font-mono font-bold tracking-wider transition-colors cursor-pointer border active:scale-98 ${
            activeTab === 'tone'
              ? 'bg-white text-black border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)]'
              : 'bg-black text-zinc-400 hover:text-white border-white/15 hover:border-white/40'
          }`}
        >
          <span>[02 // TONE]</span>
        </button>

        <button
          onClick={() => setActiveTab('effects')}
          className={`flex-1 flex items-center justify-center py-2 text-[11px] font-mono font-bold tracking-wider transition-colors cursor-pointer border active:scale-98 ${
            activeTab === 'effects'
              ? 'bg-white text-black border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)]'
              : 'bg-black text-zinc-400 hover:text-white border-white/15 hover:border-white/40'
          }`}
        >
          <span>[03 // OPTICS]</span>
        </button>
      </div>

      {/* Active Tab Sliders Content */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {/* TAB 01: FILM EMULSION & MASTER */}
        {activeTab === 'film' && (
          <div className="space-y-2">
            {/* Active Stock Information Register */}
            {selectedFilm ? (
              <div className="flex items-center justify-between px-2.5 py-1.5 border border-white/20 bg-[#080808] text-xs font-mono">
                <div className="truncate min-w-0 pr-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mr-1.5">[PROFILE]</span>
                  <span className="text-white font-bold uppercase tracking-wide truncate">{selectedFilm.name}</span>
                </div>
                <button
                  onClick={() => applyFilmDefaults(selectedFilm)}
                  className="text-[9px] font-mono font-bold uppercase tracking-wider text-white hover:underline cursor-pointer flex-shrink-0"
                >
                  [RESTORE]
                </button>
              </div>
            ) : (
              <div className="p-2 border border-white/10 bg-[#050505] text-[10px] font-mono text-zinc-400 text-center uppercase tracking-widest">
                [NO EMULSION SELECTED // PASS-THROUGH]
              </div>
            )}

            <div className="space-y-1.5 pt-0.5">
              <SliderRow
                numberTag="01"
                label="Emulsion Intensity"
                value={intensity}
                min={0}
                max={100}
                defaultValue={100}
                unit="%"
                onChange={setIntensity}
              />
              <SliderRow
                numberTag="02"
                label="Halide Grain Size"
                value={grain}
                min={0}
                max={100}
                defaultValue={0}
                unit="%"
                onChange={setGrain}
              />
              <SliderRow
                numberTag="03"
                label="Optical Bloom"
                value={softness}
                min={0}
                max={100}
                defaultValue={0}
                unit="%"
                onChange={setSoftness}
              />
              <SliderRow
                numberTag="04"
                label="Halation Glow"
                value={halation}
                min={0}
                max={100}
                defaultValue={0}
                unit="%"
                onChange={setHalation}
              />
              <SliderRow
                numberTag="05"
                label="Aperture Vignette"
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

        {/* TAB 02: TONE & EXPOSURE LATITUDE */}
        {activeTab === 'tone' && (
          <div className="space-y-1.5">
            <SliderRow
              numberTag="01"
              label="Exposure Latitude"
              value={exposure}
              min={-100}
              max={100}
              defaultValue={0}
              formatValue={(v) => `${v > 0 ? '+' : ''}${(v / 50).toFixed(2)} EV`}
              onChange={setExposure}
            />

            <SliderRow
              numberTag="02"
              label="Density Contrast"
              value={contrast}
              min={-100}
              max={100}
              defaultValue={0}
              unit="%"
              onChange={setContrast}
            />

            <SliderRow
              numberTag="03"
              label="Shoulder / Highlights"
              value={highlights}
              min={-100}
              max={100}
              defaultValue={0}
              unit="%"
              onChange={setHighlights}
            />

            <SliderRow
              numberTag="04"
              label="Toe / Shadow Density"
              value={shadows}
              min={-100}
              max={100}
              defaultValue={0}
              unit="%"
              onChange={setShadows}
            />
          </div>
        )}

        {/* TAB 03: COLOR & OPTICS */}
        {activeTab === 'effects' && (
          <div className="space-y-1.5">
            <SliderRow
              numberTag="01"
              label="Chromatic Saturation"
              value={saturation}
              min={-100}
              max={100}
              defaultValue={0}
              unit="%"
              onChange={setSaturation}
            />

            <SliderRow
              numberTag="02"
              label="Kelvin Color Temp"
              value={temperature}
              min={-100}
              max={100}
              defaultValue={0}
              unit="%"
              onChange={setTemperature}
            />

            <SliderRow
              numberTag="03"
              label="Optical Diffusion"
              value={softness}
              min={0}
              max={100}
              defaultValue={0}
              unit="%"
              onChange={setSoftness}
            />

            <SliderRow
              numberTag="04"
              label="Halation Fringe"
              value={halation}
              min={0}
              max={100}
              defaultValue={0}
              unit="%"
              onChange={setHalation}
            />

            <SliderRow
              numberTag="05"
              label="Silver Grain Noise"
              value={grain}
              min={0}
              max={100}
              defaultValue={0}
              unit="%"
              onChange={setGrain}
            />

            <SliderRow
              numberTag="06"
              label="Optical Falloff"
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
      <div className="p-2.5 border-t border-white/20 bg-[#050505]">
        <button
          onClick={resetAdjustments}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-mono font-black uppercase tracking-wider text-white bg-black hover:bg-white hover:text-black border border-white/30 hover:border-white transition-colors duration-100 cursor-pointer active:scale-98"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>[↺ RESET ALL PARAMETERS]</span>
        </button>
      </div>
    </div>
  );
}
