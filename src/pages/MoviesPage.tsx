import React, { useState, useMemo } from 'react';
import { Movie, UserProfile } from '../types';
import MovieRow from '../components/MovieRow';
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal, 
  TrendingUp, 
  Star, 
  Clock, 
  Film,
  Sparkles,
  ArrowLeft,
  Zap,
  Grid3X3,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MoviesPageProps {
  movies: Movie[];
  profile: UserProfile;
  onPlay: (movie: Movie) => void;
  onOpenDetails: (movie: Movie) => void;
  onAuthRequired: () => void;
  onNavigate: (path: string) => void;
}

export default function MoviesPage({ movies, profile, onPlay, onOpenDetails, onAuthRequired, onNavigate }: MoviesPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Extract unique genres from all movies
  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    movies.forEach(movie => movie.genres.forEach(genre => genres.add(genre)));
    return Array.from(genres).sort();
  }, [movies]);

  // Extract unique years
  const allYears = useMemo(() => {
    const years = new Set<number>();
    movies.forEach(movie => years.add(movie.releaseYear));
    return Array.from(years).sort((a, b) => b - a);
  }, [movies]);

  // Filter and sort movies
  const filteredMovies = useMemo(() => {
    let filtered = [...movies];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(movie => 
        movie.title.toLowerCase().includes(query) ||
        movie.synopsis.toLowerCase().includes(query) ||
        movie.genres.some(genre => genre.toLowerCase().includes(query)) ||
        movie.cast.some(actor => actor.toLowerCase().includes(query))
      );
    }

    // Genre filter
    if (selectedGenre !== 'all') {
      filtered = filtered.filter(movie => movie.genres.includes(selectedGenre));
    }

    // Year filter
    if (selectedYear !== 'all') {
      filtered = filtered.filter(movie => movie.releaseYear === parseInt(selectedYear));
    }

    // Rating filter
    if (selectedRating !== 'all') {
      const minRating = parseFloat(selectedRating);
      filtered = filtered.filter(movie => movie.rating >= minRating);
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
      default:
        break;
    }

    return filtered;
  }, [movies, searchQuery, selectedGenre, selectedYear, selectedRating, sortBy]);

  const categories = [
    { 
      title: 'Popular Movies', 
      filter: (movie: Movie) => movie.isPopular,
      icon: TrendingUp,
      color: 'text-red-400'
    },
    { 
      title: 'Sci-Fi & Fantasy', 
      filter: (movie: Movie) => movie.category === 'Sci-Fi & Thrillers',
      icon: Sparkles,
      color: 'text-purple-400'
    },
    { 
      title: 'Award-Winning Dramas', 
      filter: (movie: Movie) => movie.category === 'Award-Winning Dramas',
      icon: Star,
      color: 'text-amber-400'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-red-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-800 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-black rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
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
                  whileHover={{ scale: 1.05 }}
                  className="p-2 rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-800/30"
                >
                  <Film className="w-5 h-5 text-red-400" />
                </motion.div>
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 font-semibold">Movies</p>
              </div>
              <h1 className="text-4xl md:text-5xl font-black">
                <span className="bg-gradient-to-r from-white via-zinc-200 to-red-200 bg-clip-text text-transparent">
                  All Titles Curated for You
                </span>
              </h1>
              <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
                Discover blockbuster hits, hidden gems, and premium stories with real streaming support for any MP4 URL.
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
                onClick={() => onNavigate('/')}
                className="rounded-xl bg-gradient-to-r from-zinc-900/80 to-black/80 border-2 border-zinc-700/50 hover:border-red-800/50 px-5 py-3 text-sm font-semibold text-zinc-400 hover:text-red-400 transition-all duration-300 backdrop-blur-sm flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </motion.button>
            </div>
          </div>

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
                  placeholder="Search movies, genres, actors..."
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
                  Found <span className="text-red-400 font-bold">{filteredMovies.length}</span> movies
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Categories Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl bg-gradient-to-br from-zinc-900/90 via-black/90 to-red-950/20 backdrop-blur-xl border border-red-900/20 shadow-2xl shadow-red-900/10 p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-800/30">
              <Grid3X3 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Browse the Library</h2>
              <p className="text-sm text-zinc-400 mt-1">Stream any video URL or pick from the latest catalog updates.</p>
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(({ title, filter, icon: Icon, color }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="rounded-2xl bg-gradient-to-br from-zinc-950/80 to-black/80 border border-zinc-800/50 hover:border-red-800/30 p-5 backdrop-blur-sm transition-all duration-300 group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-800/30">
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-400">
                    <span className="text-red-400 font-bold text-lg">{movies.filter(filter).length}</span> titles
                  </p>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600/10 to-red-900/10 border border-red-800/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowLeft className="w-4 h-4 text-red-400 rotate-180" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Category Movie Rows */}
        {categories.map(({ title, filter }, index) => {
          const categoryMovies = movies.filter(filter);
          return categoryMovies.length > 0 ? (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <MovieRow
                title={title}
                movies={categoryMovies}
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
              title={`Search Results (${filteredMovies.length})`}
              movies={filteredMovies}
              profile={profile}
              onPlay={onPlay}
              onOpenDetails={onOpenDetails}
              onAuthRequired={onAuthRequired}
            />
          </motion.div>
        )}

        {/* Complete Catalog */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <MovieRow
            title="Complete Catalog"
            movies={filteredMovies.length > 0 ? filteredMovies : movies}
            profile={profile}
            onPlay={onPlay}
            onOpenDetails={onOpenDetails}
            onAuthRequired={onAuthRequired}
          />
        </motion.div>

        {/* No Results */}
        {hasActiveFilters && filteredMovies.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-black/80 border border-zinc-800/50 mx-auto flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Movies Found</h3>
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