'use client';

import React, { useState, useCallback } from 'react';
import Header from '@/components/editor/Header';
import FilmBrowser from '@/components/editor/FilmBrowser';
import Controls from '@/components/editor/Controls';
import EditorCanvas from '@/components/editor/Canvas';
import { useEditorStore } from '@/lib/store';
import { isRawOrHeicFile, decodeCameraRawOrHeic } from '@/lib/raw-decoder';
import { 
  ChevronLeft, 
  ChevronRight, 
  Film, 
  SlidersHorizontal, 
  UploadCloud,
  X
} from 'lucide-react';

type MobilePanel = 'none' | 'films' | 'controls';

export default function Home() {
  const [showFilmPanel, setShowFilmPanel] = useState(true);
  const [showControlPanel, setShowControlPanel] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('none');
  const [isDragOver, setIsDragOver] = useState(false);

  const image = useEditorStore(s => s.image);
  const setImage = useEditorStore(s => s.setImage);
  const setIsLoading = useEditorStore(s => s.setIsLoading);
  const selectedFilm = useEditorStore(s => s.selectedFilm);
  const rawFormat = useEditorStore(s => s.rawFormat);

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
        className="h-[100dvh] flex flex-col bg-[#08080a] text-zinc-100 overflow-hidden font-sans"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Header />
        
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Panel: Film Browser (Desktop) */}
          <aside 
            className={`hidden md:flex flex-col flex-shrink-0 border-r border-white/10 bg-[#0d0d10] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden z-20 ${
              showFilmPanel ? 'w-80 opacity-100' : 'w-0 opacity-0 border-r-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 bg-zinc-900/40">
              <div className="flex items-center gap-2">
                <Film className="w-3.5 h-3.5 text-amber-500" />
                <h2 className="text-xs font-bold font-mono tracking-wider text-zinc-200">
                  FILM STOCKS
                </h2>
              </div>
              <button
                onClick={() => setShowFilmPanel(false)}
                title="Collapse Film Browser"
                className="text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <FilmBrowser />
            </div>
          </aside>

          {/* Collapsed Left Panel Toggle Rail */}
          {!showFilmPanel && (
            <button
              onClick={() => setShowFilmPanel(true)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white p-2 rounded-r-xl border-y border-r border-white/15 shadow-xl transition-all duration-200 hidden md:flex items-center gap-1 cursor-pointer group"
              title="Expand Film Browser"
            >
              <Film className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Main Viewfinder Canvas Area */}
          <main className="flex-1 flex flex-col min-w-0 relative">
            <div className="flex-1 relative overflow-hidden">
              <EditorCanvas />

              {/* Drag & Drop Visual Overlay */}
              {isDragOver && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-40 flex items-center justify-center p-8 pointer-events-none animate-fadeIn">
                  <div className="w-full max-w-md border-2 border-dashed border-amber-500/80 rounded-3xl p-10 text-center space-y-4 bg-amber-950/10 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center text-amber-400 animate-bounce">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold font-mono text-white tracking-wider">
                        DROP TO LOAD PHOTO OR CAMERA RAW
                      </h3>
                      <p className="text-xs font-mono text-zinc-400">
                        Supports Camera RAW (CR2, CR3, ARW, NEF, RAF, DNG), Apple HEIC, JPEG, PNG
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Technical Status HUD */}
            <div className="h-7 border-t border-white/10 bg-[#0d0d10]/95 px-4 flex items-center justify-between text-[10px] font-mono text-zinc-500 select-none flex-shrink-0">
              <div className="flex items-center gap-3">
                {image && (
                  <>
                    <span className="text-zinc-400">{image.naturalWidth} × {image.naturalHeight} PX</span>
                    <span className="text-zinc-800">•</span>
                    {selectedFilm ? (
                      <span className="text-amber-400 flex items-center gap-1 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        {selectedFilm.name}
                      </span>
                    ) : (
                      <span className="text-zinc-500">RAW MATRIX</span>
                    )}
                    {rawFormat && (
                      <>
                        <span className="text-zinc-800">•</span>
                        <span className="text-zinc-300 font-semibold">{rawFormat.toUpperCase()}</span>
                      </>
                    )}
                    <span className="text-zinc-800">•</span>
                    <span className="text-zinc-400">GLSL 300 ES (GPU)</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4 text-zinc-600">
                <span className="hidden sm:inline">SHORTCUTS: [SPACE] COMPARE • [O] OPEN • [E] EXPORT</span>
              </div>
            </div>
          </main>

          {/* Right Panel: Controls (Desktop) */}
          <aside 
            className={`hidden md:flex flex-col flex-shrink-0 border-l border-white/10 bg-[#0d0d10] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden z-20 ${
              showControlPanel ? 'w-80 opacity-100' : 'w-0 opacity-0 border-l-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 bg-zinc-900/40">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
                <h2 className="text-xs font-bold font-mono tracking-wider text-zinc-200">
                  ADJUSTMENTS
                </h2>
              </div>
              <button
                onClick={() => setShowControlPanel(false)}
                title="Collapse Adjustments"
                className="text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Controls />
            </div>
          </aside>

          {/* Collapsed Right Panel Toggle Rail */}
          {!showControlPanel && (
            <button
              onClick={() => setShowControlPanel(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white p-2 rounded-l-xl border-y border-l border-white/15 shadow-xl transition-all duration-200 hidden md:flex items-center gap-1 cursor-pointer group"
              title="Expand Adjustments"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <SlidersHorizontal className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* Mobile Bottom Navigation Toolbar */}
        <div className="md:hidden border-t border-white/10 bg-[#0d0d10] flex items-center justify-around py-2 safe-area-bottom z-30">
          <button
            onClick={() => setMobilePanel(mobilePanel === 'films' ? 'none' : 'films')}
            className={`flex flex-col items-center gap-1 px-5 py-1 rounded-xl transition-all ${
              mobilePanel === 'films' ? 'text-amber-400 font-bold bg-zinc-800/80' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Film className="w-4 h-4" />
            <span className="text-[10px] font-mono">FILMS</span>
          </button>

          <button
            onClick={() => setMobilePanel(mobilePanel === 'controls' ? 'none' : 'controls')}
            className={`flex flex-col items-center gap-1 px-5 py-1 rounded-xl transition-all ${
              mobilePanel === 'controls' ? 'text-amber-400 font-bold bg-zinc-800/80' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-[10px] font-mono">ADJUST</span>
          </button>
        </div>

        {/* Mobile Slide-Up Drawer */}
        {mobilePanel !== 'none' && (
          <div className="md:hidden fixed inset-x-0 bottom-14 z-50 animate-slide-up">
            <div className="bg-[#0e0e12] border-t border-white/15 rounded-t-2xl shadow-2xl max-h-[75vh] overflow-hidden flex flex-col">
              {/* Drawer Grab Handle */}
              <div className="flex justify-center py-2.5 bg-zinc-900/60 border-b border-white/5">
                <div className="w-10 h-1 bg-zinc-600 rounded-full" />
              </div>

              {/* Close Button */}
              <button
                onClick={() => setMobilePanel('none')}
                className="absolute top-2 right-3 p-1.5 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              
              {mobilePanel === 'films' && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <FilmBrowser />
                </div>
              )}
              {mobilePanel === 'controls' && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <Controls />
                </div>
              )}
            </div>
          </div>
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
