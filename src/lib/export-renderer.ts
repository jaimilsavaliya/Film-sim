/**
 * Darkroom Print & Export Studio - Canvas Rendering Engine
 * Renders high-resolution Polaroid, Instax, Editorial Poster, Multi-Image 35mm Film Strip, and Standard Full-Bleed frames.
 */

export type ExportTemplateMode = 'RAW_FRAME' | 'POLAROID' | 'POSTER' | 'FILM_STRIP';
export type PaperTheme = 'WARM_IVORY' | 'PURE_ALABASTER' | 'OBSIDIAN_MATTE';
export type FilmStripOrientation = 'VERTICAL' | 'HORIZONTAL';

export type PolaroidFilmType = 
  | 'POLAROID_600'
  | 'POLAROID_I_TYPE'
  | 'POLAROID_SX_70'
  | 'POLAROID_GO'
  | 'POLAROID_810'
  | 'INSTAX_MINI'
  | 'INSTAX_SQUARE'
  | 'INSTAX_WIDE_H'
  | 'INSTAX_WIDE_V';

export interface PolaroidProfile {
  id: PolaroidFilmType;
  name: string;
  badge: string;
  iso: string;
  subtitle: string;
  cardMm: string;
  imageMm: string;
  cardW: number;
  cardH: number;
  padSide: number;
  padTop: number;
  photoW: number;
  photoH: number;
  cornerRadius: number;
  defaultStamp: string;
  hasRainbowStripe: boolean;
  hasPodMarks: boolean;
  brand: 'polaroid' | 'instax';
}

/**
 * Exact physical millimeter dimensions referenced from standard instant film specifications:
 * - Polaroid Standard (600, i-Type, SX-70): 88 × 107mm card, 79 × 79mm image
 * - Polaroid Go: 53.9 × 66.6mm card, 47 × 46mm image
 * - Polaroid 810: 203.2 × 254mm (8×10") sheet, 190.5 × 241.3mm image
 * - Instax Mini: 54 × 85mm card, 46 × 62mm image
 * - Instax Square: 72 × 86mm card, 62 × 62mm image
 * - Instax Wide Horizontal: 108 × 85mm card, 99 × 62mm image
 * - Instax Wide Vertical: 85 × 108mm card, 62 × 99mm image
 */
