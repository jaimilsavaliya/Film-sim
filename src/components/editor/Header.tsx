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
  ChevronDown,
  Frame,
  LayoutTemplate,
  Printer
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
  const openExportStudio = useEditorStore(s => s.openExportStudio);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

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
        if (image) openExportStudio('POLAROID');
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
  }, [showBeforeAfter, setShowBeforeAfter, image, isExporting, handleExport, toggleFullscreen, resetAdjustments, openExportStudio]);

  return (
    <header className="h-14 border-b border-white/20 bg-black flex items-center justify-between px-2.5 sm:px-4 z-30 flex-shrink-0 select-none">
      {/* SECTION 00 // Brand & Analog Identity */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="border border-white/30 bg-white/10 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white tracking-widest uppercase">
            00
          </div>
          <h1 className="text-xs sm:text-sm font-black tracking-widest text-white font-mono uppercase flex items-center gap-1.5 sm:gap-2">
            FILMSIM
            <span className="hidden sm:inline text-[9px] font-mono tracking-widest px-1.5 py-0.5 bg-white text-black font-extrabold uppercase">
              EDITORIAL LAB
            </span>
          </h1>
        </div>

        {/* Selected Film Indicator (Desktop & Tablet Landscape) */}
        {selectedFilm && (
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 border border-white/20 bg-[#0a0a0a] text-xs font-mono">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">[STOCK]</span>
            <span className="text-white font-bold uppercase tracking-wide truncate max-w-[200px]">{selectedFilm.name}</span>
            <span className="text-[9px] text-zinc-400 px-1.5 py-0.2 bg-zinc-900 border border-white/10 uppercase font-medium">
              {selectedFilm.category}
            </span>
          </div>
        )}
      </div>

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
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold font-mono tracking-wider text-white bg-black hover:bg-white hover:text-black border border-white/30 hover:border-white transition-colors duration-100 cursor-pointer active:scale-95"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">[+ LOAD RAW]</span>
        </button>

        {/* Compare Button */}
        {image && (
          <button
            onClick={() => setShowBeforeAfter(!showBeforeAfter)}
            title="Toggle Split Compare (Space or \)"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold font-mono tracking-wider border transition-colors duration-100 cursor-pointer active:scale-95 ${
              showBeforeAfter
                ? 'bg-white text-black border-white'
                : 'bg-black text-white hover:bg-white hover:text-black border-white/30 hover:border-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">[◧ COMPARE]</span>
          </button>
        )}

        {/* Reset Adjustments Button */}
        {image && (
          <button
            onClick={resetAdjustments}
            title="Reset Adjustments (R)"
            className="p-1.5 text-white bg-black hover:bg-white hover:text-black border border-white/30 hover:border-white transition-colors duration-100 cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
          className="hidden sm:flex p-1.5 text-white bg-black hover:bg-white hover:text-black border border-white/30 hover:border-white transition-colors duration-100 cursor-pointer active:scale-95"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Shortcuts / Help modal button (hidden on touch-only mobile devices) */}
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          title="Keyboard Shortcuts (?)"
          className="hidden md:flex p-1.5 text-white bg-black hover:bg-white hover:text-black border border-white/30 hover:border-white transition-colors duration-100 cursor-pointer active:scale-95"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        {/* Print & Export Studio Button Group */}
        {image && (
          <div className="relative flex items-center">
            <div className="inline-flex border border-white">
              <button
                onClick={() => openExportStudio('POLAROID')}
                title="Open Darkroom Print & Export Studio (E)"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold font-mono tracking-wider bg-white text-black hover:bg-zinc-200 transition-colors duration-100 cursor-pointer active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">[PRINT / EXPORT]</span>
                <span className="sm:hidden">[EXPORT]</span>
              </button>

              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                title="More Print Templates"
                className="px-1.5 sm:px-2 py-1.5 bg-white text-black border-l border-black/20 hover:bg-zinc-200 transition-colors duration-100 cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Export Dropdown */}
            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowExportMenu(false)} 
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-black border-2 border-white shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] p-2 z-40 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest border-b border-white/15">
                    SECTION 04 // PRINT ARCHIVE
                  </div>
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      openExportStudio('POLAROID');
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-mono font-bold text-white hover:bg-white hover:text-black transition-colors cursor-pointer text-left"
                  >
                    <Frame className="w-3.5 h-3.5" />
                    <div>
                      <div>[01] POLAROID & INSTAX</div>
                      <div className="text-[10px] text-zinc-400 group-hover:text-black">1:1 & Wide Instant Prints</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      openExportStudio('POSTER');
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-mono font-bold text-white hover:bg-white hover:text-black transition-colors cursor-pointer text-left"
                  >
                    <LayoutTemplate className="w-3.5 h-3.5" />
                    <div>
                      <div>[02] EXHIBITION POSTER</div>
                      <div className="text-[10px] text-zinc-400 group-hover:text-black">Museum Typography & Swatch</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      openExportStudio('FILM_STRIP');
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-mono font-bold text-white hover:bg-white hover:text-black transition-colors cursor-pointer text-left"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <div>
                      <div>[03] 35MM CONTACT STRIP</div>
                      <div className="text-[10px] text-zinc-400 group-hover:text-black">Multi-Frame Sprocket Roll</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      openExportStudio('RAW_FRAME');
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-mono font-bold text-white hover:bg-white hover:text-black transition-colors cursor-pointer text-left"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <div>
                      <div>[04] FULL-BLEED NEGATIVE</div>
                      <div className="text-[10px] text-zinc-400 group-hover:text-black">Full 1:1 Graded Negative</div>
                    </div>
                  </button>
                  <div className="border-t border-white/20 my-1" />
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      handleExport();
                    }}
                    disabled={isExporting}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-mono font-bold text-zinc-300 hover:bg-white hover:text-black transition-colors cursor-pointer text-left"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <div>
                      <div>[DIRECT PNG DOWNLOAD]</div>
                      <div className="text-[10px] text-zinc-500 group-hover:text-black">Direct Full-Resolution Canvas</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Dialog */}
      {showShortcuts && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowShortcuts(false)}
        >
          <div 
            className="w-full max-w-sm bg-black border-2 border-white p-5 shadow-[12px_12px_0px_0px_rgba(255,255,255,0.25)] space-y-4 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="corner-bracket-tl" />
            <div className="corner-bracket-tr" />
            <div className="corner-bracket-bl" />
            <div className="corner-bracket-br" />

            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-white" />
                <h3 className="text-xs font-black font-mono tracking-widest text-white uppercase">
                  INDEX // KEYBOARD SHORTCUTS
                </h3>
              </div>
              <button 
                onClick={() => setShowShortcuts(false)}
                className="text-white hover:bg-white hover:text-black text-xs font-mono px-2 py-0.5 border border-white/30"
              >
                [ESC]
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                <span className="text-zinc-400">Toggle Compare</span>
                <kbd className="px-2 py-0.5 bg-white text-black font-bold border border-white">SPACE / \</kbd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                <span className="text-zinc-400">Load Image / Camera RAW</span>
                <kbd className="px-2 py-0.5 bg-white text-black font-bold border border-white">O</kbd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                <span className="text-zinc-400">Print & Export Studio</span>
                <kbd className="px-2 py-0.5 bg-white text-black font-bold border border-white">E / CTRL+S</kbd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                <span className="text-zinc-400">Toggle Fullscreen</span>
                <kbd className="px-2 py-0.5 bg-white text-black font-bold border border-white">F</kbd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                <span className="text-zinc-400">Reset Adjustments</span>
                <kbd className="px-2 py-0.5 bg-white text-black font-bold border border-white">R</kbd>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-zinc-400">Command Glossary</span>
                <kbd className="px-2 py-0.5 bg-white text-black font-bold border border-white">?</kbd>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-zinc-500 text-center font-mono uppercase tracking-widest border-t border-white/15">
              FILMSIM // 295 AUTHENTIC 3D LUTS ARCHIVE
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
