'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { isRawOrHeicFile, decodeCameraRawOrHeic } from '@/lib/raw-decoder';
import { 
  Upload, 
  Download, 
  Eye, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  HelpCircle,
  Film,
  Camera,
  Check,
  Cpu
} from 'lucide-react';

export default function Header() {
  const image = useEditorStore(s => s.image);
  const setImage = useEditorStore(s => s.setImage);
  const rawFormat = useEditorStore(s => s.rawFormat);
  const selectedFilm = useEditorStore(s => s.selectedFilm);
  const showBeforeAfter = useEditorStore(s => s.showBeforeAfter);
  const setShowBeforeAfter = useEditorStore(s => s.setShowBeforeAfter);
  const setIsLoading = useEditorStore(s => s.setIsLoading);
  const isExporting = useEditorStore(s => s.isExporting);
  const setIsExporting = useEditorStore(s => s.setIsExporting);
  const resetAdjustments = useEditorStore(s => s.resetAdjustments);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreenchange
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // File selection with Camera RAW and HEIC support
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);

    if (isRawOrHeicFile(file)) {
      try {
        const { img, url, format } = await decodeCameraRawOrHeic(file);
        setImage(img, url, format);
        setIsLoading(false);
        return;
      } catch (err: unknown) {
        console.error('Failed to decode camera RAW/HEIC file:', err);
        setIsLoading(false);
        alert(err instanceof Error ? err.message : 'Failed to decode RAW file.');
        return;
      }
    }

    // Standard web image decoding (JPEG, PNG, WebP)
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage(img, url, 'Standard Image');
      setIsLoading(false);
    };
    img.onerror = () => {
      setIsLoading(false);
      alert('Failed to load image file.');
    };
    img.src = url;
  }, [setImage, setIsLoading]);

  // Export high resolution PNG
  const handleExport = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    setIsExporting(true);
    
    setTimeout(() => {
      canvas.toBlob((blob) => {
        if (!blob) {
          setIsExporting(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filmName = selectedFilm ? selectedFilm.id : 'original';
        a.download = `filmsim-${filmName}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 2500);
      }, 'image/png', 1.0);
    }, 50);
  }, [setIsExporting, selectedFilm]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === ' ' || e.key === '\\') {
        e.preventDefault();
        setShowBeforeAfter(!showBeforeAfter);
      } else if (e.key.toLowerCase() === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
      } else if (e.key.toLowerCase() === 'e' || (e.ctrlKey && e.key.toLowerCase() === 's')) {
        e.preventDefault();
        if (image && !isExporting) handleExport();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        resetAdjustments();
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(s => !s);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showBeforeAfter, setShowBeforeAfter, image, isExporting, handleExport, toggleFullscreen, resetAdjustments]);

  return (
    <header className="h-14 border-b border-white/10 bg-[#0d0d10]/90 backdrop-blur-md flex items-center justify-between px-4 z-30 flex-shrink-0">
      {/* Brand & Analog Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Classic Leica Red Dot indicator */}
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.85)] animate-pulse" />
          <h1 className="text-sm font-bold tracking-widest text-zinc-100 font-mono flex items-center gap-1.5">
            FILMSIM
            <span className="hidden sm:inline text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/10 font-medium">
              35MM • M-SYSTEM
            </span>
          </h1>
        </div>

        {/* Selected Film Indicator */}
        {selectedFilm && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-white/10 text-xs font-mono">
            <Film className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-zinc-200 font-medium">{selectedFilm.name}</span>
            <span className="text-[10px] text-zinc-500 px-1 py-0.2 rounded bg-zinc-800">
              {selectedFilm.category}
            </span>
          </div>
        )}
      </div>

      {/* Center HUD Metadata (Desktop) */}
      {image && (
        <div className="hidden md:flex items-center gap-3 px-3 py-1 rounded-full bg-zinc-900/80 border border-white/10 text-[11px] font-mono text-zinc-400">
          <span className="text-amber-500 font-semibold flex items-center gap-1">
            <Camera className="w-3 h-3 inline" />
            EXP 01/36
          </span>
          <span className="text-zinc-700">•</span>
          <span>{image.naturalWidth} × {image.naturalHeight} PX</span>
          {rawFormat && (
            <>
              <span className="text-zinc-700">•</span>
              <span className="text-amber-300 font-semibold px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30">
                {rawFormat.toUpperCase()}
              </span>
            </>
          )}
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-300">WEBGL2 3D LUT</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Hidden File Input supporting Standard, RAW, and HEIC */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,.cr2,.cr3,.arw,.srf,.sr2,.nef,.nrw,.raf,.dng,.orf,.rw2,.pef,.3fr,.iiq"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Open Photo or Camera RAW (O)"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/10 rounded-lg transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline font-mono text-[11px]">UPLOAD RAW / IMG</span>
        </button>

        {/* Compare Button */}
        {image && (
          <button
            onClick={() => setShowBeforeAfter(!showBeforeAfter)}
            title="Toggle Split Compare (Space or \)"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 active:scale-95 cursor-pointer ${
              showBeforeAfter
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 border-white/10'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono text-[11px]">COMPARE</span>
          </button>
        )}

        {/* Reset Adjustments Button */}
        {image && (
          <button
            onClick={resetAdjustments}
            title="Reset Adjustments (R)"
            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700/80 border border-white/10 rounded-lg transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
          className="hidden sm:flex p-1.5 text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700/80 border border-white/10 rounded-lg transition-all duration-150 active:scale-95 cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Shortcuts / Help modal button */}
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          title="Keyboard Shortcuts (?)"
          className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700/80 border border-white/10 rounded-lg transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        {/* Export Button */}
        {image && (
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50 ${
              exportSuccess
                ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold shadow-[0_0_14px_rgba(245,158,11,0.35)]'
            }`}
          >
            {isExporting ? (
              <div className="w-3.5 h-3.5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            ) : exportSuccess ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span className="font-mono text-[11px] tracking-wide">
              {exportSuccess ? 'SAVED' : 'EXPORT'}
            </span>
          </button>
        )}
      </div>

      {/* Keyboard Shortcuts Dialog */}
      {showShortcuts && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowShortcuts(false)}
        >
          <div 
            className="w-full max-w-sm bg-zinc-900 border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <h3 className="text-sm font-bold font-mono tracking-wider text-white">KEYBOARD SHORTCUTS</h3>
              </div>
              <button 
                onClick={() => setShowShortcuts(false)}
                className="text-zinc-500 hover:text-white text-xs font-mono px-2 py-0.5 rounded bg-zinc-800"
              >
                ESC
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Toggle Compare</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">Space / \</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Upload Image</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">O</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Export High-Res PNG</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">E / Ctrl+S</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Toggle Fullscreen</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">F</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Reset Adjustments</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">R</kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-400">Toggle Help</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">?</kbd>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-zinc-500 text-center font-mono">
              FILMSIM v0.1 • 295 AUTHENTIC 3D LUTS
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
