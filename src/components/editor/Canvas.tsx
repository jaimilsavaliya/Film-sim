'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '@/lib/store';
import { FilmRenderer } from '@/lib/webgl/renderer';
import { loadCubeLUT, createIdentityLUT, type LUTData } from '@/lib/webgl/lut-loader';
import { isRawOrHeicFile, decodeCameraRawOrHeic } from '@/lib/raw-decoder';
import { parseExifFromFile } from '@/utils/exifParser';
import { computeCanvasHistogram, zoneSystemColor } from '@/utils/filmEngine';
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
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
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

  // Darkroom Add-ons
  const pushPullStops = useEditorStore(s => s.pushPullStops);
  const lightLeakStyle = useEditorStore(s => s.lightLeakStyle);
  const lightLeakIntensity = useEditorStore(s => s.lightLeakIntensity);
  const quartzDateStamp = useEditorStore(s => s.quartzDateStamp);
  const quartzDateText = useEditorStore(s => s.quartzDateText);
  const zoneSystemOverlay = useEditorStore(s => s.zoneSystemOverlay);
  const setHistogram = useEditorStore(s => s.setHistogram);
  const setParsedExif = useEditorStore(s => s.setParsedExif);
  const setQuartzDateText = useEditorStore(s => s.setQuartzDateText);

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

    const overlay = overlayCanvasRef.current;
    if (overlay) {
      overlay.width = renderWidth;
      overlay.height = renderHeight;
      overlay.style.width = `${Math.round(displayWidth)}px`;
      overlay.style.height = `${Math.round(displayHeight)}px`;
    }

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

  // Render 2D Darkroom Optical Overlay Pass (Light Leaks, 90s Quartz Date-Back, Zone System Map)
  const renderOverlayPass = useCallback(() => {
    const overlay = overlayCanvasRef.current;
    const canvas = canvasRef.current;
    if (!overlay || !canvas || !image) return;

    if (overlay.width !== canvas.width || overlay.height !== canvas.height) {
      overlay.width = canvas.width;
      overlay.height = canvas.height;
      overlay.style.width = canvas.style.width;
      overlay.style.height = canvas.style.height;
    }

    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    const w = overlay.width;
    const h = overlay.height;

    ctx.clearRect(0, 0, w, h);

    // Ansel Adams 11-Zone Exposure Diagnostic Map
    if (zoneSystemOverlay) {
      try {
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
          const pixels = new Uint8Array(w * h * 4);
          (gl as WebGLRenderingContext | WebGL2RenderingContext).readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          const zoneImg = ctx.createImageData(w, h);
          const zData = zoneImg.data;
          for (let i = 0; i < pixels.length; i += 4) {
            const pxIndex = i >> 2;
            const x = pxIndex % w;
            const y = (pxIndex / w) | 0;
            const flippedIdx = ((h - 1 - y) * w + x) * 4;

            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const luma = (r * 77 + g * 150 + b * 29) >> 8;
            const [zr, zg, zb] = zoneSystemColor(luma);
            zData[flippedIdx] = zr;
            zData[flippedIdx + 1] = zg;
            zData[flippedIdx + 2] = zb;
            zData[flippedIdx + 3] = 255;
          }
          ctx.putImageData(zoneImg, 0, 0);
          return;
        }
      } catch (err) {
        console.error('Zone system map render error:', err);
      }
    }

    // Organic Camera Gate Light Leaks
    if (lightLeakStyle && lightLeakStyle !== 'NONE' && lightLeakIntensity > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = (lightLeakIntensity / 100) * 0.85;

      if (lightLeakStyle === 'AMBER_EDGE') {
        const grad = ctx.createRadialGradient(
          w * 0.04, h * 0.35, w * 0.02,
          w * 0.08, h * 0.4, w * 0.55
        );
        grad.addColorStop(0, 'rgba(255, 165, 55, 0.95)');
        grad.addColorStop(0.45, 'rgba(235, 85, 30, 0.55)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      } else if (lightLeakStyle === 'CRIMSON_SPOOL') {
        const grad = ctx.createLinearGradient(w * 0.55, 0, w, 0);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.55, 'rgba(215, 45, 25, 0.5)');
        grad.addColorStop(0.88, 'rgba(255, 140, 40, 0.85)');
        grad.addColorStop(1, 'rgba(255, 210, 120, 0.95)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      } else if (lightLeakStyle === 'TUNGSTEN_STREAK') {
        const grad = ctx.createRadialGradient(
          w * 0.82, h * 0.18, w * 0.02,
          w * 0.78, h * 0.5, h * 0.75
        );
        grad.addColorStop(0, 'rgba(255, 215, 130, 0.9)');
        grad.addColorStop(0.35, 'rgba(240, 110, 45, 0.55)');
        grad.addColorStop(0.7, 'rgba(140, 35, 95, 0.25)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.restore();
    }

    // 90s Quartz LED Date-Back Imprint
    if (quartzDateStamp) {
      const stampText = (quartzDateText || "'26 11 13").trim();
      const fontSize = Math.max(14, Math.round(Math.min(w, h) * 0.032));
      const posX = w - Math.round(w * 0.055);
      const posY = h - Math.round(h * 0.048);

      ctx.save();
      ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';

      ctx.shadowColor = 'rgba(255, 65, 15, 0.92)';
      ctx.shadowBlur = Math.max(8, Math.round(fontSize * 0.55));
      ctx.fillStyle = 'rgba(255, 110, 30, 0.9)';
      ctx.fillText(stampText, posX, posY);

      ctx.shadowBlur = Math.max(3, Math.round(fontSize * 0.2));
      ctx.fillStyle = 'rgba(255, 195, 95, 0.96)';
      ctx.fillText(stampText, posX, posY);
      ctx.restore();
    }
  }, [image, zoneSystemOverlay, lightLeakStyle, lightLeakIntensity, quartzDateStamp, quartzDateText]);

  // Update render adjustment settings and trigger live waveform + overlays
  useEffect(() => {
    const renderer = rendererRef.current || getOrCreateRenderer();
    if (!renderer || !image) return;

    const effectiveExposure = (exposure / 100) * 2.0 + pushPullStops * 0.22;
    const effectiveContrast = (contrast / 100) + pushPullStops * 0.16;
    const effectiveGrain = Math.min(1.0, (grain / 100) + Math.max(0, pushPullStops * 0.12));

    renderer.setSettings({
      intensity: selectedFilm ? intensity / 100 : 0.0,
      exposure: effectiveExposure,
      contrast: effectiveContrast,
      highlights: highlights / 100,
      shadows: shadows / 100,
      saturation: saturation / 100,
      temperature: temperature / 100,
      grain: effectiveGrain,
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

    renderOverlayPass();

    // Compute live 64-bin waveform histogram from rendered frame
    if (canvasRef.current) {
      const hist = computeCanvasHistogram(canvasRef.current);
      setHistogram(hist);
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
    pushPullStops,
    getOrCreateRenderer,
    renderOverlayPass,
    setHistogram,
  ]);

  // Update overlays whenever light leaks or quartz date stamp changes
  useEffect(() => {
    renderOverlayPass();
  }, [renderOverlayPass]);

  // File selection directly from Canvas empty state with EXIF ingestion
  const handleCanvasFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    // Parse binary EXIF tags
    parseExifFromFile(file).then((exif) => {
      setParsedExif(exif);
      if (exif.formattedDate) {
        setQuartzDateText(exif.formattedDate);
      }
    }).catch(() => {});

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
        <canvas
          ref={overlayCanvasRef}
          data-overlay="darkroom"
          className="absolute inset-0 pointer-events-none z-10"
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
