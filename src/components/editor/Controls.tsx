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
import { LiveRgbHistogramScope, CharacteristicToneCurve } from '@/utils/filmEngine';

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
  
  // Darkroom Add-ons State
  const histogram = useEditorStore(s => s.histogram);
  const pushPullStops = useEditorStore(s => s.pushPullStops);
  const setPushPullStops = useEditorStore(s => s.setPushPullStops);
  const curveShadowToe = useEditorStore(s => s.curveShadowToe);
  const setCurveShadowToe = useEditorStore(s => s.setCurveShadowToe);
  const curveMidtoneAnchor = useEditorStore(s => s.curveMidtoneAnchor);
  const setCurveMidtoneAnchor = useEditorStore(s => s.setCurveMidtoneAnchor);
  const curveHighlightShoulder = useEditorStore(s => s.curveHighlightShoulder);
  const setCurveHighlightShoulder = useEditorStore(s => s.setCurveHighlightShoulder);
  const splitShadowHue = useEditorStore(s => s.splitShadowHue);
  const setSplitShadowHue = useEditorStore(s => s.setSplitShadowHue);
  const splitShadowSat = useEditorStore(s => s.splitShadowSat);
  const setSplitShadowSat = useEditorStore(s => s.setSplitShadowSat);
  const splitHighlightHue = useEditorStore(s => s.splitHighlightHue);
  const setSplitHighlightHue = useEditorStore(s => s.setSplitHighlightHue);
  const splitHighlightSat = useEditorStore(s => s.splitHighlightSat);
  const setSplitHighlightSat = useEditorStore(s => s.setSplitHighlightSat);
  const chromaticAberration = useEditorStore(s => s.chromaticAberration);
  const setChromaticAberration = useEditorStore(s => s.setChromaticAberration);
  const lightLeakStyle = useEditorStore(s => s.lightLeakStyle);
  const setLightLeakStyle = useEditorStore(s => s.setLightLeakStyle);
  const lightLeakIntensity = useEditorStore(s => s.lightLeakIntensity);
  const setLightLeakIntensity = useEditorStore(s => s.setLightLeakIntensity);
  const quartzDateStamp = useEditorStore(s => s.quartzDateStamp);
  const setQuartzDateStamp = useEditorStore(s => s.setQuartzDateStamp);
  const quartzDateText = useEditorStore(s => s.quartzDateText);
  const setQuartzDateText = useEditorStore(s => s.setQuartzDateText);
  const zoneSystemOverlay = useEditorStore(s => s.zoneSystemOverlay);
  const setZoneSystemOverlay = useEditorStore(s => s.setZoneSystemOverlay);

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
      {/* Live RGB & Luminance Waveform Scope Header */}
      <LiveRgbHistogramScope histogram={histogram} />

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
              <SliderRow
                numberTag="06"
                label="Chemical Push / Pull Bath"
                value={pushPullStops}
                min={-1}
                max={3}
                step={0.1}
                defaultValue={0}
                formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} EV`}
                onChange={setPushPullStops}
              />
            </div>
          </div>
        )}

        {/* TAB 02: TONE & EXPOSURE LATITUDE */}
        {activeTab === 'tone' && (
          <div className="space-y-2">
            <CharacteristicToneCurve
              toe={curveShadowToe}
              mid={curveMidtoneAnchor}
              shoulder={curveHighlightShoulder}
              onReset={() => {
                setCurveShadowToe(0);
                setCurveMidtoneAnchor(0);
                setCurveHighlightShoulder(0);
              }}
            />

            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-0.5">
                EXPOSURE & DENSITY LATITUDE //
              </div>

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

            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-0.5">
                D-LOG-E SENSITOMETRY CURVE //
              </div>

              <SliderRow
                numberTag="05"
                label="Curve Shadow Toe"
                value={curveShadowToe}
                min={-50}
                max={50}
                defaultValue={0}
                unit="%"
                onChange={setCurveShadowToe}
              />

              <SliderRow
                numberTag="06"
                label="Curve Midtone Anchor"
                value={curveMidtoneAnchor}
                min={-50}
                max={50}
                defaultValue={0}
                unit="%"
                onChange={setCurveMidtoneAnchor}
              />

              <SliderRow
                numberTag="07"
                label="Curve Highlight Shoulder"
                value={curveHighlightShoulder}
                min={-50}
                max={50}
                defaultValue={0}
                unit="%"
                onChange={setCurveHighlightShoulder}
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-0.5">
                COLORHEAD SPLIT-TONING //
              </div>

              <SliderRow
                numberTag="08"
                label="Shadow Tint Hue"
                value={splitShadowHue}
                min={0}
                max={360}
                defaultValue={205}
                unit="°"
                onChange={setSplitShadowHue}
              />

              <SliderRow
                numberTag="09"
                label="Shadow Tint Saturation"
                value={splitShadowSat}
                min={0}
                max={100}
                defaultValue={0}
                unit="%"
                onChange={setSplitShadowSat}
              />

              <SliderRow
                numberTag="10"
                label="Highlight Tint Hue"
                value={splitHighlightHue}
                min={0}
                max={360}
                defaultValue={38}
                unit="°"
                onChange={setSplitHighlightHue}
              />

              <SliderRow
                numberTag="11"
                label="Highlight Tint Saturation"
                value={splitHighlightSat}
                min={0}
                max={100}
                defaultValue={0}
                unit="%"
                onChange={setSplitHighlightSat}
              />
            </div>
          </div>
        )}

        {/* TAB 03: COLOR & OPTICS */}
        {activeTab === 'effects' && (
          <div className="space-y-2">
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

              <SliderRow
                numberTag="07"
                label="Lateral Chromatic Aberration"
                value={chromaticAberration}
                min={0}
                max={100}
                defaultValue={0}
                unit="%"
                onChange={setChromaticAberration}
              />
            </div>

            {/* Organic Light Leaks */}
            <div className="p-2 border border-white/10 bg-[#080808] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold uppercase tracking-wider text-[11px] text-zinc-300">
                  <span className="text-[10px] font-bold text-zinc-500 font-mono mr-1.5">[08]</span>
                  Organic Camera Gate Light Leak
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(['NONE', 'AMBER_EDGE', 'CRIMSON_SPOOL', 'TUNGSTEN_STREAK'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setLightLeakStyle(style)}
                    className={`py-1 text-[9px] font-mono font-bold uppercase border transition-colors cursor-pointer ${
                      lightLeakStyle === style
                        ? 'bg-white text-black border-white'
                        : 'bg-black text-zinc-400 border-white/20 hover:text-white'
                    }`}
                  >
                    {style === 'NONE' ? 'OFF' : style.split('_')[0]}
                  </button>
                ))}
              </div>
              {lightLeakStyle !== 'NONE' && (
                <SliderRow
                  numberTag="08B"
                  label="Leak Exposure Strength"
                  value={lightLeakIntensity}
                  min={0}
                  max={100}
                  defaultValue={45}
                  unit="%"
                  onChange={setLightLeakIntensity}
                />
              )}
            </div>

            {/* 90s Quartz Date-Back Imprint */}
            <div className="p-2 border border-white/10 bg-[#080808] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-zinc-500 font-mono">[09]</span>
                  <span className="font-bold uppercase tracking-wider text-[11px] text-zinc-300">
                    90s Quartz LED Date Stamp
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={quartzDateStamp}
                  onChange={(e) => setQuartzDateStamp(e.target.checked)}
                  className="w-4 h-4 rounded-none border border-white/40 accent-white cursor-pointer"
                />
              </div>
              {quartzDateStamp && (
                <input
                  type="text"
                  value={quartzDateText}
                  onChange={(e) => setQuartzDateText(e.target.value)}
                  placeholder="'94 10 24"
                  className="w-full h-8 px-2.5 bg-black border border-white/30 text-xs font-mono text-amber-500 font-bold focus:outline-none focus:border-white uppercase"
                />
              )}
            </div>

            {/* Ansel Adams 11-Zone Diagnostic Map */}
            <div className="p-2 border border-white/10 bg-[#080808] flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-zinc-500 font-mono">[10]</span>
                  <span className="font-bold uppercase tracking-wider text-[11px] text-zinc-300">
                    Zone System Diagnostic Map
                  </span>
                </div>
                <div className="text-[9px] text-zinc-500 font-mono uppercase mt-0.5">
                  Ansel Adams 11-Zone False-Color Exposure
                </div>
              </div>
              <input
                type="checkbox"
                checked={zoneSystemOverlay}
                onChange={(e) => setZoneSystemOverlay(e.target.checked)}
                className="w-4 h-4 rounded-none border border-white/40 accent-white cursor-pointer"
              />
            </div>
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