export const POLAROID_PROFILES: Record<PolaroidFilmType, PolaroidProfile> = {
  POLAROID_600: {
    id: 'POLAROID_600',
    name: 'Polaroid 600 Film',
    badge: '600 FILM',
    iso: 'ISO 640',
    subtitle: 'Classic 1:1 Instant Card',
    cardMm: '88 × 107 mm',
    imageMm: '79 × 79 mm',
    cardW: 1200,
    cardH: 1459, // 107 / 88 * 1200
    padSide: 61,  // 4.5 / 88 * 1200
    padTop: 68,   // 5.0 / 107 * 1459
    photoW: 1077, // 79 / 88 * 1200
    photoH: 1077, // 79 / 79 1:1 square
    cornerRadius: 0,
    defaultStamp: 'POLAROID 600 · 88×107MM · ISO 640',
    hasRainbowStripe: true,
    hasPodMarks: false,
    brand: 'polaroid',
  },
  POLAROID_I_TYPE: {
    id: 'POLAROID_I_TYPE',
    name: 'Polaroid i-Type Film',
    badge: 'i-TYPE',
    iso: 'ISO 640',
    subtitle: 'Modern Battery-Free Card',
    cardMm: '88 × 107 mm',
    imageMm: '79 × 79 mm',
    cardW: 1200,
    cardH: 1459,
    padSide: 61,
    padTop: 68,
    photoW: 1077,
    photoH: 1077,
    cornerRadius: 0,
    defaultStamp: 'POLAROID i-TYPE · 88×107MM · ISO 640',
    hasRainbowStripe: false,
    hasPodMarks: false,
    brand: 'polaroid',
  },
  POLAROID_SX_70: {
    id: 'POLAROID_SX_70',
    name: 'Polaroid SX-70 Film',
    badge: 'SX-70',
    iso: 'ISO 160',
    subtitle: 'Vintage Folding SLR Frame',
    cardMm: '88 × 107 mm',
    imageMm: '79 × 79 mm',
    cardW: 1200,
    cardH: 1459,
    padSide: 61,
    padTop: 68,
    photoW: 1077,
    photoH: 1077,
    cornerRadius: 0,
    defaultStamp: 'POLAROID SX-70 · 88×107MM · ISO 160 · TIME-ZERO',
    hasRainbowStripe: false,
    hasPodMarks: false,
    brand: 'polaroid',
  },
  POLAROID_GO: {
    id: 'POLAROID_GO',
    name: 'Polaroid Go Film',
    badge: 'GO MINI',
    iso: 'ISO 640',
    subtitle: 'Pocket-Sized Compact Mini',
    cardMm: '53.9 × 66.6 mm',
    imageMm: '47 × 46 mm',
    cardW: 1000,
    cardH: 1236, // 66.6 / 53.9 * 1000
    padSide: 64,  // 3.45 / 53.9 * 1000
    padTop: 70,   // 3.8 / 66.6 * 1236
    photoW: 872,  // 47.0 / 53.9 * 1000
    photoH: 854,  // 46.0 / 66.6 * 1236 (authentic 47×46mm ratio!)
    cornerRadius: 16,
    defaultStamp: 'POLAROID GO · 53.9×66.6MM · ISO 640',
    hasRainbowStripe: false,
    hasPodMarks: false,
    brand: 'polaroid',
  },
  POLAROID_810: {
    id: 'POLAROID_810',
    name: 'Polaroid 810 Film',
    badge: '8x10 SHEET',
    iso: 'ISO 640',
    subtitle: 'Large Format 8×10" Sheet',
    cardMm: '203.2 × 254 mm (8×10")',
    imageMm: '175 × 211 mm',
    cardW: 1600,
    cardH: 2000, // 8:10 = 4:5 ratio
    padSide: 110, // Symmetrical: (1600 - 1380) / 2
    padTop: 80,
    photoW: 1380,
    photoH: 1660,
    cornerRadius: 0,
    defaultStamp: 'POLAROID 810 · LARGE FORMAT 8x10 · ARCHIVAL PRINT',
    hasRainbowStripe: false,
    hasPodMarks: true,
    brand: 'polaroid',
  },
  INSTAX_MINI: {
    id: 'INSTAX_MINI',
    name: 'Instax Mini Film',
    badge: 'MINI',
    iso: 'ISO 800',
    subtitle: 'Credit Card Portrait Frame',
    cardMm: '54 × 85 mm',
    imageMm: '46 × 62 mm',
    cardW: 960,
    cardH: 1511, // 85 / 54 * 960
    padSide: 71,  // 4.0 / 54 * 960
    padTop: 80,   // 4.5 / 85 * 1511
    photoW: 818,  // 46 / 54 * 960
    photoH: 1102, // 62 / 85 * 1511 (authentic 46×62mm ratio)
    cornerRadius: 10,
    defaultStamp: 'FUJIFILM INSTAX MINI · 54×85MM · ISO 800',
    hasRainbowStripe: false,
    hasPodMarks: false,
    brand: 'instax',
  },
  INSTAX_SQUARE: {
    id: 'INSTAX_SQUARE',
    name: 'Instax Square Film',
    badge: 'SQUARE',
    iso: 'ISO 800',
    subtitle: 'Square Modern Instant Frame',
    cardMm: '72 × 86 mm',
    imageMm: '62 × 62 mm',
    cardW: 1080,
    cardH: 1290, // 86 / 72 * 1080
    padSide: 75,  // 5.0 / 72 * 1080
    padTop: 75,   // 5.0 / 86 * 1290
    photoW: 930,  // 62 / 72 * 1080
    photoH: 930,  // 62 / 62 square
    cornerRadius: 10,
    defaultStamp: 'FUJIFILM INSTAX SQUARE · 72×86MM · ISO 800',
    hasRainbowStripe: false,
    hasPodMarks: false,
    brand: 'instax',
  },
  INSTAX_WIDE_H: {
    id: 'INSTAX_WIDE_H',
    name: 'Instax Wide (Horizontal)',
    badge: 'WIDE (H)',
    iso: 'ISO 800',
    subtitle: 'Landscape Wide Instant Frame',
    cardMm: '108 × 85 mm',
    imageMm: '99 × 62 mm',
    cardW: 1520,
    cardH: 1196, // 85 / 108 * 1520
    padSide: 63,  // 4.5 / 108 * 1520
    padTop: 63,   // 4.5 / 85 * 1196
    photoW: 1394, // 99 / 108 * 1520
    photoH: 873,  // 62 / 85 * 1196 (wide 99×62mm horizontal)
    cornerRadius: 10,
    defaultStamp: 'FUJIFILM INSTAX WIDE · 108×85MM · ISO 800',
    hasRainbowStripe: false,
    hasPodMarks: false,
    brand: 'instax',
  },
  INSTAX_WIDE_V: {
    id: 'INSTAX_WIDE_V',
    name: 'Instax Wide (Vertical)',
    badge: 'WIDE (V)',
    iso: 'ISO 800',
    subtitle: 'Portrait Wide Instant Frame',
    cardMm: '85 × 108 mm',
    imageMm: '62 × 99 mm',
    cardW: 1196,
    cardH: 1520, // 108 / 85 * 1196
    padSide: 63,  // 4.5 / 85 * 1196 (authentic 4.5mm left border)
    padTop: 63,   // 4.5 / 108 * 1520 (authentic 4.5mm top border)
    photoW: 873,  // 62 / 85 * 1196 (authentic 62 × 99 mm vertical window)
    photoH: 1394, // 99 / 108 * 1520 (authentic 4.5mm bottom border: 1520 - 63 - 1394 = 63px)
    cornerRadius: 10,
    defaultStamp: 'FUJIFILM INSTAX WIDE VERTICAL · 85×108MM · ISO 800',
    hasRainbowStripe: false,
    hasPodMarks: false,
    brand: 'instax',
  },
};

