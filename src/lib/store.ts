import { create } from 'zustand';
import { type FilmStock, type FilmCategory } from './films';

export interface EditorState {
  // Image
  image: HTMLImageElement | null;
  imageUrl: string | null;
  rawFormat: string | null;
  
  // Film
  selectedFilm: FilmStock | null;
  categoryFilter: FilmCategory | 'All' | 'Favorites';
  searchQuery: string;
  favorites: string[];
  
  // Settings
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
  
  // UI
  showBeforeAfter: boolean;
  comparePosition: number;
  isLoading: boolean;
  isExporting: boolean;
  isExportStudioOpen: boolean;
  exportStudioInitialMode: 'RAW_FRAME' | 'POLAROID' | 'POSTER' | 'FILM_STRIP';
  activeControlTab: 'film' | 'tone' | 'effects';
  
  // Actions
  setImage: (image: HTMLImageElement | null, url: string | null, rawFormat?: string | null) => void;
  setRawFormat: (format: string | null) => void;
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
  setShowBeforeAfter: (show: boolean) => void;
  setComparePosition: (pos: number) => void;
  setIsLoading: (loading: boolean) => void;
  setIsExporting: (exporting: boolean) => void;
  setIsExportStudioOpen: (open: boolean) => void;
  openExportStudio: (mode?: 'RAW_FRAME' | 'POLAROID' | 'POSTER' | 'FILM_STRIP') => void;
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
