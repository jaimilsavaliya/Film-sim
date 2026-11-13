'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Header from '@/components/editor/Header';
import FilmBrowser from '@/components/editor/FilmBrowser';
import Controls from '@/components/editor/Controls';
import EditorCanvas from '@/components/editor/Canvas';
import ExportStudioModal from '@/components/editor/ExportStudioModal';
import { useEditorStore } from '@/lib/store';
import { isRawOrHeicFile, decodeCameraRawOrHeic } from '@/lib/raw-decoder';
import { parseExifFromFile } from '@/utils/exifParser';
import { ExportStockMetadata, defaultImageToCanvas } from '@/lib/export-renderer';
import { 
  ChevronLeft, 
  ChevronRight, 
  Film, 
  SlidersHorizontal, 
  UploadCloud,
  X,
  Eye
} from 'lucide-react';

type MobilePanel = 'none' | 'films' | 'controls';

export default function Home() {
  const [showFilmPanel, setShowFilmPanel] = useState(true);
  const [showControlPanel, setShowControlPanel] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('none');
  const [isDragOver, setIsDragOver] = useState(false);

  const showBeforeAfter = useEditorStore(s => s.showBeforeAfter);
  const setShowBeforeAfter = useEditorStore(s => s.setShowBeforeAfter);

  // Tablet responsiveness: On viewport < 1280px, collapse secondary panel by default to avoid canvas squeeze
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setShowControlPanel(false);
    }
  }, []);

  const handleToggleFilmPanel = useCallback((value?: boolean) => {
    setShowFilmPanel(prev => {
      const next = typeof value === 'boolean' ? value : !prev;
      if (next && typeof window !== 'undefined' && window.innerWidth < 1280) {
        setShowControlPanel(false);
      }
      return next;
    });
  }, []);

  const handleToggleControlPanel = useCallback((value?: boolean) => {
    setShowControlPanel(prev => {
      const next = typeof value === 'boolean' ? value : !prev;
      if (next && typeof window !== 'undefined' && window.innerWidth < 1280) {
        setShowFilmPanel(false);
      }
      return next;
    });
  }, []);

  const image = useEditorStore(s => s.image);
  const setImage = useEditorStore(s => s.setImage);
  const setIsLoading = useEditorStore(s => s.setIsLoading);
  const selectedFilm = useEditorStore(s => s.selectedFilm);
  const rawFormat = useEditorStore(s => s.rawFormat);
  const isExportStudioOpen = useEditorStore(s => s.isExportStudioOpen);
  const closeExportStudio = useEditorStore(s => s.closeExportStudio);
  const exportStudioInitialMode = useEditorStore(s => s.exportStudioInitialMode);
  const setParsedExif = useEditorStore(s => s.setParsedExif);
  const setQuartzDateText = useEditorStore(s => s.setQuartzDateText);

  // Map active FilmStock to ExportStockMetadata
  const stockMetadata: ExportStockMetadata | null = selectedFilm ? {
    id: selectedFilm.id,
    name: selectedFilm.name,
    brand: selectedFilm.name.split(' ')[0] || 'Film',
    iso: selectedFilm.name.match(/\d{2,4}/)?.[0] ? `ISO ${selectedFilm.name.match(/\d{2,4}/)![0]}` : 'ISO 400',
    process: selectedFilm.category === 'Black & White' ? 'Silver Halide B&W' : selectedFilm.category === 'Slide Film' ? 'E-6 Chrome' : selectedFilm.category === 'Cinema & Print' ? 'ECN-2 Cine' : 'C-41 Color Neg',
    characterNote: selectedFilm.description || 'Minimalist darkroom color grading & analog emulation',
  } : null;

  // Custom grading hook to capture the WebGL canvas pixels for export
  const gradeImageFn = useCallback((img: HTMLImageElement, maxDim: number) => {
    const mainCanvas = document.querySelector('canvas');
    if (img === image && mainCanvas && mainCanvas.width > 0 && mainCanvas.height > 0) {
      const offscreen = document.createElement('canvas');
      const scale = Math.min(1, maxDim / Math.max(mainCanvas.width, mainCanvas.height));
      offscreen.width = Math.max(1, Math.round(mainCanvas.width * scale));
      offscreen.height = Math.max(1, Math.round(mainCanvas.height * scale));
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.drawImage(mainCanvas, 0, 0, offscreen.width, offscreen.height);
        const overlayCanvas = document.querySelector('canvas[data-overlay="darkroom"]') as HTMLCanvasElement | null;
        if (overlayCanvas && overlayCanvas.width > 0 && overlayCanvas.height > 0) {
          ctx.drawImage(overlayCanvas, 0, 0, offscreen.width, offscreen.height);
        }
      }
      return offscreen;
    }
    return defaultImageToCanvas(img, maxDim);
  }, [image]);

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if leaving the main window
    if (!e.relatedTarget || (e.relatedTarget as HTMLElement).nodeName === 'HTML') {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    const isImage = file.type.startsWith('image/');
    const isRaw = isRawOrHeicFile(file);
    if (!isImage && !isRaw) return;
    
    setIsLoading(true);

    // Auto-extract real camera EXIF metadata from JPEG / TIFF
    parseExifFromFile(file).then((exif) => {
      setParsedExif(exif);
      if (exif.formattedDate) {
        setQuartzDateText(exif.formattedDate);
      }
    }).catch(() => {});

    if (isRaw) {
      try {
        const { img, url, format } = await decodeCameraRawOrHeic(file);
        setImage(img, url, format);
        setIsLoading(false);
        return;
      } catch (err: unknown) {
        console.error('Failed to decode camera RAW/HEIC drop:', err);
        setIsLoading(false);
        alert(err instanceof Error ? err.message : 'Failed to decode RAW file.');
        return;
      }
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage(img, url, 'Standard Image');
      setIsLoading(false);
    };
    img.onerror = () => {
      setIsLoading(false);
    };
    img.src = url;
  }, [setImage, setIsLoading]);

  return (
    <ErrorBoundary>
      <div 
        className="h-[100dvh] flex flex-col bg-black text-white overflow-hidden font-mono"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Header />
        
        <div className="flex-1 flex overflow-hidden relative">
          {/* Tablet Click-Outside Area (NO blur, NO dark overlay - image stays 100% visible) */}
          {(showFilmPanel || showControlPanel) && (
            <div 
              onClick={() => {
                setShowFilmPanel(false);
                setShowControlPanel(false);
              }}
              className="hidden md:max-xl:block fixed inset-0 z-20 pointer-events-auto"
            />
          )}

          {/* Left Panel: Film Browser (Desktop pinned / Tablet floating drawer) */}
          <aside 
            className={`hidden md:flex flex-col flex-shrink-0 border-r border-white/20 bg-black transition-all duration-200 ease-out overflow-hidden z-30 md:max-xl:absolute md:max-xl:inset-y-0 md:max-xl:left-0 md:max-xl:w-80 md:max-xl:shadow-[10px_0_40px_rgba(0,0,0,0.95)] ${
              showFilmPanel ? 'w-80 opacity-100' : 'w-0 opacity-0 border-r-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/20 bg-[#080808]">
              <div className="flex items-center gap-2">
                <div className="border border-white/30 bg-white/10 px-1 py-0.2 text-[9px] font-mono font-bold text-white tracking-widest">
                  01
                </div>
                <h2 className="text-xs font-black font-mono tracking-widest text-white uppercase">
                  EMULSION ARCHIVE
                </h2>
              </div>
              <button
                onClick={() => handleToggleFilmPanel(false)}
                title="Collapse Film Archive"
                className="text-white hover:bg-white hover:text-black p-1 border border-white/20 hover:border-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <FilmBrowser />
            </div>
          </aside>

          {/* Collapsed Left Panel Toggle Rail */}
          {!showFilmPanel && (
            <button
              onClick={() => handleToggleFilmPanel(true)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black hover:bg-white text-white hover:text-black p-2 border-y border-r border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] transition-colors duration-100 hidden md:flex items-center gap-1.5 cursor-pointer"
              title="Expand Emulsion Archive"
            >
              <span className="text-[10px] font-mono font-black uppercase tracking-widest">[01 // ARCHIVE]</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Main Viewfinder Canvas Area */}
          <main className="flex-1 flex flex-col min-w-0 relative bg-black overflow-hidden">
            {/* Viewport Canvas: Auto-fits visible space in real-time with zero blur */}
            <div className="flex-1 relative overflow-hidden min-h-0">
              <EditorCanvas />

              {/* Drag & Drop Visual Overlay */}
              {isDragOver && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-40 flex items-center justify-center p-8 pointer-events-none animate-fadeIn">
                  <div className="w-full max-w-md border-2 border-white p-10 text-center space-y-4 bg-black shadow-[12px_12px_0px_0px_rgba(255,255,255,0.4)] relative">
                    <div className="corner-bracket-tl" />
                    <div className="corner-bracket-tr" />
                    <div className="corner-bracket-bl" />
                    <div className="corner-bracket-br" />

                    <div className="w-16 h-16 border-2 border-white bg-black mx-auto flex items-center justify-center text-white">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                        [ 00 // VACANT DROP CARRIER ]
                      </div>
                      <h3 className="text-base font-black font-mono text-white tracking-widest uppercase">
                        DROP RAW FILE OR NEGATIVE SCAN
                      </h3>
                      <p className="text-xs font-mono text-zinc-400 uppercase">
                        CANON CR2/CR3 • SONY ARW • NIKON NEF • FUJI RAF • ADOBE DNG • APPLE HEIC • JPEG • PNG
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Docked Panel (Films / Adjust) */}
            {mobilePanel !== 'none' && (
              <div className="md:hidden flex flex-col border-t-2 border-white bg-black z-30 transition-all duration-200 animate-slide-up flex-shrink-0 h-[48dvh] max-h-[50dvh]">
                {/* Panel Header */}
                <div className="flex justify-between items-center px-3.5 py-1.5 bg-[#080808] border-b border-white/20 shrink-0">
                  <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">
                    {mobilePanel === 'films' ? '01 // EMULSION ARCHIVE' : '03 // OPTICAL PARAMETERS'}
                  </span>
                  <button
                    onClick={() => setMobilePanel('none')}
                    className="p-1 text-white border border-white/20 hover:bg-white hover:text-black cursor-pointer active:scale-95"
                    title="Close Panel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  {mobilePanel === 'films' && <FilmBrowser />}
                  {mobilePanel === 'controls' && <Controls />}
                </div>
              </div>
            )}

            {/* Bottom Technical Status HUD (Desktop & Tablet) */}
            <div className="hidden md:flex h-8 border-t border-white/20 bg-black px-4 items-center justify-between text-[10px] font-mono text-zinc-400 select-none flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-white font-bold tracking-widest">[00 // TELEMETRY]</span>
                <span className="text-zinc-600">//</span>
                {image ? (
                  <>
                    <span className="text-white font-semibold">{image.naturalWidth} × {image.naturalHeight} PX</span>
                    <span className="text-zinc-600">//</span>
                    {selectedFilm ? (
                      <span className="text-white font-bold bg-white/10 px-1.5 py-0.2 border border-white/20 uppercase">
                        {selectedFilm.name}
                      </span>
                    ) : (
                      <span className="text-zinc-500">[RAW MATRIX]</span>
                    )}
                    {rawFormat && (
                      <>
                        <span className="text-zinc-600">//</span>
                        <span className="text-white font-bold">{rawFormat.toUpperCase()}</span>
                      </>
                    )}
                    <span className="text-zinc-600">//</span>
                    <span className="text-zinc-400">GLSL 300 ES (GPU)</span>
                  </>
                ) : (
                  <span className="text-zinc-500">[STANDBY // VACANT FRAME]</span>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-3 text-zinc-500 font-bold uppercase tracking-wider">
                <span>[SPACE] COMPARE</span>
                <span>•</span>
                <span>[O] LOAD</span>
                <span>•</span>
                <span>[E] EXPORT</span>
              </div>
            </div>
          </main>

          {/* Right Panel: Controls (Desktop pinned / Tablet floating drawer) */}
          <aside 
            className={`hidden md:flex flex-col flex-shrink-0 border-l border-white/20 bg-black transition-all duration-200 ease-out overflow-hidden z-30 md:max-xl:absolute md:max-xl:inset-y-0 md:max-xl:right-0 md:max-xl:w-80 md:max-xl:shadow-[-10px_0_40px_rgba(0,0,0,0.95)] ${
              showControlPanel ? 'w-80 opacity-100' : 'w-0 opacity-0 border-l-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/20 bg-[#080808]">
              <div className="flex items-center gap-2">
                <div className="border border-white/30 bg-white/10 px-1 py-0.2 text-[9px] font-mono font-bold text-white tracking-widest">
                  03
                </div>
                <h2 className="text-xs font-black font-mono tracking-widest text-white uppercase">
                  OPTICAL PARAMETERS
                </h2>
              </div>
              <button
                onClick={() => handleToggleControlPanel(false)}
                title="Collapse Parameters"
                className="text-white hover:bg-white hover:text-black p-1 border border-white/20 hover:border-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Controls />
            </div>
          </aside>

          {/* Collapsed Right Panel Toggle Rail */}
          {!showControlPanel && (
            <button
              onClick={() => handleToggleControlPanel(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black hover:bg-white text-white hover:text-black p-2 border-y border-l border-white shadow-[-4px_4px_0px_0px_rgba(255,255,255,0.3)] transition-colors duration-100 hidden md:flex items-center gap-1.5 cursor-pointer"
              title="Expand Parameters"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono font-black uppercase tracking-widest">[03 // PARAMS]</span>
            </button>
          )}
        </div>

        {/* Mobile Bottom Navigation Toolbar */}
        <div className="md:hidden border-t border-white/20 bg-black flex items-center justify-around px-3 py-2 safe-area-bottom z-30 font-mono">
          <button
            onClick={() => setMobilePanel(mobilePanel === 'films' ? 'none' : 'films')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 border transition-colors cursor-pointer ${
              mobilePanel === 'films' 
                ? 'bg-white text-black border-white font-bold shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)]' 
                : 'bg-black text-zinc-300 border-white/20 hover:border-white/40'
            }`}
          >
            <Film className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase tracking-widest">[01 // FILMS]</span>
          </button>

          {image && (
            <button
              onClick={() => setShowBeforeAfter(!showBeforeAfter)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 mx-2 border transition-colors cursor-pointer ${
                showBeforeAfter 
                  ? 'bg-white text-black border-white font-bold shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)]' 
                  : 'bg-black text-zinc-300 border-white/20 hover:border-white/40'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-widest">[◧ COMPARE]</span>
            </button>
          )}

          <button
            onClick={() => setMobilePanel(mobilePanel === 'controls' ? 'none' : 'controls')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 border transition-colors cursor-pointer ${
              mobilePanel === 'controls' 
                ? 'bg-white text-black border-white font-bold shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)]' 
                : 'bg-black text-zinc-300 border-white/20 hover:border-white/40'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase tracking-widest">[03 // ADJUST]</span>
          </button>
        </div>

        {/* Darkroom Print & Export Studio Modal */}
        {image && isExportStudioOpen && (
          <ExportStudioModal
            isOpen={isExportStudioOpen}
            onClose={closeExportStudio}
            primaryImage={image}
            primaryImageTitle={selectedFilm ? `${selectedFilm.name} Study` : '35mm Contact Study'}
            selectedStock={stockMetadata}
            initialMode={exportStudioInitialMode}
            gradeImageFn={gradeImageFn}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

// Global Error Boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-[#09090b] text-white p-8">
          <div className="max-w-md text-center p-6 rounded-2xl border border-red-500/30 bg-red-950/20 backdrop-blur-md">
            <h1 className="text-base font-bold font-mono text-red-400 mb-2">APPLICATION ERROR</h1>
            <p className="text-zinc-400 text-xs font-mono mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-mono tracking-wider transition-colors"
            >
              RELOAD WORKSPACE
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