export interface ExportStockMetadata {
  id: string;
  name: string;
  brand: string;
  iso: string;
  process: string;
  characterNote: string;
}

export interface ExportStudioConfig {
  mode: ExportTemplateMode;
  paperTheme: PaperTheme;
  polaroidFilmType: PolaroidFilmType;
  format: 'png' | 'jpeg';
  quality: number; // 0.8 - 1.0
  // Polaroid Options
  polaroidCaption: string;
  polaroidDateStamp: string;
  polaroidShowStockStamp: boolean;
  polaroidShowRainbow: boolean;
  // Poster Options
  posterHeadline: string;
  posterSubheadline: string;
  posterShowExif: boolean;
  posterExifText: string;
  posterFooterRightText: string;
  posterShowPaletteSwatches: boolean;
  // Film Strip Options
  filmStripOrientation: FilmStripOrientation;
  filmStripGap: number; // 12 - 36
  filmStripShowSprockets: boolean;
  filmStripEdgeCode: string;
}

export interface FilmStripSlotItem {
  id: string;
  title: string;
  image: HTMLImageElement;
}

export const PAPER_PALETTES: Record<
  PaperTheme,
  {
    bg: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
  }
> = {
  WARM_IVORY: {
    bg: '#F4EFE6',
    border: '#DDD5C7',
    textPrimary: '#171513',
    textSecondary: '#57524B',
    textMuted: '#8A8277',
    accent: '#C87D20',
  },
  PURE_ALABASTER: {
    bg: '#FAFAFA',
    border: '#E4E4E7',
    textPrimary: '#111111',
    textSecondary: '#52525B',
    textMuted: '#A1A1AA',
    accent: '#B45309',
  },
  OBSIDIAN_MATTE: {
    bg: '#0E0D0C',
    border: '#262320',
    textPrimary: '#EDE9E2',
    textSecondary: '#9E978E',
    textMuted: '#666059',
    accent: '#E59838',
  },
};

/**
 * Draws an image or canvas center-cropped ("object-fit: cover") into a destination rectangle.
 */
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement | HTMLImageElement,
  dx: number,
  dy: number,
  dWidth: number,
  dHeight: number
) {
  const sWidth = 'naturalWidth' in source ? (source.naturalWidth || source.width) : source.width;
  const sHeight = 'naturalHeight' in source ? (source.naturalHeight || source.height) : source.height;
  if (!sWidth || !sHeight) return;

  const sRatio = sWidth / sHeight;
  const dRatio = dWidth / dHeight;

  let sx = 0;
  let sy = 0;
  let sw = sWidth;
  let sh = sHeight;

  if (sRatio > dRatio) {
    sw = sHeight * dRatio;
    sx = (sWidth - sw) / 2;
  } else {
    sh = sWidth / dRatio;
    sy = (sHeight - sh) / 2;
  }

  ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dWidth, dHeight);
}

/**
 * Extracts 5 representative color swatches from a canvas for the Poster palette bar.
 */
