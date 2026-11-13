'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '@/lib/store';
import { FilmRenderer } from '@/lib/webgl/renderer';
import { loadCubeLUT, createIdentityLUT, type LUTData } from '@/lib/webgl/lut-loader';
import { isRawOrHeicFile, decodeCameraRawOrHeic } from '@/lib/raw-decoder';
import { Camera, Sparkles, UploadCloud } from 'lucide-react';

const MAX_PREVIEW_DIM = 2048;

function loadSampleImage(
  src: string, 
  setImage: (img: HTMLImageElement | null, url: string | null) => void,
  setIsLoading: (loading: boolean) => void
) {
  setIsLoading(true);
  const img = new Image();
  img.onload = () => {
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setImage(img, src);
    }
    setIsLoading(false);
  };
  img.onerror = () => {
    console.error('Failed to load sample image:', src);
    setIsLoading(false);
  };
  img.src = src;
}

export default function EditorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rendererRef = useRef<FilmRenderer | null>(null);
  const lutCache = useRef<Map<string, LUTData>>(new Map());
  const currentLutFile = useRef<string | null>(null);

  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const image = useEditorStore(s => s.image);
  const setImage = useEditorStore(s => s.setImage);
  const selectedFilm = useEditorStore(s => s.selectedFilm);
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
  const showBeforeAfter = useEditorStore(s => s.showBeforeAfter);
  const comparePosition = useEditorStore(s => s.comparePosition);
  const setComparePosition = useEditorStore(s => s.setComparePosition);
  const isLoading = useEditorStore(s => s.isLoading);
  const setIsLoading = useEditorStore(s => s.setIsLoading);

  // Helper to lazily initialize or retrieve the WebGL2 renderer
  const getOrCreateRenderer = useCallback(() => {
    if (rendererRef.current) return rendererRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return null;

    try {
      const renderer = new FilmRenderer(canvas);
      rendererRef.current = renderer;
      setHasError(false);
      setErrorMessage('');
      return renderer;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'WebGL2 not supported';
      console.error('Failed to initialize WebGL2 renderer:', msg);
      setHasError(true);
      setErrorMessage(msg);
      return null;
    }
  }, []);

  // Initialize WebGL2 renderer on mount
  useEffect(() => {
    getOrCreateRenderer();

    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, [getOrCreateRenderer]);

  // Update canvas size and reload image texture
  const updateCanvasDimensionsAndImage = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const renderer = rendererRef.current || getOrCreateRenderer();

    if (!canvas || !container || !image || !renderer) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) {
      requestAnimationFrame(updateCanvasDimensionsAndImage);
      return;
    }

    const imgW = image.naturalWidth || image.width;
    const imgH = image.naturalHeight || image.height;
    if (imgW === 0 || imgH === 0) {
      if (!image.complete) {
        image.onload = () => updateCanvasDimensionsAndImage();
      }
      return;
    }

    // Maintain aspect ratio inside the container with 32px padding
    const padding = 32;
    const availWidth = Math.max(100, containerRect.width - padding);
    const availHeight = Math.max(100, containerRect.height - padding);

    const imgAspect = imgW / imgH;
    const containerAspect = availWidth / availHeight;

    let displayWidth: number;
    let displayHeight: number;

    if (imgAspect > containerAspect) {
      displayWidth = availWidth;
      displayHeight = availWidth / imgAspect;
    } else {
      displayHeight = availHeight;
      displayWidth = availHeight * imgAspect;
    }

    // Cap render resolution for smooth performance
    const scale = Math.min(1, MAX_PREVIEW_DIM / Math.max(imgW, imgH));
    const renderWidth = Math.round(imgW * scale);
    const renderHeight = Math.round(imgH * scale);

    canvas.width = renderWidth;
    canvas.height = renderHeight;
    canvas.style.width = `${Math.round(displayWidth)}px`;
    canvas.style.height = `${Math.round(displayHeight)}px`;

    renderer.resize(renderWidth, renderHeight);
    renderer.loadImage(image);
    renderer.render();
  }, [image, getOrCreateRenderer]);

  // Update whenever image loads or container resizes (including sidebar and drawer toggles)
  useEffect(() => {
    if (!image) return;
    updateCanvasDimensionsAndImage();

    const container = containerRef.current;
    if (!container) return;

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateCanvasDimensionsAndImage();
      });
      resizeObserver.observe(container);
    }

    const handleResize = () => {
      updateCanvasDimensionsAndImage();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
    };
  }, [image, updateCanvasDimensionsAndImage]);

  // Load and apply selected Film LUT
  useEffect(() => {
    const renderer = rendererRef.current || getOrCreateRenderer();
    if (!renderer) return;

    if (!selectedFilm) {
      currentLutFile.current = null;
      renderer.loadLUT(createIdentityLUT(8));
      if (image) renderer.render();
      return;
    }

    const lutFile = selectedFilm.lut;
    if (currentLutFile.current === lutFile) {
      if (image) renderer.render();
      return;
    }

    // Use cached LUT if already downloaded
    if (lutCache.current.has(lutFile)) {
      currentLutFile.current = lutFile;
      renderer.loadLUT(lutCache.current.get(lutFile)!);
      if (image) renderer.render();
      return;
    }

    let active = true;
    setIsLoading(true);

    loadCubeLUT(`/luts/${lutFile}`)
      .then(lutData => {
        if (!active) return;
        lutCache.current.set(lutFile, lutData);
        currentLutFile.current = lutFile;
        renderer.loadLUT(lutData);
        if (image) renderer.render();
      })
      .catch(err => {
        console.error('Failed to load LUT:', lutFile, err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedFilm, image, getOrCreateRenderer, setIsLoading]);

  // Update render adjustment settings
  useEffect(() => {
    const renderer = rendererRef.current || getOrCreateRenderer();
    if (!renderer || !image) return;

    renderer.setSettings({
      intensity: selectedFilm ? intensity / 100 : 0.0,
      exposure: (exposure / 100) * 2.0,
      contrast: contrast / 100,
      highlights: highlights / 100,
      shadows: shadows / 100,
      saturation: saturation / 100,
      temperature: temperature / 100,
      grain: grain / 100,
      softness: softness / 100,
      halation: halation / 100,
      vignette: vignette / 100,
    });

    if (grain > 0) {
      renderer.startAnimation();
    } else {
      renderer.stopAnimation();
      renderer.render();
    }
  }, [
    image,
    selectedFilm,
    intensity,
    exposure,
    contrast,
    highlights,
    shadows,
    saturation,
    temperature,
    grain,
    softness,
    halation,
    vignette,
    getOrCreateRenderer,
  ]);

  // File selection directly from Canvas empty state
  const handleCanvasFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Compare slider dragging handlers
  const handleCompareMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }
    if (!containerRef.current || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pos = ((clientX - canvasRect.left) / canvasRect.width) * 100;
    setComparePosition(Math.max(0, Math.min(100, pos)));
  }, [setComparePosition]);

  return (
    <div 
      ref={containerRef}
      className={`viewfinder-grid relative w-full h-full flex items-center justify-center overflow-hidden select-none p-3 sm:p-4 ${
        showBeforeAfter ? 'touch-none' : ''
      }`}
      onMouseMove={isDragging ? handleCompareMove : undefined}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchMove={isDragging ? handleCompareMove : undefined}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* Hidden file input for direct canvas file selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.cr2,.cr3,.arw,.nef,.raf,.dng,.orf,.rw2,.pef,.heic,.heif"
        className="hidden"
        onChange={handleCanvasFileSelect}
      />

      {/* Central Viewfinder Crosshair */}
      {!image && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 pointer-events-none opacity-25 flex items-center justify-center z-0">
          <div className="w-full h-[1px] bg-white" />
          <div className="h-full w-[1px] bg-white absolute" />
        </div>
      )}

      {/* Empty State Welcome Card (Brutalist Editorial Carrier) */}
      {!image && (
        <div className="relative z-10 text-white text-center w-full max-w-lg max-h-[85vh] overflow-y-auto px-5 py-6 sm:px-8 sm:py-8 border-2 border-white bg-black shadow-[12px_12px_0px_0px_rgba(255,255,255,0.25)] space-y-4 sm:space-y-6 animate-fadeIn">
          <div className="corner-bracket-tl" />
          <div className="corner-bracket-tr" />
          <div className="corner-bracket-bl" />
          <div className="corner-bracket-br" />

          {/* Icon / Carrier Header */}
          <div className="space-y-2">
            <div className="inline-block px-2 py-0.5 border border-white/30 text-[10px] font-mono font-bold tracking-widest uppercase text-zinc-400 bg-white/5">
              [ 00 // VACANT NEGATIVE CARRIER ]
            </div>
            <h2 className="text-xl font-black font-mono tracking-tight text-white uppercase">
              NO EMULSION LOADED
            </h2>
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              DROP 35MM / 120 / CAMERA RAW DIRECTLY OR SELECT AN ARCHIVAL FRAME BELOW
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black hover:bg-zinc-200 border-2 border-white font-mono text-xs font-black tracking-widest uppercase transition-colors duration-100 cursor-pointer shadow-[4px_4px_0px_0px_rgba(255,255,255,0.4)] active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              [ + LOAD FILE OR CAMERA RAW ]
            </button>
          </div>

          {/* Numbered Sample Archive Frames */}
          <div className="border-t border-white/20 pt-4 space-y-3">
            <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest text-left">
              DEMONSTRATION ARCHIVE //
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => loadSampleImage('/sample-portrait.jpg', setImage, setIsLoading)}
                className="group relative flex flex-col p-2.5 border border-white/20 hover:border-white bg-[#080808] hover:bg-white text-white hover:text-black transition-colors duration-100 cursor-pointer text-left"
              >
                <div className="w-full aspect-[4/5] overflow-hidden bg-black border border-white/10 group-hover:border-black">
                  <img 
                    src="/sample-portrait.jpg" 
                    alt="Portrait sample" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="mt-2.5 space-y-0.5">
                  <div className="text-[10px] font-mono font-black tracking-wider uppercase">
                    [FRAME 01 // PORTRAIT]
                  </div>
                  <div className="text-[9px] font-mono text-zinc-400 group-hover:text-zinc-800 uppercase">
                    35MM COLOR NEGATIVE
                  </div>
                </div>
              </button>

              <button
                onClick={() => loadSampleImage('/sample-landscape.jpg', setImage, setIsLoading)}
                className="group relative flex flex-col p-2.5 border border-white/20 hover:border-white bg-[#080808] hover:bg-white text-white hover:text-black transition-colors duration-100 cursor-pointer text-left"
              >
                <div className="w-full aspect-[4/5] overflow-hidden bg-black border border-white/10 group-hover:border-black">
                  <img 
                    src="/sample-landscape.jpg" 
                    alt="Landscape sample" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="mt-2.5 space-y-0.5">
                  <div className="text-[10px] font-mono font-black tracking-wider uppercase">
                    [FRAME 02 // ARCHIVE]
                  </div>
                  <div className="text-[9px] font-mono text-zinc-400 group-hover:text-zinc-800 uppercase">
                    HIGH DYNAMIC RANGE
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest border-t border-white/15 pt-3">
            COMPATIBILITY // CANON CR2/CR3 • SONY ARW • NIKON NEF • FUJI RAF • ADOBE DNG • APPLE HEIC • JPEG • PNG
          </div>
        </div>
      )}

      {/* Main WebGL2 Canvas Viewport */}
      <div 
        className={
          image
            ? 'relative flex items-center justify-center opacity-100 scale-100 transition-all duration-200'
            : 'hidden'
        }
      >
        <canvas
          ref={canvasRef}
          className="block border border-white/30 shadow-[0_0_50px_rgba(0,0,0,0.9)]"
        />

        {/* Industrial Darkroom Easel Registration Brackets */}
        {image && (
          <>
            <div className="corner-bracket-tl" />
            <div className="corner-bracket-tr" />
            <div className="corner-bracket-bl" />
            <div className="corner-bracket-br" />
          </>
        )}
        
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/95 p-4 border border-white">
            <div className="text-white text-sm font-mono text-center space-y-2">
              <div className="font-black">[RENDERER INITIALIZATION ERROR]</div>
              <div className="text-xs text-zinc-400">{errorMessage}</div>
            </div>
          </div>
        )}
        
        {/* Non-Intrusive Corner Loading Indicator (NO full-screen blur or blackout) */}
        {isLoading && (
          <div className="absolute top-3 right-3 pointer-events-none z-20 animate-fadeIn">
            <div className="flex items-center gap-2 px-2.5 py-1 bg-black/90 border border-white text-[10px] font-mono font-bold text-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)]">
              <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent" />
              <span className="tracking-widest uppercase">LOADING 3D-LUT...</span>
            </div>
          </div>
        )}
        
        {/* Split Before/After Comparison Overlay */}
        {showBeforeAfter && image && (
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden"
          >
            {/* Left Side: Original Image */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${comparePosition}%` }}
            >
              <img 
                src={image.src}
                alt="Original"
                style={{
                  width: canvasRef.current?.style.width || '100%',
                  height: canvasRef.current?.style.height || '100%',
                  maxWidth: 'none',
                }}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
            </div>
            
            {/* Vertical Divider & Draggable Handle */}
            <div 
              className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-auto cursor-col-resize z-20 shadow-[0_0_10px_rgba(0,0,0,1)] touch-none"
              style={{ left: `${comparePosition}%` }}
              onMouseDown={() => setIsDragging(true)}
              onTouchStart={(e) => {
                e.stopPropagation();
                setIsDragging(true);
              }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-8 h-8 sm:w-7 sm:h-7 bg-black border-2 border-white text-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)] flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform touch-none">
                <span className="text-[10px] font-mono font-black">◧</span>
              </div>
            </div>
            
            {/* Monochromatic Badges */}
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-1.5 sm:px-2 py-0.5 bg-black text-white text-[9px] sm:text-[10px] font-mono font-bold tracking-wider sm:tracking-widest border border-white z-10 pointer-events-none select-none">
              <span className="hidden sm:inline">[01 // ORIGINAL]</span>
              <span className="sm:hidden">ORIGINAL</span>
            </div>
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-1.5 sm:px-2 py-0.5 bg-white text-black text-[9px] sm:text-[10px] font-mono font-bold tracking-wider sm:tracking-widest border border-black z-10 pointer-events-none select-none">
              <span className="hidden sm:inline">[02 // EMULSION]</span>
              <span className="sm:hidden">EMULSION</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
