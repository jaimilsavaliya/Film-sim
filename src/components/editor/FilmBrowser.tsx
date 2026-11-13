'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useEditorStore, DEFAULT_FAVORITES } from '@/lib/store';
import { films, categories, type FilmCategory } from '@/lib/films';
import { Search, Star, X, Film } from 'lucide-react';

// Extract ISO speed from film name/id
function extractISO(name: string): string {
  const match = name.match(/\b(25|50|64|100|160|200|400|800|1600|3200)\b/);
  return match ? `ISO ${match[1]}` : 'STD';
}

const categoryLabels: Record<FilmCategory, string> = {
  'Color Negative': 'COLOR NEG',
  'Slide Film': 'SLIDE E-6',
  'Black & White': 'B&W SILVER',
  'Cinema & Print': 'CINE ECN-2',
  'Instant Film': 'INSTANT',
  'Fuji X-Trans III': 'FUJI X-TRANS',
};

const categoryShortNames: Record<FilmCategory, string> = {
  'Color Negative': 'COLOR',
  'Slide Film': 'SLIDE',
  'Black & White': 'B&W',
  'Cinema & Print': 'CINE',
  'Instant Film': 'INSTANT',
  'Fuji X-Trans III': 'X-TRANS',
};

export default function FilmBrowser() {
  const [isMounted, setIsMounted] = useState(false);
  const selectedFilm = useEditorStore(s => s.selectedFilm);
  const setSelectedFilm = useEditorStore(s => s.setSelectedFilm);
  const categoryFilter = useEditorStore(s => s.categoryFilter);
  const setCategoryFilter = useEditorStore(s => s.setCategoryFilter);
  const searchQuery = useEditorStore(s => s.searchQuery);
  const setSearchQuery = useEditorStore(s => s.setSearchQuery);
  const applyFilmDefaults = useEditorStore(s => s.applyFilmDefaults);
  const favorites = useEditorStore(s => s.favorites);
  const toggleFavorite = useEditorStore(s => s.toggleFavorite);
  const loadFavoritesFromStorage = useEditorStore(s => s.loadFavoritesFromStorage);
  const image = useEditorStore(s => s.image);

  // Synchronize localStorage favorites after initial SSR hydration to avoid mismatch
  useEffect(() => {
    setIsMounted(true);
    loadFavoritesFromStorage();
  }, [loadFavoritesFromStorage]);

  const activeFavorites = isMounted ? favorites : DEFAULT_FAVORITES;

  // Filtered films list
  const filteredFilms = useMemo(() => {
    return films.filter(film => {
      if (categoryFilter === 'Favorites') {
        if (!activeFavorites.includes(film.id)) return false;
      } else if (categoryFilter !== 'All' && film.category !== categoryFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          film.name.toLowerCase().includes(q) ||
          film.category.toLowerCase().includes(q) ||
          film.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [categoryFilter, searchQuery, activeFavorites]);

  const handleSelectFilm = (film: typeof films[0]) => {
    setSelectedFilm(film);
    if (image) {
      applyFilmDefaults(film);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black select-none text-white font-mono">
      {/* Search Bar & Stock Register */}
      <div className="p-3 border-b border-white/20 bg-[#050505]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH 295 EMULSION STOCKS..."
            className="w-full pl-8.5 pr-8 py-2 bg-black border border-white/25 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors uppercase"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        
        {/* Match Register Counter */}
        <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-zinc-400 uppercase tracking-widest px-0.5">
          <span>CATALOG REGISTER</span>
          <span className="font-bold text-white">{filteredFilms.length} / {films.length} STOCKS</span>
        </div>
      </div>

      {/* Numbered Category Tabs */}
      <div className="flex overflow-x-auto gap-1.5 p-2 border-b border-white/15 bg-black scrollbar-hide overscroll-x-contain touch-pan-x">
        <button
          onClick={() => setCategoryFilter('All')}
          className={`flex-shrink-0 px-2 py-1 text-[10px] font-mono font-bold tracking-wider transition-colors cursor-pointer border ${
            categoryFilter === 'All'
              ? 'bg-white text-black border-white'
              : 'bg-black text-zinc-400 hover:text-white border-white/15 hover:border-white/40'
          }`}
        >
          ALL ({films.length})
        </button>

        <button
          onClick={() => setCategoryFilter('Favorites')}
          className={`flex-shrink-0 px-2 py-1 text-[10px] font-mono font-bold tracking-wider flex items-center gap-1 transition-colors cursor-pointer border ${
            categoryFilter === 'Favorites'
              ? 'bg-white text-black border-white'
              : 'bg-black text-zinc-400 hover:text-white border-white/15 hover:border-white/40'
          }`}
        >
          <Star className={`w-3 h-3 ${categoryFilter === 'Favorites' ? 'fill-black' : 'fill-none'}`} />
          <span suppressHydrationWarning>SAVED ({activeFavorites.length})</span>
        </button>

        {categories.map((cat) => {
          const count = films.filter(f => f.category === cat).length;
          const isActive = categoryFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`flex-shrink-0 px-2 py-1 text-[10px] font-mono font-bold tracking-wider transition-colors cursor-pointer whitespace-nowrap border ${
                isActive
                  ? 'bg-white text-black border-white'
                  : 'bg-black text-zinc-400 hover:text-white border-white/15 hover:border-white/40'
              }`}
            >
              {categoryShortNames[cat]} ({count})
            </button>
          );
        })}
      </div>

      {/* Film Stock Numbered Archive Grid */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {filteredFilms.map((film, index) => {
          const isSelected = selectedFilm?.id === film.id;
          const isFavorite = activeFavorites.includes(film.id);
          const iso = extractISO(film.name);
          const itemIndex = String(index + 1).padStart(2, '0');

          return (
            <div
              key={`${film.id}-${film.lut}`}
              onClick={() => handleSelectFilm(film)}
              className={`group relative flex flex-col p-2.5 border text-left transition-colors duration-100 cursor-pointer ${
                isSelected
                  ? 'bg-white text-black border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]'
                  : 'bg-[#080808] hover:bg-[#121212] text-zinc-200 border-white/15 hover:border-white'
              }`}
            >
              {/* Header row: Index + Name + ISO + Favorite Star */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 border ${
                      isSelected ? 'bg-black text-white border-black' : 'bg-white/10 text-zinc-400 border-white/20'
                    }`}>
                      #{itemIndex}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-mono font-black px-1 py-0.2 bg-black text-white tracking-wider uppercase">
                        ACTIVE
                      </span>
                    )}
                    <h4 className={`text-xs font-black font-mono tracking-wide truncate uppercase ${
                      isSelected ? 'text-black' : 'text-white'
                    }`}>
                      {film.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 border font-bold ${
                      isSelected 
                        ? 'bg-black text-white border-black' 
                        : 'bg-black text-zinc-300 border-white/20'
                    }`}>
                      {iso}
                    </span>
                    <span className={`text-[9px] font-mono font-semibold tracking-wider uppercase truncate ${
                      isSelected ? 'text-zinc-700' : 'text-zinc-400'
                    }`}>
                      {categoryLabels[film.category] || film.category}
                    </span>
                  </div>
                </div>

                {/* Favorite Star Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(film.id);
                  }}
                  title={isFavorite ? 'Remove from Saved' : 'Save Emulsion'}
                  className={`p-1 border transition-colors ${
                    isFavorite 
                      ? isSelected 
                        ? 'text-black border-black bg-zinc-200' 
                        : 'text-white border-white bg-zinc-800' 
                      : isSelected
                        ? 'text-zinc-500 border-transparent hover:border-black'
                        : 'text-zinc-600 border-transparent hover:border-white/40'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : 'fill-none'}`} />
                </button>
              </div>

              {/* Description */}
              <p className={`text-[10px] font-mono mt-1.5 line-clamp-1 leading-snug ${
                isSelected ? 'text-zinc-800' : 'text-zinc-400'
              }`}>
                {film.description}
              </p>
            </div>
          );
        })}

        {filteredFilms.length === 0 && (
          <div className="text-center py-12 px-4 space-y-2 border border-dashed border-white/20 m-2">
            <Film className="w-8 h-8 text-zinc-500 mx-auto" />
            <div className="text-xs font-mono font-bold text-white tracking-widest uppercase">
              NO EMULSION ARCHIVE FOUND
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              Adjust search keywords or category filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
