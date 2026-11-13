import { create } from 'zustand';
import { type FilmStock, type FilmCategory } from './films';
import type { ParsedExifMetadata } from '@/utils/exifParser';
import type { HistogramBins } from '@/utils/filmEngine';

export interface EditorState {
  // Image
  image: HTMLImageElement | null;
  imageUrl: string | null;
  rawFormat: string | null;
  parsedExif: ParsedExifMetadata | null;
  histogram: HistogramBins | null;
  
  // Film
  selectedFilm: FilmStock | null;
  categoryFilter: FilmCategory | 'All' | 'Favorites';
  searchQuery: string;
  favorites: string[];
  
  // Settings (Core Sensitometry)
  intensity: number;   // 0 to 100
  grain: number;       // 0 to 100
  softness: number;    // 0 to 100
  halation: number;    // 0 to 100
  vignette: number;    // 0 to 100
  exposure: number;    // -100 to 100
  contrast: number;    // -100 to 100
  saturation: number;  // -100 to 100
  temperature: number; // -100 to 100
  highlights: number;  // -100 to 100
  shadows: number;     // -100 to 100

  // Darkroom Chemical & Optical Addons (from new-addon.md)
  pushPullStops: number;          // -1 to +3 EV chemical bath push/pull
  curveShadowToe: number;         // -100 to +100
  curveMidtoneAnchor: number;      // -100 to +100
  curveHighlightShoulder: number; // -100 to +100
  splitShadowHue: number;         // 0 to 360 deg
  splitShadowSat: number;         // 0 to 100%
  splitHighlightHue: number;      // 0 to 360 deg
  splitHighlightSat: number;      // 0 to 100%
  chromaticAberration: number;    // 0 to 100 lateral color fringe
  lightLeakStyle: 'NONE' | 'AMBER_EDGE' | 'CRIMSON_SPOOL' | 'TUNGSTEN_STREAK';
  lightLeakIntensity: number;    // 0 to 100%
  quartzDateStamp: boolean;       // 90s quartz LED date-back imprint
  quartzDateText: string;         // e.g. '26 11 13
  zoneSystemOverlay: boolean;     // Ansel Adams 11-Zone diagnostic overlay
  
  // UI
  showBeforeAfter: boolean;
  comparePosition: number;
  isLoading: boolean;
  isExporting: boolean;
  isExportStudioOpen: boolean;
  exportStudioInitialMode: 'RAW_FRAME' | 'POLAROID' | 'POSTER' | 'FILM_STRIP' | 'CONTACT_SHEET';
  activeControlTab: 'film' | 'tone' | 'effects';
  
  // Actions
  setImage: (image: HTMLImageElement | null, url: string | null, rawFormat?: string | null) => void;
  setRawFormat: (format: string | null) => void;
  setParsedExif: (exif: ParsedExifMetadata | null) => void;
  setHistogram: (hist: HistogramBins | null) => void;
  setSelectedFilm: (film: FilmStock | null) => void;
  setCategoryFilter: (filter: FilmCategory | 'All' | 'Favorites') => void;
  setSearchQuery: (query: string) => void;
  toggleFavorite: (filmId: string) => void;
  loadFavoritesFromStorage: () => void;
  setIntensity: (value: number) => void;
  setGrain: (value: number) => void;
  setSoftness: (value: number) => void;
  setHalation: (value: number) => void;
  setVignette: (value: number) => void;
  setExposure: (value: number) => void;
  setContrast: (value: number) => void;
  setSaturation: (value: number) => void;
  setTemperature: (value: number) => void;
  setHighlights: (value: number) => void;
  setShadows: (value: number) => void;
  setPushPullStops: (value: number) => void;
  setCurveShadowToe: (value: number) => void;
  setCurveMidtoneAnchor: (value: number) => void;
  setCurveHighlightShoulder: (value: number) => void;
  setSplitShadowHue: (value: number) => void;
  setSplitShadowSat: (value: number) => void;
  setSplitHighlightHue: (value: number) => void;
  setSplitHighlightSat: (value: number) => void;
  setChromaticAberration: (value: number) => void;
  setLightLeakStyle: (value: 'NONE' | 'AMBER_EDGE' | 'CRIMSON_SPOOL' | 'TUNGSTEN_STREAK') => void;
  setLightLeakIntensity: (value: number) => void;
  setQuartzDateStamp: (value: boolean) => void;
  setQuartzDateText: (value: string) => void;
  setZoneSystemOverlay: (value: boolean) => void;
  setShowBeforeAfter: (show: boolean) => void;
  setComparePosition: (pos: number) => void;
  setIsLoading: (loading: boolean) => void;
  setIsExporting: (exporting: boolean) => void;
  setIsExportStudioOpen: (open: boolean) => void;
  openExportStudio: (mode?: 'RAW_FRAME' | 'POLAROID' | 'POSTER' | 'FILM_STRIP' | 'CONTACT_SHEET') => void;
  closeExportStudio: () => void;
  setActiveControlTab: (tab: 'film' | 'tone' | 'effects') => void;
  resetAdjustments: () => void;
  applyFilmDefaults: (film: FilmStock) => void;
}

