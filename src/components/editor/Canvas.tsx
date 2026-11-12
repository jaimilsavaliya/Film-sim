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

  // Update whenever image loads or container resizes
  useEffect(() => {
    if (!image) return;
    updateCanvasDimensionsAndImage();

    const handleResize = () => {
      updateCanvasDimensionsAndImage();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    if (!containerRef.current || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pos = ((clientX - canvasRect.left) / canvasRect.width) * 100;
    setComparePosition(Math.max(0, Math.min(100, pos)));
  }, [setComparePosition]);

  return (
    <div 
      ref={containerRef}
      className="viewfinder-grid relative w-full h-full flex items-center justify-center overflow-hidden select-none"
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

      {/* Corner Optical Crop Marks */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/20 pointer-events-none" />
      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/20 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/20 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/20 pointer-events-none" />

      {/* Central Viewfinder Crosshair */}
      {!image && (
        <div className="absolute w-8 h-8 pointer-events-none opacity-20 flex items-center justify-center">
          <div className="w-full h-[1px] bg-white" />
          <div className="h-full w-[1px] bg-white absolute" />
        </div>
      )}

      {/* Empty State Welcome Card */}
      {!image && (
        <div className="relative z-10 text-zinc-400 text-center max-w-lg px-6 py-8 rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-md shadow-2xl space-y-5 animate-fadeIn">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 mx-auto rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] cursor-pointer hover:border-amber-500/50 hover:scale-105 transition-all duration-200"
            title="Click to load photo"
          >
            <Camera className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-base font-bold font-mono tracking-wider text-white">
              LOAD 35MM FRAME
            </h2>
            <p className="text-xs font-mono text-zinc-400">
              Drag & drop photo anywhere or select a test frame below
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-500/60 font-mono text-xs tracking-wider transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            >
              <UploadCloud className="w-4 h-4" />
              CHOOSE FILE OR CAMERA RAW
            </button>
          </div>

          {/* Sample Photos Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => loadSampleImage('/sample-portrait.jpg', setImage, setIsLoading)}
              className="group relative flex flex-col items-center p-2.5 rounded-xl border border-white/10 hover:border-amber-500/50 bg-zinc-900/60 hover:bg-zinc-800/80 transition-all duration-200 cursor-pointer shadow-sm"
            >
              <div className="w-full aspect-[4/5] rounded-lg overflow-hidden bg-zinc-950 border border-white/5">
                <img 
                  src="/sample-portrait.jpg" 
                  alt="Portrait sample" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="mt-2 text-center">
                <div className="text-[11px] font-mono font-bold text-zinc-200 group-hover:text-amber-400 transition-colors">
                  PORTRAIT
                </div>
                <div className="text-[9px] font-mono text-zinc-500">
                  35MM COLOR FILM
                </div>
              </div>
            </button>

            <button
              onClick={() => loadSampleImage('/sample-landscape.jpg', setImage, setIsLoading)}
              className="group relative flex flex-col items-center p-2.5 rounded-xl border border-white/10 hover:border-amber-500/50 bg-zinc-900/60 hover:bg-zinc-800/80 transition-all duration-200 cursor-pointer shadow-sm"
            >
              <div className="w-full aspect-[4/5] rounded-lg overflow-hidden bg-zinc-950 border border-white/5">
                <img 
                  src="/sample-landscape.jpg" 
                  alt="Landscape sample" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="mt-2 text-center">
                <div className="text-[11px] font-mono font-bold text-zinc-200 group-hover:text-amber-400 transition-colors">
                  LANDSCAPE
                </div>
                <div className="text-[9px] font-mono text-zinc-500">
                  HIGH-DYNAMIC RANGE
                </div>
              </div>
            </button>
          </div>

          <div className="text-[10px] font-mono text-zinc-500 tracking-wider">
            SUPPORTS CAMERA RAW (CR2, CR3, ARW, NEF, RAF, DNG) • APPLE HEIC • JPEG • PNG
          </div>
        </div>
      )}

      {/* Main WebGL2 Canvas Viewport (Always kept in DOM so WebGL2 initializes properly) */}
      <div 
        className={`relative flex items-center justify-center ${image ? 'opacity-100 scale-100 transition-all duration-300' : 'opacity-0 pointer-events-none absolute'}`}
      >
        <canvas
          ref={canvasRef}
          className="block rounded-sm shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-white/10"
        />
        
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-950/80 p-4 rounded-lg">
            <div className="text-red-400 text-sm font-mono text-center space-y-1">
              <div className="font-bold">RENDERER INITIALIZATION ERROR</div>
              <div className="text-xs text-red-300">{errorMessage}</div>
            </div>
          </div>
        )}
        
        {/* Loading HUD Badge */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-sm pointer-events-none">
            <div className="flex items-center gap-2.5 px-4 py-2 bg-zinc-950/90 rounded-full border border-amber-500/40 text-xs font-mono text-amber-300 shadow-xl">
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-amber-400 border-t-transparent" />
              <span className="tracking-wide">PROCESSING 3D LUT PROFILE...</span>
            </div>
          </div>
        )}
        
        {/* Split Before/After Comparison Overlay */}
        {showBeforeAfter && image && (
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm"
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
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)] pointer-events-auto cursor-col-resize z-20"
              style={{ left: `${comparePosition}%` }}
              onMouseDown={() => setIsDragging(true)}
              onTouchStart={() => setIsDragging(true)}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-8 h-8 bg-zinc-900 border border-white/60 text-white rounded-full shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">
                <div className="flex items-center gap-0.5">
                  <span className="w-0.5 h-3 bg-zinc-400 rounded-full" />
                  <span className="w-0.5 h-3 bg-zinc-400 rounded-full" />
                </div>
              </div>
            </div>
            
            {/* Badges */}
            <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/80 backdrop-blur-md text-white text-[10px] font-mono tracking-wider rounded border border-white/10 shadow">
              ORIGINAL
            </div>
            <div className="absolute top-3 right-3 px-2 py-0.5 bg-amber-950/80 backdrop-blur-md text-amber-300 text-[10px] font-mono tracking-wider rounded border border-amber-500/30 shadow">
              FILM SIM
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
