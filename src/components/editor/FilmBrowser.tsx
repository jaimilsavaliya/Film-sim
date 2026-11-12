'use client';

import React, { useMemo } from 'react';
import { useEditorStore } from '@/lib/store';
import { films, categories, type FilmCategory } from '@/lib/films';
import { Search, Star, X, Film, Sparkles } from 'lucide-react';

// Extract ISO speed from film name/id
function extractISO(name: string): string {
  const match = name.match(/\b(25|50|64|100|160|200|400|800|1600|3200)\b/);
  return match ? `ISO ${match[1]}` : 'STD';
}

// Color accents for film packaging aesthetics
const categoryBadges: Record<FilmCategory, { border: string; bg: string; dot: string; text: string }> = {
  'Color Negative': {
    border: 'border-amber-500/30 group-hover:border-amber-500/60',
    bg: 'from-amber-950/20 to-zinc-900/60',
    dot: 'bg-amber-500',
    text: 'text-amber-400',
  },
  'Slide Film': {
    border: 'border-blue-500/30 group-hover:border-blue-500/60',
    bg: 'from-blue-950/20 to-zinc-900/60',
    dot: 'bg-blue-400',
    text: 'text-blue-400',
  },
  'Black & White': {
    border: 'border-zinc-500/30 group-hover:border-zinc-400/60',
    bg: 'from-zinc-800/30 to-zinc-900/60',
    dot: 'bg-zinc-300',
    text: 'text-zinc-300',
  },
  'Cinema & Print': {
    border: 'border-rose-500/30 group-hover:border-rose-500/60',
    bg: 'from-rose-950/20 to-zinc-900/60',
    dot: 'bg-rose-500',
    text: 'text-rose-400',
  },
  'Instant Film': {
    border: 'border-emerald-500/30 group-hover:border-emerald-500/60',
    bg: 'from-emerald-950/20 to-zinc-900/60',
    dot: 'bg-emerald-400',
    text: 'text-emerald-400',
  },
  'Fuji X-Trans III': {
    border: 'border-indigo-500/30 group-hover:border-indigo-500/60',
    bg: 'from-indigo-950/20 to-zinc-900/60',
    dot: 'bg-indigo-400',
    text: 'text-indigo-400',
  },
};

export default function FilmBrowser() {
  const selectedFilm = useEditorStore(s => s.selectedFilm);
  const setSelectedFilm = useEditorStore(s => s.setSelectedFilm);
  const categoryFilter = useEditorStore(s => s.categoryFilter);
  const setCategoryFilter = useEditorStore(s => s.setCategoryFilter);
  const searchQuery = useEditorStore(s => s.searchQuery);
  const setSearchQuery = useEditorStore(s => s.setSearchQuery);
  const applyFilmDefaults = useEditorStore(s => s.applyFilmDefaults);
  const favorites = useEditorStore(s => s.favorites);
  const toggleFavorite = useEditorStore(s => s.toggleFavorite);
  const image = useEditorStore(s => s.image);

  // Filtered films list
  const filteredFilms = useMemo(() => {
    return films.filter(film => {
      if (categoryFilter === 'Favorites') {
        if (!favorites.includes(film.id)) return false;
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
  }, [categoryFilter, searchQuery, favorites]);

  const handleSelectFilm = (film: typeof films[0]) => {
    setSelectedFilm(film);
    if (image) {
      applyFilmDefaults(film);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d10] select-none">
      {/* Search Bar */}
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 295 film stocks..."
            className="w-full pl-8.5 pr-8 py-2 bg-zinc-900/90 border border-white/10 rounded-lg text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all"
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
        
        {/* Match Counter */}
        <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-zinc-500 px-1">
          <span>CATALOG</span>
          <span>{filteredFilms.length} / {films.length} STOCKS</span>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex overflow-x-auto gap-1.5 px-3 py-2 border-b border-white/10 scrollbar-hide">
        <button
          onClick={() => setCategoryFilter('All')}
          className={`flex-shrink-0 px-2.5 py-1 rounded-md text-[11px] font-mono tracking-tight transition-all cursor-pointer ${
            categoryFilter === 'All'
              ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-white/5'
          }`}
        >
          ALL ({films.length})
        </button>

        <button
          onClick={() => setCategoryFilter('Favorites')}
          className={`flex-shrink-0 px-2.5 py-1 rounded-md text-[11px] font-mono tracking-tight flex items-center gap-1 transition-all cursor-pointer ${
            categoryFilter === 'Favorites'
              ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
              : 'bg-zinc-900 text-amber-500/80 hover:text-amber-400 border border-white/5'
          }`}
        >
          <Star className="w-3 h-3 fill-current" />
          <span>FAVORITES ({favorites.length})</span>
        </button>

        {categories.map(cat => {
          const count = films.filter(f => f.category === cat).length;
          const isActive = categoryFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-md text-[11px] font-mono tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-white/5'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Film Stock Grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredFilms.map((film) => {
          const isSelected = selectedFilm?.id === film.id;
          const isFavorite = favorites.includes(film.id);
          const badge = categoryBadges[film.category] || categoryBadges['Color Negative'];
          const iso = extractISO(film.name);

          return (
            <div
              key={`${film.id}-${film.lut}`}
              onClick={() => handleSelectFilm(film)}
              className={`group relative flex flex-col p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-br from-zinc-800 to-zinc-900 border-white/60 shadow-[0_0_16px_rgba(255,255,255,0.08)] ring-1 ring-white/30'
                  : `bg-zinc-900/60 hover:bg-zinc-800/60 border-white/5 hover:border-white/20`
              }`}
            >
              {/* Header row: Name + Favorite Star */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    <h4 className="text-xs font-bold text-zinc-100 font-mono tracking-wide truncate">
                      {film.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-white/5 font-semibold">
                      {iso}
                    </span>
                    <span className={`text-[10px] font-mono truncate ${badge.text}`}>
                      {film.category}
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
                  title={isFavorite ? 'Remove Favorite' : 'Save to Favorites'}
                  className={`p-1 rounded-md transition-colors ${
                    isFavorite 
                      ? 'text-amber-400 hover:text-amber-300' 
                      : 'text-zinc-600 hover:text-zinc-400 opacity-40 group-hover:opacity-100'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
                </button>
              </div>

              {/* Description */}
              <p className="text-[11px] text-zinc-500 mt-2 line-clamp-1 leading-snug">
                {film.description}
              </p>

              {/* Active Selection Indicator */}
              {isSelected && (
                <div className="absolute right-2 bottom-2 text-[9px] font-mono font-bold tracking-widest text-amber-400 px-1.5 py-0.5 bg-amber-950/40 border border-amber-500/30 rounded">
                  LOADED
                </div>
              )}
            </div>
          );
        })}

        {filteredFilms.length === 0 && (
          <div className="text-center py-12 px-4 space-y-2">
            <Film className="w-8 h-8 text-zinc-600 mx-auto" />
            <div className="text-xs font-mono text-zinc-400">NO FILM STOCKS FOUND</div>
            <p className="text-[11px] text-zinc-600">Try adjusting your search terms or category filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