export function sampleCanvasPalette(canvas: HTMLCanvasElement): string[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return ['#24211E', '#574B3D', '#8C7458', '#C4A47C', '#E6D7C3'];

  const sampleCoords = [
    [0.2, 0.25],
    [0.5, 0.3],
    [0.8, 0.35],
    [0.35, 0.7],
    [0.7, 0.75],
  ];

  try {
    return sampleCoords.map(([nx, ny]) => {
      const x = Math.min(canvas.width - 1, Math.max(0, Math.floor(nx * canvas.width)));
      const y = Math.min(canvas.height - 1, Math.max(0, Math.floor(ny * canvas.height)));
      const px = ctx.getImageData(x, y, 1, 1).data;
      return `rgb(${px[0]}, ${px[1]}, ${px[2]})`;
    });
  } catch (e) {
    return ['#24211E', '#574B3D', '#8C7458', '#C4A47C', '#E6D7C3'];
  }
}

/**
 * Default helper that converts an HTMLImageElement into an offscreen HTMLCanvasElement.
 */
export function defaultImageToCanvas(
  img: HTMLImageElement,
  maxDim = 1600
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const natW = img.naturalWidth || img.width || 1000;
  const natH = img.naturalHeight || img.height || 1000;
  const scale = Math.min(1, maxDim / Math.max(natW, natH));
  canvas.width = Math.max(1, Math.round(natW * scale));
  canvas.height = Math.max(1, Math.round(natH * scale));
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

/**
 * Main Export Composition Renderer:
 * Supports RAW_FRAME, POLAROID (with mm-exact sizes for 600, i-Type, SX-70, Go, 810, and Instax), POSTER, and FILM_STRIP.
 */
export function renderExportComposition(
  targetCanvas: HTMLCanvasElement,
  primaryImage: HTMLImageElement,
  filmStripItems: FilmStripSlotItem[],
  stock: ExportStockMetadata | null,
  config: ExportStudioConfig,
  options?: {
    maxResolution?: number;
    /** Optional hook to apply your project's LUT / color grading to each image */
    gradeImageFn?: (img: HTMLImageElement, maxDim: number) => HTMLCanvasElement;
  }
): void {
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  const maxResolution = options?.maxResolution ?? 1800;
  const renderGraded =
    options?.gradeImageFn ??
    ((img: HTMLImageElement, maxDim: number) => defaultImageToCanvas(img, maxDim));

  // 1. RAW GRADED FRAME
  if (config.mode === 'RAW_FRAME') {
    const graded = renderGraded(primaryImage, maxResolution);
    targetCanvas.width = graded.width;
    targetCanvas.height = graded.height;
    ctx.drawImage(graded, 0, 0);
    return;
  }

  const gradedPrimary = renderGraded(
    primaryImage,
    Math.round(maxResolution * 0.85)
  );
  const palette = PAPER_PALETTES[config.paperTheme] || PAPER_PALETTES.WARM_IVORY;

  // 2. INSTANT POLAROID & INSTAX FRAMES (mm-accurate to physical specs)
  if (config.mode === 'POLAROID') {
    const filmType = config.polaroidFilmType || 'POLAROID_600';
    const profile = POLAROID_PROFILES[filmType] || POLAROID_PROFILES.POLAROID_600;
    const { cardW, cardH, padSide, padTop, photoW, photoH, cornerRadius, hasRainbowStripe, hasPodMarks } = profile;

    targetCanvas.width = cardW;
    targetCanvas.height = cardH;

    // Paper background & outer border
    ctx.fillStyle = palette.bg;
    if (cornerRadius > 0 && typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(0, 0, cardW, cardH, cornerRadius);
      ctx.fill();
      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.fillRect(0, 0, cardW, cardH);
      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, cardW - 2, cardH - 2);
    }

    // Large Format 810 darkroom chemical pod & clip marks
    if (hasPodMarks) {
      ctx.fillStyle = palette.border;
      const podW = 180;
      const podH = 14;
      ctx.fillRect(cardW / 2 - podW / 2, 8, podW, podH);

      // Darkroom sheet processing tabs
      const clipW = 34;
      const clipH = 10;
      ctx.fillRect(padSide - 6, 10, clipW, clipH);
      ctx.fillRect(cardW - padSide - clipW + 6, 10, clipW, clipH);
      ctx.fillRect(padSide - 6, cardH - 22, clipW, clipH);
      ctx.fillRect(cardW - padSide - clipW + 6, cardH - 22, clipW, clipH);
    }

    // Inner photo dark backing & cropped image
    ctx.fillStyle = '#080807';
    ctx.fillRect(padSide - 2, padTop - 2, photoW + 4, photoH + 4);
    drawImageCover(ctx, gradedPrimary, padSide, padTop, photoW, photoH);

    // Subtle inner border
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 2;
    ctx.strokeRect(padSide, padTop, photoW, photoH);

    // ---------------------------------------------------------
    // Bulletproof Adaptive Chin Typography & Layout
    // ---------------------------------------------------------
    const chinTop = padTop + photoH;
    const chinHeight = cardH - chinTop;
    const scaleFactor = Math.max(0.75, Math.min(1.25, cardH / 1460));

    // Polaroid 600 Rainbow Spectrum Bar
    const showRainbow = (hasRainbowStripe || filmType === 'POLAROID_600') && config.polaroidShowRainbow !== false;
    let rainbowBottomY = chinTop;

    if (showRainbow) {
      const rainbowColors = ['#E53935', '#FB8C00', '#FDD835', '#43A047', '#1E88E5'];
      const stripeW = Math.round(20 * scaleFactor);
      const stripeH = Math.round(6 * scaleFactor);
      const totalW = rainbowColors.length * stripeW;
      const startX = cardW / 2 - totalW / 2;
      const rainbowY = chinTop + Math.max(12, Math.round(chinHeight * 0.08));

      rainbowColors.forEach((col, idx) => {
        ctx.fillStyle = col;
        ctx.fillRect(startX + idx * stripeW, rainbowY, stripeW, stripeH);
      });

      rainbowBottomY = rainbowY + stripeH;
    }

    // Determine content items
    const hasCaption = Boolean(config.polaroidCaption.trim());
    const metaParts: string[] = [];
    if (config.polaroidShowStockStamp) {
      metaParts.push(profile.defaultStamp);
    }
    if (config.polaroidDateStamp.trim()) {
      metaParts.push(config.polaroidDateStamp.trim());
    }
    const hasMeta = metaParts.length > 0;
    const metaText = metaParts.join('   ·   ').toUpperCase();

    // ---------------------------------------------------------
    // Dedicated Layout for Instax Wide (Vertical)
    // Physically, Instax Wide film has the wide border/chin along the 108mm edge.
    // In vertical portrait mode (85x108mm card, 62x99mm photo), the wide 260px chin
    // sits on the RIGHT side, while top, left, and bottom borders are thin 63px (4.5mm).
    // Typography is rotated 90° clockwise to run gracefully down the 260px right chin.
    // ---------------------------------------------------------
    if (filmType === 'INSTAX_WIDE_V') {
      const marginStartX = padSide + photoW; // 936px
      const marginWidth = cardW - marginStartX; // 260px
      const marginCenterX = marginStartX + marginWidth / 2; // 1066px
      const centerY = padTop + photoH / 2; // 760px
      const maxTextLength = photoH - 80; // 1314px (guarantees text never clips past photo)

      if (hasCaption && hasMeta) {
        // Two parallel vertical tracks in the 260px right margin
        let captionFont = Math.round(38 * scaleFactor);
        ctx.font = `italic 600 ${captionFont}px "Cormorant Garamond", Georgia, serif`;
        let capWidth = ctx.measureText(config.polaroidCaption.trim()).width;
        if (capWidth > maxTextLength) {
          captionFont = Math.max(16, Math.floor(captionFont * (maxTextLength / capWidth)));
          ctx.font = `italic 600 ${captionFont}px "Cormorant Garamond", Georgia, serif`;
        }

        let stampFont = Math.round(15 * scaleFactor);
        ctx.font = `500 ${stampFont}px "JetBrains Mono", monospace`;
        let metaWidth = ctx.measureText(metaText).width;
        if (metaWidth > maxTextLength) {
          stampFont = Math.max(11, Math.floor(stampFont * (maxTextLength / metaWidth)));
          ctx.font = `500 ${stampFont}px "JetBrains Mono", monospace`;
        }

        // Inner track (Caption): elegant serif handwriting near the photo window
        const captionX = marginStartX + Math.round(marginWidth * 0.38); // ~1035px
        // Outer track (Meta Stamp): clean technical stamp near outer card border
        const metaX = marginStartX + Math.round(marginWidth * 0.70);    // ~1118px

        // Draw rotated Caption (top to bottom)
        ctx.save();
        ctx.translate(captionX, centerY);
        ctx.rotate(Math.PI / 2);
        ctx.font = `italic 600 ${captionFont}px "Cormorant Garamond", Georgia, serif`;
        ctx.fillStyle = palette.textPrimary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.polaroidCaption.trim(), 0, 0);
        ctx.restore();

        // Draw rotated Meta Stamp (top to bottom)
        ctx.save();
        ctx.translate(metaX, centerY);
        ctx.rotate(Math.PI / 2);
        ctx.font = `500 ${stampFont}px "JetBrains Mono", monospace`;
        ctx.fillStyle = palette.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(metaText, 0, 0);
        ctx.restore();

      } else if (hasCaption) {
        // Single Caption centered in the 260px right margin
        let captionFont = Math.round(44 * scaleFactor);
        ctx.font = `italic 600 ${captionFont}px "Cormorant Garamond", Georgia, serif`;
        let capWidth = ctx.measureText(config.polaroidCaption.trim()).width;
        if (capWidth > maxTextLength) {
          captionFont = Math.max(18, Math.floor(captionFont * (maxTextLength / capWidth)));
          ctx.font = `italic 600 ${captionFont}px "Cormorant Garamond", Georgia, serif`;
        }

        ctx.save();
        ctx.translate(marginCenterX, centerY);
        ctx.rotate(Math.PI / 2);
        ctx.font = `italic 600 ${captionFont}px "Cormorant Garamond", Georgia, serif`;
        ctx.fillStyle = palette.textPrimary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.polaroidCaption.trim(), 0, 0);
        ctx.restore();

      } else if (hasMeta) {
        // Single Meta Stamp centered in the 260px right margin
        let stampFont = Math.round(18 * scaleFactor);
        ctx.font = `500 ${stampFont}px "JetBrains Mono", monospace`;
        let metaWidth = ctx.measureText(metaText).width;
        if (metaWidth > maxTextLength) {
          stampFont = Math.max(12, Math.floor(stampFont * (maxTextLength / metaWidth)));
          ctx.font = `500 ${stampFont}px "JetBrains Mono", monospace`;
        }

        ctx.save();
        ctx.translate(marginCenterX, centerY);
        ctx.rotate(Math.PI / 2);
        ctx.font = `500 ${stampFont}px "JetBrains Mono", monospace`;
        ctx.fillStyle = palette.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(metaText, 0, 0);
        ctx.restore();
      }
      return;
    }

    // Calculate usable vertical space in the chin
    // Strictly prevents text from colliding with photo bottom (chinTop) or rainbow bar,
    // and guarantees it never clips off near the card bottom (cardH).
    const topSafeMargin = showRainbow 
      ? Math.max(16, Math.round(chinHeight * 0.08)) 
      : Math.max(22, Math.round(chinHeight * 0.12));
    const usableTop = (showRainbow ? rainbowBottomY : chinTop) + topSafeMargin;
    const bottomSafeMargin = Math.max(20, Math.round(chinHeight * 0.10));
    const usableBottom = cardH - bottomSafeMargin;
    const usableHeight = Math.max(50, usableBottom - usableTop);

    if (hasCaption && hasMeta) {
      // Both Caption and Meta Stamp are present:
      // Proportionally size and vertically position them with ample breathing room.
      let captionFont = Math.round(Math.min(46, Math.max(22, usableHeight * 0.28)) * scaleFactor);
      ctx.font = `italic 600 ${captionFont}px "Cormorant Garamond", Georgia, serif`;
      const maxCaptionW = cardW - 80;
      let capWidth = ctx.measureText(config.polaroidCaption.trim()).width;
      if (capWidth > maxCaptionW) {
        captionFont = Math.max(16, Math.floor(captionFont * (maxCaptionW / capWidth)));
        ctx.font = `italic 600 ${captionFont}px "Cormorant Garamond", Georgia, serif`;
      }

      let stampFont = Math.round(Math.min(18, Math.max(12, usableHeight * 0.13)) * scaleFactor);
      ctx.font = `500 ${stampFont}px "JetBrains Mono", monospace`;
      const maxMetaW = cardW - 60;
      let metaWidth = ctx.measureText(metaText).width;
      if (metaWidth > maxMetaW) {
        stampFont = Math.max(11, Math.floor(stampFont * (maxMetaW / metaWidth)));
        ctx.font = `500 ${stampFont}px "JetBrains Mono", monospace`;
      }

      const captionY = usableTop + usableHeight * 0.35;
      const metaY = usableTop + usableHeight * 0.76;

      // Draw Caption
      ctx.font = `italic 600 ${captionFont}px "Cormorant Garamond", Georgia, serif`;
      ctx.fillStyle = palette.textPrimary;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.polaroidCaption.trim(), cardW / 2, captionY);

      // Draw Meta Stamp
      ctx.font = `500 ${stampFont}px "JetBrains Mono", monospace`;
      ctx.fillStyle = palette.textMuted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(metaText, cardW / 2, metaY);

    } else if (hasCaption) {
      // Only Caption present: vertically centered in chin
      let captionFont = Math.round(Math.min(50, Math.max(24, usableHeight * 0.40)) * scaleFactor);
      ctx.font = `italic 600 ${captionFont}px "Cormorant Garamond", Georgia, serif`;
      const maxCaptionW = cardW - 80;
      let capWidth = ctx.measureText(config.polaroidCaption.trim()).width;
      if (capWidth > maxCaptionW) {
        captionFont = Math.max(18, Math.floor(captionFont * (maxCaptionW / capWidth)));
        ctx.font = `italic 600 ${captionFont}px "Cormorant Garamond", Georgia, serif`;
      }

      const captionY = usableTop + usableHeight * 0.50;
      ctx.fillStyle = palette.textPrimary;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.polaroidCaption.trim(), cardW / 2, captionY);

    } else if (hasMeta) {
      // Only Meta Stamp present: vertically centered in chin
      let stampFont = Math.round(Math.min(20, Math.max(13, usableHeight * 0.20)) * scaleFactor);
      ctx.font = `500 ${stampFont}px "JetBrains Mono", monospace`;
      const maxMetaW = cardW - 60;
      let metaWidth = ctx.measureText(metaText).width;
      if (metaWidth > maxMetaW) {
        stampFont = Math.max(12, Math.floor(stampFont * (maxMetaW / metaWidth)));
        ctx.font = `500 ${stampFont}px "JetBrains Mono", monospace`;
      }

      const metaY = usableTop + usableHeight * 0.50;
      ctx.fillStyle = palette.textMuted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(metaText, cardW / 2, metaY);
    }
    return;
  }

  // 3. EDITORIAL EXHIBITION POSTER (1400 x 1920)
  if (config.mode === 'POSTER') {
    const posterW = 1400;
    const posterH = 1920;
    const padX = 110;
    const padTop = 110;

    targetCanvas.width = posterW;
    targetCanvas.height = posterH;

    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, posterW, posterH);

    // Top archival header
    ctx.fillStyle = palette.textMuted;
    ctx.font = '500 18px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(
      stock
        ? `EMULSION ARCHIVE // ${stock.brand.toUpperCase()}`
        : 'FILMSIM // 35MM OPTICAL ARCHIVE',
      padX,
      padTop
    );

    ctx.textAlign = 'right';
    ctx.fillText(
      stock ? `${stock.iso} · ${stock.process.toUpperCase()}` : '35MM M-SYSTEM',
      posterW - padX,
      padTop
    );

    // Top Hairline
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padX, padTop + 38);
    ctx.lineTo(posterW - padX, padTop + 38);
    ctx.stroke();

    // Main Photograph
    const photoTop = padTop + 68;
    const photoW = posterW - padX * 2;
    const photoH = 1220;

    drawImageCover(ctx, gradedPrimary, padX, photoTop, photoW, photoH);
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(padX, photoTop, photoW, photoH);

    // Editorial Headline & Subheadline
    const footerTop = photoTop + photoH + 58;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = palette.textPrimary;
    ctx.font = '600 68px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(
      config.posterHeadline.trim() || (stock ? stock.name : '35mm Contact Study'),
      padX,
      footerTop
    );

    ctx.fillStyle = palette.textSecondary;
    ctx.font = '400 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      config.posterSubheadline.trim() ||
        (stock ? stock.characterNote : 'Minimalist darkroom color grading'),
      padX,
      footerTop + 82
    );

    // Extracted 5-Color Swatch Palette
    if (config.posterShowPaletteSwatches) {
      const swatches = sampleCanvasPalette(gradedPrimary);
      const swatchSize = 36;
      const swatchGap = 10;
      const totalSwatchW =
        swatches.length * swatchSize + (swatches.length - 1) * swatchGap;
      let startX = posterW - padX - totalSwatchW;

      swatches.forEach((color) => {
        ctx.fillStyle = color;
        ctx.fillRect(startX, footerTop + 14, swatchSize, swatchSize);
        ctx.strokeStyle = palette.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, footerTop + 14, swatchSize, swatchSize);
        startX += swatchSize + swatchGap;
      });
    }

    // Bottom EXIF Bar
    const bottomRuleY = posterH - 125;
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padX, bottomRuleY);
    ctx.lineTo(posterW - padX, bottomRuleY);
    ctx.stroke();

    if (config.posterShowExif) {
      ctx.fillStyle = palette.textMuted;
      ctx.font = '400 19px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(
        config.posterExifText.trim() ||
          'LEICA M6 TTL  ·  35MM SUMMILUX-M F/1.4 ASPH  ·  1/250S',
        padX,
        bottomRuleY + 26
      );

      ctx.textAlign = 'right';
      ctx.fillStyle = palette.accent;
      ctx.fillText(
        config.posterFooterRightText || '35MM SILVER HALIDE PRINT',
        posterW - padX,
        bottomRuleY + 26
      );
    }
    return;
  }

  // 4. MULTI-IMAGE 35MM FILM STRIP / CONTACT ROLL
  if (config.mode === 'FILM_STRIP') {
    const items =
      filmStripItems.length > 0
        ? filmStripItems
        : [{ id: 'primary', title: 'Frame 01', image: primaryImage }];

    const isVertical = config.filmStripOrientation === 'VERTICAL';
    const frameCount = items.length;
    const frameW = isVertical ? 960 : 760;
    const frameH = isVertical ? 680 : 540;
    const gap = Math.round(config.filmStripGap * 1.8);
    const railSize = 115;
    const outerPad = 48;

    const totalW = isVertical
      ? frameW + railSize * 2
      : outerPad * 2 + frameCount * frameW + (frameCount - 1) * gap;
    const totalH = isVertical
      ? outerPad * 2 + frameCount * frameH + (frameCount - 1) * gap
      : frameH + railSize * 2;

    targetCanvas.width = totalW;
    targetCanvas.height = totalH;

    // Celluloid Film Base
    ctx.fillStyle = '#070706';
    ctx.fillRect(0, 0, totalW, totalH);
    ctx.strokeStyle = 'rgba(245, 238, 226, 0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, totalW - 2, totalH - 2);

    // 35mm Perforated Sprocket Holes
    if (config.filmStripShowSprockets) {
      const holeW = isVertical ? 30 : 42;
      const holeH = isVertical ? 44 : 28;
      const step = 92;
      const span = isVertical ? totalH : totalW;

      ctx.fillStyle = '#181715';
      ctx.strokeStyle = 'rgba(245, 238, 226, 0.14)';
      ctx.lineWidth = 1.5;

      for (let pos = 36; pos < span - 36; pos += step) {
        if (isVertical) {
          const lx = Math.round((railSize - holeW) / 2);
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(lx, pos, holeW, holeH, 6);
          } else {
            ctx.rect(lx, pos, holeW, holeH);
          }
          ctx.fill();
          ctx.stroke();

          const rx = Math.round(totalW - railSize + (railSize - holeW) / 2);
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(rx, pos, holeW, holeH, 6);
          } else {
            ctx.rect(rx, pos, holeW, holeH);
          }
          ctx.fill();
          ctx.stroke();
        } else {
          const ty = Math.round((railSize - holeH) / 2);
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(pos, ty, holeW, holeH, 6);
          } else {
            ctx.rect(pos, ty, holeW, holeH);
          }
          ctx.fill();
          ctx.stroke();

          const by = Math.round(totalH - railSize + (railSize - holeH) / 2);
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(pos, by, holeW, holeH, 6);
          } else {
            ctx.rect(pos, by, holeW, holeH);
          }
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    const edgeCodeBase =
      config.filmStripEdgeCode.trim() ||
      (stock ? `${stock.name.toUpperCase()}  ${stock.iso}` : 'KODAK SAFETY FILM 5063');

    // Render each frame in the roll
    items.forEach((slot, idx) => {
      const gradedSlot = renderGraded(slot.image, 1000);
      const fx = isVertical ? railSize : outerPad + idx * (frameW + gap);
      const fy = isVertical ? outerPad + idx * (frameH + gap) : railSize;

      drawImageCover(ctx, gradedSlot, fx, fy, frameW, frameH);

      ctx.strokeStyle = 'rgba(245, 238, 226, 0.16)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(fx, fy, frameW, frameH);

      // Golden-Amber Rebate Frame Numbers (12A, 13A, 14A...)
      const frameNum = 12 + idx;
      ctx.fillStyle = 'rgba(229, 152, 56, 0.78)';
      ctx.font = '500 17px "JetBrains Mono", monospace';

      if (isVertical) {
        ctx.save();
        ctx.translate(railSize - 16, fy + frameH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(edgeCodeBase, 0, 0);
        ctx.restore();

        ctx.save();
        ctx.translate(totalW - railSize + 18, fy + frameH - 44);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`▶ ${frameNum}A`, 0, 0);
        ctx.restore();
      } else {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(edgeCodeBase, fx + 12, railSize - 18);

        ctx.textAlign = 'right';
        ctx.fillText(`▶ ${frameNum}A`, fx + frameW - 12, totalH - railSize + 18);
      }
    });
  }
}