const initialAdjustments = {
  intensity: 100,
  grain: 0,
  softness: 0,
  halation: 0,
  vignette: 0,
  exposure: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  highlights: 0,
  shadows: 0,
  pushPullStops: 0,
  curveShadowToe: 0,
  curveMidtoneAnchor: 0,
  curveHighlightShoulder: 0,
  splitShadowHue: 205,
  splitShadowSat: 0,
  splitHighlightHue: 38,
  splitHighlightSat: 0,
  chromaticAberration: 0,
  lightLeakStyle: 'NONE' as const,
  lightLeakIntensity: 0,
  quartzDateStamp: false,
  quartzDateText: "'26 11 13",
  zoneSystemOverlay: false,
};

export const DEFAULT_FAVORITES: string[] = [
  'kodak_portra_400',
  'kodak_tri_x_400',
  'fuji_velvia_50',
  'cinestill_800t',
];

export const useEditorStore = create<EditorState>((set, get) => ({
  image: null,
  imageUrl: null,
  rawFormat: null,
  selectedFilm: null,
  categoryFilter: 'All',
  searchQuery: '',
  favorites: DEFAULT_FAVORITES,
  parsedExif: null,
  histogram: null,
  ...initialAdjustments,
  showBeforeAfter: false,
  comparePosition: 50,
  isLoading: false,
  isExporting: false,
  isExportStudioOpen: false,
  exportStudioInitialMode: 'POLAROID',
  activeControlTab: 'film',

  setImage: (image, url, rawFormat = null) => set({ image, imageUrl: url, rawFormat }),
  setRawFormat: (format) => set({ rawFormat: format }),
  setParsedExif: (exif) => set({ parsedExif: exif }),
  setHistogram: (hist) => set({ histogram: hist }),
  setSelectedFilm: (film) => set({ selectedFilm: film }),
  setCategoryFilter: (filter) => set({ categoryFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  loadFavoritesFromStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('filmsim_favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          set({ favorites: parsed });
        }
      }
    } catch (e) {
      // ignore
    }
  },
  
  toggleFavorite: (filmId: string) => {
    const current = get().favorites;
    const exists = current.includes(filmId);
    const updated = exists ? current.filter(id => id !== filmId) : [...current, filmId];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('filmsim_favorites', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
    }
    set({ favorites: updated });
  },

  setIntensity: (value) => set({ intensity: value }),
  setGrain: (value) => set({ grain: value }),
  setSoftness: (value) => set({ softness: value }),
  setHalation: (value) => set({ halation: value }),
  setVignette: (value) => set({ vignette: value }),
  setExposure: (value) => set({ exposure: value }),
  setContrast: (value) => set({ contrast: value }),
  setSaturation: (value) => set({ saturation: value }),
  setTemperature: (value) => set({ temperature: value }),
  setHighlights: (value) => set({ highlights: value }),
  setShadows: (value) => set({ shadows: value }),
  setPushPullStops: (value) => set({ pushPullStops: value }),
  setCurveShadowToe: (value) => set({ curveShadowToe: value }),
  setCurveMidtoneAnchor: (value) => set({ curveMidtoneAnchor: value }),
  setCurveHighlightShoulder: (value) => set({ curveHighlightShoulder: value }),
  setSplitShadowHue: (value) => set({ splitShadowHue: value }),
  setSplitShadowSat: (value) => set({ splitShadowSat: value }),
  setSplitHighlightHue: (value) => set({ splitHighlightHue: value }),
  setSplitHighlightSat: (value) => set({ splitHighlightSat: value }),
  setChromaticAberration: (value) => set({ chromaticAberration: value }),
  setLightLeakStyle: (value) => set({ lightLeakStyle: value }),
  setLightLeakIntensity: (value) => set({ lightLeakIntensity: value }),
  setQuartzDateStamp: (value) => set({ quartzDateStamp: value }),
  setQuartzDateText: (value) => set({ quartzDateText: value }),
  setZoneSystemOverlay: (value) => set({ zoneSystemOverlay: value }),
  setShowBeforeAfter: (show) => set({ showBeforeAfter: show }),
  setComparePosition: (pos) => set({ comparePosition: pos }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsExporting: (exporting) => set({ isExporting: exporting }),
  setIsExportStudioOpen: (open) => set({ isExportStudioOpen: open }),
  openExportStudio: (mode = 'POLAROID') => set({ isExportStudioOpen: true, exportStudioInitialMode: mode }),
  closeExportStudio: () => set({ isExportStudioOpen: false }),
  setActiveControlTab: (tab) => set({ activeControlTab: tab }),
  
  resetAdjustments: () => set({
    ...initialAdjustments,
  }),
  
  applyFilmDefaults: (film) => set({
    grain: Math.round(film.grain * 100),
    softness: Math.round(film.softness * 100),
    halation: Math.round(film.halation * 100),
    vignette: 15,
    intensity: 100,
    exposure: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
    highlights: 0,
    shadows: 0,
  }),
}));
