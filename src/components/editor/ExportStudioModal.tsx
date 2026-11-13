'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  Film,
  Frame,
  Image as ImageIcon,
  ImagePlus,
  LayoutTemplate,
  Sliders,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  ExportStockMetadata,
  ExportStudioConfig,
  ExportTemplateMode,
  FilmStripSlotItem,
  PaperTheme,
  PolaroidFilmType,
  POLAROID_PROFILES,
  renderExportComposition,
} from '@/lib/export-renderer';

export interface ExportStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryImage: HTMLImageElement;
  primaryImageTitle?: string;
  selectedStock?: ExportStockMetadata | null;
  initialMode?: ExportTemplateMode;
  /** Optional custom grading function from your host app */
  gradeImageFn?: (img: HTMLImageElement, maxDim: number) => HTMLCanvasElement;
  onExportComplete?: (msg: string) => void;
}

export default function ExportStudioModal({
  isOpen,
  onClose,
  primaryImage,
  primaryImageTitle = '35mm Study',
  selectedStock = null,
  initialMode = 'POLAROID',
  gradeImageFn,
  onExportComplete,
}: ExportStudioModalProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const multiUploadInputRef = useRef<HTMLInputElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [instantBrandFilter, setInstantBrandFilter] = useState<'ALL' | 'POLAROID' | 'INSTAX'>('ALL');

  const [config, setConfig] = useState<ExportStudioConfig>(() => ({
    mode: initialMode,
    paperTheme: 'WARM_IVORY',
    polaroidFilmType: 'POLAROID_600',
    format: 'png',
    quality: 0.95,
    polaroidCaption: primaryImageTitle,
    polaroidDateStamp: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).toUpperCase(),
    polaroidShowStockStamp: true,
    polaroidShowRainbow: true,
    posterHeadline: selectedStock ? selectedStock.name : '35mm Contact Study',
    posterSubheadline: selectedStock
      ? selectedStock.characterNote
      : 'Minimalist darkroom color grading & silver halide emulation',
    posterShowExif: true,
    posterExifText: 'LEICA M6 TTL  ·  35MM SUMMILUX-M F/1.4 ASPH  ·  1/250S',
    posterFooterRightText: '35MM SILVER HALIDE PRINT',
    posterShowPaletteSwatches: true,
    filmStripOrientation: 'VERTICAL',
    filmStripGap: 18,
    filmStripShowSprockets: true,
    filmStripEdgeCode: selectedStock
      ? `${selectedStock.name.toUpperCase()}  •  ${selectedStock.iso}`
      : 'KODAK SAFETY FILM 5063',
  }));

  const [filmStripSlots, setFilmStripSlots] = useState<FilmStripSlotItem[]>(() => [
    {
      id: 'slot-primary',
      title: primaryImageTitle || 'Frame 01',
      image: primaryImage,
    },
  ]);

  // Sync initial mode if changed externally
  useEffect(() => {
    if (initialMode) {
      setConfig((prev) => ({ ...prev, mode: initialMode }));
    }
  }, [initialMode]);

  // Sync selected stock metadata if changed
  useEffect(() => {
    if (selectedStock) {
      setConfig((prev) => ({
        ...prev,
        posterHeadline: prev.posterHeadline || selectedStock.name,
        posterSubheadline: prev.posterSubheadline || selectedStock.characterNote,
        filmStripEdgeCode: `${selectedStock.name.toUpperCase()}  •  ${selectedStock.iso}`,
      }));
    }
  }, [selectedStock]);

  // Re-render live preview whenever config or images change
  useEffect(() => {
    if (!isOpen || !previewCanvasRef.current || !primaryImage) return;

    try {
      renderExportComposition(
        previewCanvasRef.current,
        primaryImage,
        filmStripSlots,
        selectedStock,
        config,
        { maxResolution: 1400, gradeImageFn }
      );
    } catch (err) {
      console.error('Error rendering export composition preview:', err);
    }
  }, [isOpen, primaryImage, filmStripSlots, selectedStock, config, gradeImageFn]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const updateConfig = useCallback(
    <K extends keyof ExportStudioConfig>(key: K, value: ExportStudioConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Add multiple user-uploaded images to the Film Strip
  const handleAddUploadedFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (typeof result === 'string') {
          const img = new Image();
          img.onload = () => {
            setFilmStripSlots((prev) => {
              if (prev.length >= 6) return prev;
              return [
                ...prev,
                {
                  id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  title: file.name.replace(/\.[^/.]+$/, ''),
                  image: img,
                },
              ];
            });
          };
          img.src = result;
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleRemoveSlot = useCallback((id: string) => {
    setFilmStripSlots((prev) => (prev.length <= 1 ? prev : prev.filter((s) => s.id !== id)));
  }, []);

  const handleMoveSlot = useCallback((index: number, direction: -1 | 1) => {
    setFilmStripSlots((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
  }, []);

  const handleDownloadPrint = useCallback(() => {
    if (isExporting) return;
    setIsExporting(true);

    setTimeout(() => {
      try {
        const exportCanvas = document.createElement('canvas');
        renderExportComposition(
          exportCanvas,
          primaryImage,
          filmStripSlots,
          selectedStock,
          config,
          { maxResolution: 2200, gradeImageFn }
        );

        const mime = config.format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const ext = config.format === 'jpeg' ? 'jpg' : 'png';
        const dataUrl = exportCanvas.toDataURL(mime, config.quality);

        const link = document.createElement('a');
        const filmName = config.mode === 'POLAROID'
          ? config.polaroidFilmType.toLowerCase().replace(/_/g, '-')
          : selectedStock ? selectedStock.id : 'filmsim';

        link.download = `filmsim-${config.mode.toLowerCase()}-${filmName}-${Date.now()}.${ext}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 2500);
        onExportComplete?.(`Exported ${config.mode} as ${ext.toUpperCase()}`);
      } catch (err) {
        console.error('Failed to export composition:', err);
        alert('Failed to generate export file. Please try again.');
      } finally {
        setIsExporting(false);
      }
    }, 60);
  }, [isExporting, primaryImage, filmStripSlots, selectedStock, config, gradeImageFn, onExportComplete]);

  if (!isOpen) return null;

  const templateTabs = [
    { id: 'POLAROID' as const, label: 'Instant Frame', subtitle: 'Polaroid & Instax', Icon: Frame },
    { id: 'POSTER' as const, label: 'Poster', subtitle: 'Exhibition Print', Icon: LayoutTemplate },
    { id: 'FILM_STRIP' as const, label: 'Film Strip', subtitle: 'Multi-Frame Roll', Icon: Film },
    { id: 'RAW_FRAME' as const, label: 'Standard', subtitle: 'Full-Bleed Negative', Icon: ImageIcon },
  ];

  const paperOptions: { id: PaperTheme; label: string; swatch: string }[] = [
    { id: 'WARM_IVORY', label: 'Warm Ivory', swatch: '#F4EFE6' },
    { id: 'PURE_ALABASTER', label: 'Alabaster', swatch: '#FAFAFA' },
    { id: 'OBSIDIAN_MATTE', label: 'Obsidian', swatch: '#141312' },
  ];

  const polaroidFilmOptions = [
    {
      id: 'POLAROID_600' as PolaroidFilmType,
      name: 'Polaroid 600 Film',
      badge: '600 FILM',
      iso: 'ISO 640',
      brand: 'POLAROID' as const,
      subtitle: 'Classic 1:1 Instant Card',
      cardMm: '88 × 107 mm',
      imageMm: '79 × 79 mm',
      desc: 'Classic square window with authentic rainbow spectrum bar',
    },
    {
      id: 'POLAROID_I_TYPE' as PolaroidFilmType,
      name: 'Polaroid i-Type Film',
      badge: 'i-TYPE',
      iso: 'ISO 640',
      brand: 'POLAROID' as const,
      subtitle: 'Modern Battery-Free Card',
      cardMm: '88 × 107 mm',
      imageMm: '79 × 79 mm',
      desc: 'Clean, crisp contemporary minimal white borders',
    },
    {
      id: 'POLAROID_SX_70' as PolaroidFilmType,
      name: 'Polaroid SX-70 Film',
      badge: 'SX-70',
      iso: 'ISO 160',
      brand: 'POLAROID' as const,
      subtitle: 'Vintage Folding SLR Frame',
      cardMm: '88 × 107 mm',
      imageMm: '79 × 79 mm',
      desc: 'Low-sensitivity archival formulation with nostalgic warm chin',
    },
    {
      id: 'POLAROID_GO' as PolaroidFilmType,
      name: 'Polaroid Go Film',
      badge: 'GO MINI',
      iso: 'ISO 640',
      brand: 'POLAROID' as const,
      subtitle: 'Ultra-Compact Pocket Mini',
      cardMm: '53.9 × 66.6 mm',
      imageMm: '47 × 46 mm',
      desc: 'Authentic 47×46mm proportions with rounded frame corners',
    },
    {
      id: 'POLAROID_810' as PolaroidFilmType,
      name: 'Polaroid 810 Film',
      badge: '8x10 SHEET',
      iso: 'ISO 640',
      brand: 'POLAROID' as const,
      subtitle: 'Large Format 8×10" Sheet',
      cardMm: '203.2 × 254 mm (8×10")',
      imageMm: '190.5 × 241.3 mm',
      desc: 'Massive 4:5 studio sheet with darkroom pod & clip notches',
    },
    {
      id: 'INSTAX_MINI' as PolaroidFilmType,
      name: 'Instax Mini Film',
      badge: 'MINI',
      iso: 'ISO 800',
      brand: 'INSTAX' as const,
      subtitle: 'Credit Card Portrait Frame',
      cardMm: '54 × 85 mm',
      imageMm: '46 × 62 mm',
      desc: 'Popular vertical 46×62mm credit-card instant print',
    },
    {
      id: 'INSTAX_SQUARE' as PolaroidFilmType,
      name: 'Instax Square Film',
      badge: 'SQUARE',
      iso: 'ISO 800',
      brand: 'INSTAX' as const,
      subtitle: 'Square Modern Instant Frame',
      cardMm: '72 × 86 mm',
      imageMm: '62 × 62 mm',
      desc: 'Balanced 1:1 square 62×62mm photo window',
    },
    {
      id: 'INSTAX_WIDE_H' as PolaroidFilmType,
      name: 'Instax Wide (Horizontal)',
      badge: 'WIDE (H)',
      iso: 'ISO 800',
      brand: 'INSTAX' as const,
      subtitle: 'Landscape Wide Instant Frame',
      cardMm: '108 × 85 mm',
      imageMm: '99 × 62 mm',
      desc: 'Wide panoramic 99×62mm horizontal instant frame',
    },
    {
      id: 'INSTAX_WIDE_V' as PolaroidFilmType,
      name: 'Instax Wide (Vertical)',
      badge: 'WIDE (V)',
      iso: 'ISO 800',
      brand: 'INSTAX' as const,
      subtitle: 'Portrait Wide Instant Frame',
      cardMm: '85 × 108 mm',
      imageMm: '62 × 99 mm',
      desc: 'Tall vertical 62×99mm wide instant format',
    },
  ];

  const filteredInstantOptions = polaroidFilmOptions.filter((opt) => {
    if (instantBrandFilter === 'ALL') return true;
    return opt.brand === instantBrandFilter;
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 md:p-6 select-none animate-fadeIn"
    >
      <input
        ref={multiUploadInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/*"
        onChange={(e) => {
          handleAddUploadedFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full sm:h-[92dvh] sm:max-w-6xl bg-black border-2 border-white flex flex-col overflow-hidden shadow-[16px_16px_0px_0px_rgba(255,255,255,0.25)] relative font-mono text-white"
      >
        <div className="corner-bracket-tl" />
        <div className="corner-bracket-tr" />
        <div className="corner-bracket-bl" />
        <div className="corner-bracket-br" />

        {/* Header */}
        <div className="h-14 px-6 border-b border-white/20 flex items-center justify-between bg-[#080808] shrink-0">
          <div className="flex items-center gap-3">
            <div className="border border-white/30 bg-white/10 px-1.5 py-0.2 text-[9px] font-mono font-bold text-white tracking-widest">
              04
            </div>
            <span className="text-sm font-black font-mono tracking-widest text-white uppercase">
              DARKROOM PRINT STUDIO
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] font-mono font-bold bg-white text-black uppercase tracking-widest">
              MM-ACCURATE PHOTOGRAPHIC ARCHIVE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 border border-white/30 hover:border-white text-white hover:bg-white hover:text-black transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
          {/* Live Canvas Preview */}
          <div className="flex-1 p-4 md:p-8 bg-[#040404] flex items-center justify-center border-b lg:border-b-0 lg:border-r border-white/20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-25 pointer-events-none viewfinder-grid" />

            <div className="relative">
              <div className="corner-bracket-tl" />
              <div className="corner-bracket-tr" />
              <div className="corner-bracket-bl" />
              <div className="corner-bracket-br" />

              <canvas
                ref={previewCanvasRef}
                className="max-w-full max-h-[46dvh] lg:max-h-[calc(90dvh-130px)] w-auto h-auto object-contain border border-white/40 shadow-[0_20px_60px_rgba(0,0,0,1)] z-10 block"
              />
            </div>
          </div>

          {/* Controls Sidebar */}
          <div className="w-full lg:w-[440px] shrink-0 bg-black flex flex-col lg:h-full border-t lg:border-t-0 border-white/20">
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Template Mode Tabs */}
              <div>
                <label className="text-[10px] font-mono tracking-widest text-zinc-400 font-bold uppercase mb-2 block">
                  04.1 // PRINT LAYOUT MEDIUM
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {templateTabs.map(({ id, label, subtitle, Icon }, idx) => {
                    const active = config.mode === id;
                    const tabNumber = String(idx + 1).padStart(2, '0');
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => updateConfig('mode', id)}
                        className={`p-3 border text-left flex items-start gap-2.5 transition-colors duration-100 cursor-pointer ${
                          active
                            ? 'bg-white text-black border-white shadow-[3px_3px_0px_0px_rgba(255,255,255,0.4)]'
                            : 'bg-[#080808] border-white/15 text-zinc-300 hover:border-white hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 ${active ? 'text-black' : 'text-zinc-400'}`} />
                        <div>
                          <div className="text-xs font-mono font-black uppercase">[{tabNumber}] {label}</div>
                          <div className={`text-[10px] font-mono uppercase ${active ? 'text-zinc-700' : 'text-zinc-500'}`}>{subtitle}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Paper Theme Selector (Polaroid & Poster) */}
              {(config.mode === 'POLAROID' || config.mode === 'POSTER') && (
                <div className="pt-4 border-t border-white/20">
                  <label className="text-[10px] font-mono tracking-widest text-zinc-400 font-bold uppercase mb-2 block">
                    04.2 // ARCHIVAL PAPER FINISH
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {paperOptions.map((paper, idx) => {
                      const active = config.paperTheme === paper.id;
                      const paperNum = String(idx + 1).padStart(2, '0');
                      return (
                        <button
                          key={paper.id}
                          type="button"
                          onClick={() => updateConfig('paperTheme', paper.id)}
                          className={`px-2.5 py-2 border text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            active
                              ? 'bg-white text-black border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)]'
                              : 'bg-[#080808] border-white/15 text-zinc-400 hover:border-white hover:text-white'
                          }`}
                        >
                          <span
                            style={{ backgroundColor: paper.swatch }}
                            className="w-2.5 h-2.5 border border-black/40 shrink-0"
                          />
                          <span className="truncate">[{paperNum}] {paper.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Instant Film Controls with Polaroid & Instax Selectors */}
              {config.mode === 'POLAROID' && (
                <div className="space-y-4 pt-4 border-t border-white/20">
                  {/* Brand Filter & Header */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-mono tracking-widest text-zinc-400 font-bold uppercase">
                        04.3 // FORMAT PROFILE SPECIFICATION
                      </label>
                      <div className="flex items-center gap-1 text-[10px] font-mono">
                        <button
                          type="button"
                          onClick={() => setInstantBrandFilter('ALL')}
                          className={`px-2 py-0.5 border font-bold transition-colors cursor-pointer ${
                            instantBrandFilter === 'ALL' ? 'bg-white text-black border-white' : 'bg-black text-zinc-400 border-white/20 hover:text-white'
                          }`}
                        >
                          ALL (9)
                        </button>
                        <button
                          type="button"
                          onClick={() => setInstantBrandFilter('POLAROID')}
                          className={`px-2 py-0.5 border font-bold transition-colors cursor-pointer ${
                            instantBrandFilter === 'POLAROID' ? 'bg-white text-black border-white' : 'bg-black text-zinc-400 border-white/20 hover:text-white'
                          }`}
                        >
                          POLAROID (5)
                        </button>
                        <button
                          type="button"
                          onClick={() => setInstantBrandFilter('INSTAX')}
                          className={`px-2 py-0.5 border font-bold transition-colors cursor-pointer ${
                            instantBrandFilter === 'INSTAX' ? 'bg-white text-black border-white' : 'bg-black text-zinc-400 border-white/20 hover:text-white'
                          }`}
                        >
                          INSTAX (4)
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Formats List */}
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {filteredInstantOptions.map((opt, idx) => {
                        const active = config.polaroidFilmType === opt.id;
                        const optNumber = String(idx + 1).padStart(2, '0');
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => updateConfig('polaroidFilmType', opt.id)}
                            className={`w-full p-2.5 border text-left flex items-center justify-between transition-colors duration-100 cursor-pointer ${
                              active
                                ? 'bg-white text-black border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)]'
                                : 'bg-[#080808] border-white/15 text-zinc-300 hover:border-white hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`text-[10px] font-mono font-bold px-1 py-0.2 border shrink-0 ${
                                active ? 'bg-black text-white border-black' : 'bg-black text-zinc-400 border-white/20'
                              }`}>
                                [{optNumber}]
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-xs font-mono font-black truncate uppercase ${active ? 'text-black' : 'text-white'}`}>{opt.name}</span>
                                  <span className={`text-[9px] font-mono px-1 py-0.2 border shrink-0 font-bold ${
                                    active ? 'bg-black text-white border-black' : 'bg-black text-zinc-300 border-white/20'
                                  }`}>
                                    {opt.cardMm}
                                  </span>
                                </div>
                                <div className={`text-[10px] font-mono truncate uppercase ${active ? 'text-zinc-700' : 'text-zinc-500'}`}>
                                  IMAGE: {opt.imageMm} • {opt.subtitle}
                                </div>
                              </div>
                            </div>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 border shrink-0 font-bold ${
                              active 
                                ? 'bg-black text-white border-black' 
                                : 'bg-black text-zinc-400 border-white/20'
                            }`}>
                              {opt.iso}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Polaroid 600 Rainbow Bar Option */}
                  {config.polaroidFilmType === 'POLAROID_600' && (
                    <div className="flex items-center justify-between p-2.5 bg-[#080808] border border-white/20">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          <span className="w-1.5 h-3 bg-red-500" />
                          <span className="w-1.5 h-3 bg-orange-500" />
                          <span className="w-1.5 h-3 bg-yellow-400" />
                          <span className="w-1.5 h-3 bg-green-500" />
                          <span className="w-1.5 h-3 bg-blue-500" />
                        </div>
                        <span className="text-xs font-mono font-bold text-white uppercase">
                          Classic Rainbow Spectrum Bar
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.polaroidShowRainbow}
                        onChange={(e) => updateConfig('polaroidShowRainbow', e.target.checked)}
                        className="w-4 h-4 rounded-none border border-white/40 accent-white cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Custom Chin Caption */}
                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                      04.4 // HANDWRITTEN CHIN CAPTION
                    </label>
                    <input
                      type="text"
                      value={config.polaroidCaption}
                      onChange={(e) => updateConfig('polaroidCaption', e.target.value)}
                      placeholder="e.g. Summer in Kyoto"
                      className="w-full h-9 px-3 bg-black border border-white/30 text-sm font-serif italic text-white focus:outline-none focus:border-white"
                    />
                  </div>

                  {/* Optical Date Stamp */}
                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                      04.5 // OPTICAL DATE STAMP
                    </label>
                    <input
                      type="text"
                      value={config.polaroidDateStamp}
                      onChange={(e) => updateConfig('polaroidDateStamp', e.target.value)}
                      placeholder="e.g. NOV 13 · 2026"
                      className="w-full h-9 px-3 bg-black border border-white/30 text-xs font-mono text-white focus:outline-none focus:border-white uppercase"
                    />
                  </div>

                  {/* Stock Badge Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-mono font-bold text-white uppercase">
                      Show Film Stock Stamp
                    </span>
                    <input
                      type="checkbox"
                      checked={config.polaroidShowStockStamp}
                      onChange={(e) => updateConfig('polaroidShowStockStamp', e.target.checked)}
                      className="w-4 h-4 rounded-none border border-white/40 accent-white cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Poster Controls */}
              {config.mode === 'POSTER' && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <label className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase block">
                    Exhibition Poster Typography
                  </label>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1">
                      EXHIBITION HEADLINE
                    </label>
                    <input
                      type="text"
                      value={config.posterHeadline}
                      onChange={(e) => updateConfig('posterHeadline', e.target.value)}
                      placeholder="e.g. Leica Contact Study"
                      className="w-full h-9 px-3 rounded-lg bg-[#080807] border border-white/10 text-sm font-serif text-[#EDE9E2] focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1">
                      SUBHEADLINE / CURATOR NOTE
                    </label>
                    <input
                      type="text"
                      value={config.posterSubheadline}
                      onChange={(e) => updateConfig('posterSubheadline', e.target.value)}
                      placeholder="e.g. Minimalist silver halide darkroom grading"
                      className="w-full h-9 px-3 rounded-lg bg-[#080807] border border-white/10 text-xs text-[#EDE9E2] focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1">
                      CAMERA & OPTICS EXIF
                    </label>
                    <input
                      type="text"
                      value={config.posterExifText}
                      onChange={(e) => updateConfig('posterExifText', e.target.value)}
                      placeholder="e.g. LEICA M6 TTL · 35MM SUMMILUX · 1/250S"
                      className="w-full h-9 px-3 rounded-lg bg-[#080807] border border-white/10 text-xs font-mono text-[#EDE9E2] focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-mono text-zinc-300">
                      5-Color Film Palette Swatches
                    </span>
                    <input
                      type="checkbox"
                      checked={config.posterShowPaletteSwatches}
                      onChange={(e) => updateConfig('posterShowPaletteSwatches', e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-300">
                      Show Archival EXIF Bar
                    </span>
                    <input
                      type="checkbox"
                      checked={config.posterShowExif}
                      onChange={(e) => updateConfig('posterShowExif', e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Multi-Image Film Strip Controls */}
              {config.mode === 'FILM_STRIP' && (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
                      Strip Orientation & Rails
                    </label>
                    <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-white/10">
                      <button
                        type="button"
                        onClick={() => updateConfig('filmStripOrientation', 'VERTICAL')}
                        className={`px-2 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                          config.filmStripOrientation === 'VERTICAL'
                            ? 'bg-amber-500 text-black font-semibold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Vertical
                      </button>
                      <button
                        type="button"
                        onClick={() => updateConfig('filmStripOrientation', 'HORIZONTAL')}
                        className={`px-2 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                          config.filmStripOrientation === 'HORIZONTAL'
                            ? 'bg-amber-500 text-black font-semibold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Horizontal
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-300">
                      35mm Perforated Sprocket Holes
                    </span>
                    <input
                      type="checkbox"
                      checked={config.filmStripShowSprockets}
                      onChange={(e) => updateConfig('filmStripShowSprockets', e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1">
                      EDGE CODE REBATE MARKINGS
                    </label>
                    <input
                      type="text"
                      value={config.filmStripEdgeCode}
                      onChange={(e) => updateConfig('filmStripEdgeCode', e.target.value)}
                      placeholder="e.g. KODAK SAFETY FILM 5063"
                      className="w-full h-9 px-3 rounded-lg bg-[#080807] border border-white/10 text-xs font-mono text-[#EDE9E2] focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  {/* Multi-Image Slots */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-[#EDE9E2]">
                        Roll Frames ({filmStripSlots.length} / 6)
                      </span>
                      <button
                        type="button"
                        onClick={() => multiUploadInputRef.current?.click()}
                        disabled={filmStripSlots.length >= 6}
                        className="px-2.5 py-1.5 rounded-lg bg-[#E59838]/15 border border-[#E59838]/40 hover:bg-[#E59838]/25 text-[#F6C47B] text-xs font-mono flex items-center gap-1.5 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        <span>Add Photos</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {filmStripSlots.map((slot, index) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#080807] border border-white/10 group hover:border-amber-500/30 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-[10px] font-mono text-zinc-500 w-4 text-center">
                              {index + 1}
                            </span>
                            <img
                              src={slot.image.src}
                              alt={slot.title}
                              className="w-9 h-9 rounded object-cover border border-white/10"
                            />
                            <span className="text-xs font-mono text-[#EDE9E2] truncate max-w-[130px]">
                              {slot.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveSlot(index, -1)}
                              disabled={index === 0}
                              className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer"
                              title="Move Frame Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSlot(index, 1)}
                              disabled={index === filmStripSlots.length - 1}
                              className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer"
                              title="Move Frame Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSlot(slot.id)}
                              disabled={filmStripSlots.length <= 1}
                              className="p-1.5 text-zinc-400 hover:text-red-400 disabled:opacity-20 cursor-pointer"
                              title="Delete Frame"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Export Output Format & Quality */}
              <div className="pt-4 border-t border-white/20 space-y-2">
                <label className="text-[10px] font-mono tracking-widest text-zinc-400 font-bold uppercase block">
                  04.6 // EXPORT ENCODING
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateConfig('format', 'png')}
                    className={`py-2 px-3 border text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                      config.format === 'png'
                        ? 'bg-white text-black border-white'
                        : 'bg-black border-white/20 text-zinc-400 hover:border-white hover:text-white'
                    }`}
                  >
                    [01] LOSSLESS PNG (300 DPI)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateConfig('format', 'jpeg')}
                    className={`py-2 px-3 border text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                      config.format === 'jpeg'
                        ? 'bg-white text-black border-white'
                        : 'bg-black border-white/20 text-zinc-400 hover:border-white hover:text-white'
                    }`}
                  >
                    [02] HIGH-Q JPEG (95%)
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 border-t border-white/20 bg-black flex items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadPrint}
                disabled={isExporting}
                className="flex-1 py-3 px-4 bg-white hover:bg-zinc-200 text-black text-xs font-mono font-black tracking-widest uppercase flex items-center justify-center gap-2 border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.4)] transition-colors cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin h-3.5 w-3.5 border-2 border-black border-t-transparent" />
                    <span>[RENDERING 300 DPI ARCHIVE...]</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>[SAVED TO DISK]</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>[DOWNLOAD HIGH-RESOLUTION PRINT]</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
