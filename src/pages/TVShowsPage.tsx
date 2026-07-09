import React, { useState, useMemo } from 'react';
import { Movie, UserProfile } from '../types';
import MovieRow from '../components/MovieRow';
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal, 
  Tv, 
  Sparkles, 
  Clock, 
  Star,
  TrendingUp,
  Grid3X3,
  List,
  PlayCircle,
  Calendar,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TVShowsPageProps {
  movies: Movie[];
  profile: UserProfile;
  onPlay: (movie: Movie) => void;
  onOpenDetails: (movie: Movie) => void;
  onAuthRequired: () => void;
  onNavigate: (path: string) => void;
}

export default function TVShowsPage({ movies, profile, onPlay, onOpenDetails, onAuthRequired, onNavigate }: TVShowsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter TV shows
  const tvShows = useMemo(() => {
    return movies.filter((movie) => movie.mediaType === 'TV Series' || movie.category === 'TV Series');
  }, [movies]);

  // Extract unique genres from TV shows
  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    tvShows.forEach(show => show.genres.forEach(genre => genres.add(genre)));
    return Array.from(genres).sort();
  }, [tvShows]);

  // Extract unique years
  const allYears = useMemo(() => {
    const years = new Set<number>();
    tvShows.forEach(show => years.add(show.releaseYear));
    return Array.from(years).sort((a, b) => b - a);
  }, [tvShows]);

  // Filter and sort TV shows
  const filteredShows = useMemo(() => {
    let filtered = [...tvShows];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(show => 
        show.title.toLowerCase().includes(query) ||
        show.synopsis.toLowerCase().includes(query) ||
        show.genres.some(genre => genre.toLowerCase().includes(query)) ||
        show.cast.some(actor => actor.toLowerCase().includes(query))
      );
    }

    // Genre filter
    if (selectedGenre !== 'all') {
      filtered = filtered.filter(show => show.genres.includes(selectedGenre));
    }

    // Year filter
    if (selectedYear !== 'all') {
      filtered = filtered.filter(show => show.releaseYear === parseInt(selectedYear));
    }

    // Rating filter
    if (selectedRating !== 'all') {
      const minRating = parseFloat(selectedRating);
      filtered = filtered.filter(show => show.rating >= minRating);
    }

    // Sort
    switch (sortBy) {
      case 'title-asc':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'rating-high':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'rating-low':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      case 'year-new':
        filtered.sort((a, b) => b.releaseYear - a.releaseYear);
        break;
      case 'year-old':
        filtered.sort((a, b) => a.releaseYear - b.releaseYear);
        break;
      case 'episodes-high':
        filtered.sort((a, b) => (b.seriesCount || 0) - (a.seriesCount || 0));
        break;
      default:
        break;
    }

    return filtered;
  }, [tvShows, searchQuery, selectedGenre, selectedYear, selectedRating, sortBy]);

  // TV Show categories
  const categories = [
    { 
      title: 'Trending Series', 
      filter: (show: Movie) => show.isTrending,
      icon: TrendingUp,
      color: 'text-red-400',
      bgColor: 'from-red-600/20 to-red-900/20'
    },
    { 
      title: 'Popular Shows', 
      filter: (show: Movie) => show.isPopular,
      icon: Star,
      color: 'text-amber-400',
      bgColor: 'from-amber-600/20 to-amber-900/20'
    },
    { 
      title: 'New Releases', 
      filter: (show: Movie) => show.releaseYear >= 2025,
      icon: Sparkles,
      color: 'text-purple-400',
      bgColor: 'from-purple-600/20 to-purple-900/20'
    },
  ];

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('all');
    setSelectedYear('all');
    setSelectedRating('all');
    setSortBy('default');
  };

  const hasActiveFilters = searchQuery || selectedGenre !== 'all' || selectedYear !== 'all' || selectedRating !== 'all' || sortBy !== 'default';

  // Calculate stats
  const totalEpisodes = tvShows.reduce((sum, show) => sum + (show.seriesCount || 0), 0);
  const avgRating = tvShows.length > 0 
    ? (tvShows.reduce((sum, show) => sum + show.rating, 0) / tvShows.length).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-red-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-800 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-900 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-24 space-y-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="p-3 rounded-xl bg-gradient-to-br from-red-600 to-red-900 shadow-lg shadow-red-900/30"
                >
                  <Tv className="w-6 h-6 text-white" />
                </motion.div>
                <p className="text-xs uppercase tracking-[0.35em] text-red-400 font-bold">TV Shows</p>
              </div>
              <h1 className="text-4xl md:text-5xl font-black">
                <span className="bg-gradient-to-r from-white via-zinc-200 to-red-200 bg-clip-text text-transparent">
                  Binge the Best Series
                </span>
              </h1>
              <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
                Manage episodes, stream from any supported video URL, and organize your series library.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-3 rounded-xl bg-zinc-900/80 border-2 border-zinc-700/50 hover:border-red-800/50 text-zinc-400 hover:text-red-400 transition-all duration-300 backdrop-blur-sm"
                title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('/movies')}
                className="rounded-xl bg-gradient-to-r from-zinc-900/80 to-black/80 border-2 border-zinc-700/50 hover:border-red-800/50 px-5 py-3 text-sm font-semibold text-zinc-400 hover:text-red-400 transition-all duration-300 backdrop-blur-sm flex items-center gap-2"
              >
                <PlayCircle className="w-4 h-4" />
                Browse Movies
              </motion.button>
            </div>
          </div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid gap-4 sm:grid-cols-3"
          >
            <div className="rounded-2xl bg-gradient-to-br from-zinc-950/80 to-black/80 border border-zinc-800/50 p-5 backdrop-blur-sm hover:border-red-800/30 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-800/30">
                  <Tv className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-semibold">Total Shows</p>
              </div>
              <p className="text-2xl font-black text-white">{tvShows.length}</p>
            </div>
            
            <div className="rounded-2xl bg-gradient-to-br from-zinc-950/80 to-black/80 border border-zinc-800/50 p-5 backdrop-blur-sm hover:border-red-800/30 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-800/30">
                  <PlayCircle className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-semibold">Episodes</p>
              </div>
              <p className="text-2xl font-black text-white">{totalEpisodes}</p>
            </div>
            
            <div className="rounded-2xl bg-gradient-to-br from-zinc-950/80 to-black/80 border border-zinc-800/50 p-5 backdrop-blur-sm hover:border-red-800/30 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-600/20 to-amber-900/20 border border-amber-800/30">
                  <Star className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-semibold">Avg Rating</p>
              </div>
              <p className="text-2xl font-black text-white">{avgRating}</p>
            </div>
          </motion.div>

          {/* Search and Filter Bar */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-zinc-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search TV shows, genres, actors..."
                  className="w-full rounded-xl bg-zinc-950/80 border-2 border-zinc-700/50 text-white pl-12 pr-12 py-3.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm"
                />
                {searchQuery && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-zinc-800/80 hover:bg-red-950/30 text-zinc-400 hover:text-red-400 transition-all duration-300"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </div>

              {/* Filter Toggle Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 backdrop-blur-sm border-2 ${
                  showFilters || hasActiveFilters
                    ? 'bg-gradient-to-r from-red-600/20 to-red-900/20 border-red-800/50 text-red-400'
                    : 'bg-zinc-900/80 border-zinc-700/50 text-zinc-400 hover:border-red-800/50 hover:text-red-400'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">
                    !
                  </span>
                )}
              </motion.button>
            </div>

            {/* Expandable Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl bg-gradient-to-br from-zinc-900/90 via-black/90 to-red-950/20 backdrop-blur-xl border border-red-900/20 p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Filter className="w-4 h-4 text-red-400" />
                        Advanced Filters
                      </h3>
                      {hasActiveFilters && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={clearFilters}
                          className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Clear All
                        </motion.button>
                      )}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      {/* Genre Filter */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Genre</label>
                        <select
                          value={selectedGenre}
                          onChange={(e) => setSelectedGenre(e.target.value)}
                          className="w-full rounded-xl bg-zinc-950/80 border-2 border-zinc-700/50 text-white px-4 py-3 text-sm focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm cursor-pointer"
                        >
                          <option value="all">All Genres</option>
                          {allGenres.map(genre => (
                            <option key={genre} value={genre}>{genre}</option>
                          ))}
                        </select>
                      </div>

                      {/* Year Filter */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Year</label>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                          className="w-full rounded-xl bg-zinc-950/80 border-2 border-zinc-700/50 text-white px-4 py-3 text-sm focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm cursor-pointer"
                        >
                          <option value="all">All Years</option>
                          {allYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>

                      {/* Rating Filter */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Min Rating</label>
                        <select
                          value={selectedRating}
                          onChange={(e) => setSelectedRating(e.target.value)}
                          className="w-full rounded-xl bg-zinc-950/80 border-2 border-zinc-700/50 text-white px-4 py-3 text-sm focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm cursor-pointer"
                        >
                          <option value="all">Any Rating</option>
                          <option value="4.5">4.5+ Stars</option>
                          <option value="4.0">4.0+ Stars</option>
                          <option value="3.5">3.5+ Stars</option>
                          <option value="3.0">3.0+ Stars</option>
                        </select>
                      </div>

                      {/* Sort By */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sort By</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full rounded-xl bg-zinc-950/80 border-2 border-zinc-700/50 text-white px-4 py-3 text-sm focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm cursor-pointer"
                        >
                          <option value="default">Default</option>
                          <option value="title-asc">Title (A-Z)</option>
                          <option value="title-desc">Title (Z-A)</option>
                          <option value="rating-high">Highest Rated</option>
                          <option value="rating-low">Lowest Rated</option>
                          <option value="year-new">Newest First</option>
                          <option value="year-old">Oldest First</option>
                          <option value="episodes-high">Most Episodes</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Count */}
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm"
              >
                <Zap className="w-4 h-4 text-red-400" />
                <span className="text-zinc-400">
                  Found <span className="text-red-400 font-bold">{filteredShows.length}</span> TV shows
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* TV Series Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl bg-gradient-to-br from-zinc-900/90 via-black/90 to-red-950/20 backdrop-blur-xl border border-red-900/20 shadow-2xl shadow-red-900/10 p-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-800/30">
                <Tv className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">TV Series Highlights</h2>
                <p className="text-sm text-zinc-400 mt-1">Quick access to series and episodes already in your library.</p>
              </div>
            </div>
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600/20 to-red-900/20 border-2 border-red-800/50 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-red-300 backdrop-blur-sm shadow-lg shadow-red-900/10"
            >
              <Tv className="w-3.5 h-3.5" />
              {tvShows.length} Shows
            </motion.span>
          </div>

          {/* Category Cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {categories.map(({ title, filter, icon: Icon, color, bgColor }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className={`rounded-2xl bg-gradient-to-br ${bgColor} border border-red-800/20 p-5 backdrop-blur-sm transition-all duration-300 group cursor-pointer`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-black/30 border border-white/10">
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <h3 className="text-sm font-bold text-white">{title}</h3>
                </div>
                <p className="text-2xl font-black text-white">{tvShows.filter(filter).length}</p>
                <p className="text-xs text-zinc-400 mt-1">series available</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Category Rows */}
        {categories.map(({ title, filter }, index) => {
          const categoryShows = tvShows.filter(filter);
          return categoryShows.length > 0 ? (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <MovieRow
                title={title}
                movies={categoryShows}
                profile={profile}
                onPlay={onPlay}
                onOpenDetails={onOpenDetails}
                onAuthRequired={onAuthRequired}
              />
            </motion.div>
          ) : null;
        })}

        {/* Filtered Results */}
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <MovieRow
              title={`Search Results (${filteredShows.length})`}
              movies={filteredShows}
              profile={profile}
              onPlay={onPlay}
              onOpenDetails={onOpenDetails}
              onAuthRequired={onAuthRequired}
            />
          </motion.div>
        )}

        {/* All TV Shows */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <MovieRow
            title="Complete TV Series Library"
            movies={filteredShows.length > 0 ? filteredShows : tvShows}
            profile={profile}
            onPlay={onPlay}
            onOpenDetails={onOpenDetails}
            onAuthRequired={onAuthRequired}
          />
        </motion.div>

        {/* No Results */}
        {hasActiveFilters && filteredShows.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-black/80 border border-zinc-800/50 mx-auto flex items-center justify-center mb-6">
              <Tv className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No TV Shows Found</h3>
            <p className="text-sm text-zinc-400 mb-6">Try adjusting your search or filters</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearFilters}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm shadow-lg shadow-red-900/20"
            >
              Clear All Filters
            </motion.button>
          </motion.div>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}