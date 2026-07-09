import React from 'react';
import { ArrowLeft, Crown, Clock3, Heart, Play, ShieldCheck, Star, TrendingUp, Film, Settings, LogOut, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import MovieRow from '../components/MovieRow';
import { Movie, UserProfile, UserSubscription } from '../types';

interface ProfilePageProps {
  authUser: { uid: string; email: string; displayName: string } | null;
  profile: UserProfile;
  subscription: UserSubscription | null;
  movies: Movie[];
  watchlistMovieIds: string[];
  continueWatchingMovies: { movie: Movie; progress: number }[];
  onNavigate: (path: string) => void;
  onPlay: (movie: Movie) => void;
  onOpenDetails: (movie: Movie) => void;
  onAuthRequired: () => void;
  onSignOut: () => void;
}

export default function ProfilePage({ authUser, profile, subscription, movies, watchlistMovieIds, continueWatchingMovies, onNavigate, onPlay, onOpenDetails, onAuthRequired, onSignOut }: ProfilePageProps) {
  const watchlistMovies = movies.filter(m => watchlistMovieIds.includes(m.id));
  const premiumTag = subscription?.isPremium ? 'Premium Member' : 'Basic Access';

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-red-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-800 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-black rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-24">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -5 }}
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-red-400 mb-8 transition-colors duration-300 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
          <span className="font-medium">Back to Browse</span>
        </motion.button>

        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Profile Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-gradient-to-br from-zinc-900/90 via-black/90 to-red-950/20 backdrop-blur-xl border border-red-900/20 shadow-2xl shadow-red-900/10 p-8"
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    className="w-24 h-24 rounded-2xl bg-gradient-to-br from-red-600/20 to-red-900/20 border-2 border-red-800/30 flex items-center justify-center text-5xl shadow-lg shadow-red-900/10 backdrop-blur-sm"
                  >
                    {profile.avatar}
                  </motion.div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-semibold mb-1">Profile</p>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-white via-zinc-200 to-red-200 bg-clip-text text-transparent">
                      {profile.name}
                    </h1>
                    <p className="mt-1 text-sm text-zinc-400 flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                      {authUser?.email || 'No connected email'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end gap-3">
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-sm border ${
                      subscription?.isPremium
                        ? 'bg-gradient-to-r from-amber-600/20 to-amber-900/20 border-amber-500/50 text-amber-300 shadow-lg shadow-amber-900/20'
                        : 'bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 border-zinc-700/50 text-zinc-400'
                    }`}
                  >
                    <Crown className={`w-4 h-4 ${subscription?.isPremium ? 'text-amber-400' : 'text-zinc-500'}`} />
                    {premiumTag}
                  </motion.span>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onSignOut}
                    className="rounded-xl bg-gradient-to-r from-zinc-900/80 to-black/80 border-2 border-zinc-700/50 hover:border-red-800/50 px-5 py-2.5 text-sm font-semibold text-zinc-400 hover:text-red-400 transition-all duration-300 backdrop-blur-sm flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </motion.button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="rounded-2xl bg-gradient-to-br from-zinc-950/80 to-black/80 border border-zinc-800/50 p-5 backdrop-blur-sm hover:border-red-800/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-800/30">
                      <Crown className="w-4 h-4 text-red-400" />
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-semibold">Subscription</p>
                  </div>
                  <p className="text-2xl font-black text-white">{subscription?.isPremium ? 'Premium' : 'Standard'}</p>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="rounded-2xl bg-gradient-to-br from-zinc-950/80 to-black/80 border border-zinc-800/50 p-5 backdrop-blur-sm hover:border-red-800/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-800/30">
                      <Star className="w-4 h-4 text-red-400" />
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-semibold">Profile Theme</p>
                  </div>
                  <p className="text-2xl font-black text-white capitalize">
                    {profile.color?.replace('border-', '').split(' ')[0] || 'Custom'}
                  </p>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="rounded-2xl bg-gradient-to-br from-zinc-950/80 to-black/80 border border-zinc-800/50 p-5 backdrop-blur-sm hover:border-red-800/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-800/30">
                      <Film className="w-4 h-4 text-red-400" />
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-semibold">Watchlist</p>
                  </div>
                  <p className="text-2xl font-black text-white">{watchlistMovies.length} Movies</p>
                </motion.div>
              </div>
            </motion.div>

            {/* Dashboard Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl bg-gradient-to-br from-zinc-900/90 via-black/90 to-red-950/20 backdrop-blur-xl border border-red-900/20 shadow-2xl shadow-red-900/10 p-8"
            >
              <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-red-400 font-semibold mb-2">Welcome Back</p>
                  <h2 className="text-2xl font-black text-white">Your Dashboard</h2>
                </div>
                <div className="rounded-full bg-gradient-to-r from-red-600/20 to-red-900/20 border border-red-800/30 px-5 py-2.5 text-sm font-semibold text-red-300 backdrop-blur-sm flex items-center gap-2">
                  {profile.avatar}
                  {profile.name}
                </div>
              </div>
              
              <div className="grid gap-5 md:grid-cols-2">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="rounded-2xl bg-gradient-to-br from-zinc-950/80 to-black/80 border border-zinc-800/50 p-6 backdrop-blur-sm hover:border-red-800/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/20">
                      <Clock3 className="w-5 h-5 text-red-400" />
                    </div>
                    <p className="text-sm font-bold text-white">Continue Watching</p>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Resume where you left off across profiles and devices.
                  </p>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="rounded-2xl bg-gradient-to-br from-zinc-950/80 to-black/80 border border-zinc-800/50 p-6 backdrop-blur-sm hover:border-red-800/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/20">
                      <Zap className="w-5 h-5 text-red-400" />
                    </div>
                    <p className="text-sm font-bold text-white">Watch History</p>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Your latest progress is stored locally for speed and privacy.
                  </p>
                </motion.div>
              </div>
            </motion.div>

            {/* Continue Watching Section */}
            {continueWatchingMovies.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Clock3 className="w-5 h-5 text-red-400" />
                    Continue Watching
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => onNavigate('/movies')}
                    className="text-xs uppercase tracking-[0.2em] text-red-400 hover:text-red-300 font-semibold transition-colors"
                  >
                    Browse More →
                  </motion.button>
                </div>
                <MovieRow 
                  title="Continue Watching" 
                  movies={continueWatchingMovies.map(item => item.movie)} 
                  profile={profile} 
                  onPlay={onPlay} 
                  onOpenDetails={onOpenDetails} 
                  onAuthRequired={onAuthRequired} 
                />
              </motion.div>
            )}

            {/* Favorite Picks Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  Favorite Picks
                </h3>
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500 font-semibold">
                  <Star className="w-3.5 h-3.5 text-red-400 fill-current" />
                  Curated for you
                </div>
              </div>
              
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {songsPlaceholder(watchlistMovies).map((movie, index) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="rounded-2xl bg-gradient-to-b from-zinc-900/90 to-black/90 border border-zinc-800/50 hover:border-red-800/30 overflow-hidden shadow-lg hover:shadow-red-900/10 transition-all duration-300 backdrop-blur-sm group"
                  >
                    <div className="relative h-44 overflow-hidden">
                      {movie.posterUrl ? (
                        <img 
                          src={movie.posterUrl} 
                          alt={movie.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-950/30 to-zinc-900 flex items-center justify-center">
                          <Film className="w-12 h-12 text-zinc-700" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    </div>
                    <div className="p-5 space-y-3">
                      <h4 className="font-bold text-white text-lg group-hover:text-red-400 transition-colors">
                        {movie.title}
                      </h4>
                      <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                        {movie.synopsis}
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onPlay(movie)}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-red-900/20 transition-all duration-300"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Play
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Account Info Card */}
            <div className="rounded-3xl bg-gradient-to-br from-zinc-900/90 via-black/90 to-red-950/20 backdrop-blur-xl border border-red-900/20 shadow-2xl shadow-red-900/10 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-800/30">
                  <Settings className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-sm font-bold text-white uppercase tracking-[0.2em]">Your Account</p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
                  <span className="text-sm text-zinc-400 font-medium">Email</span>
                  <span className="text-sm text-zinc-200 font-semibold">{authUser?.email}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
                  <span className="text-sm text-zinc-400 font-medium">Profile</span>
                  <span className="text-sm text-zinc-200 font-semibold">{profile.name}</span>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <span className="text-sm text-zinc-400 font-medium">Access Level</span>
                  <span className={`text-sm font-bold ${subscription?.isPremium ? 'text-amber-400' : 'text-zinc-300'}`}>
                    {subscription?.isPremium ? 'Premium' : 'Standard'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="rounded-3xl bg-gradient-to-br from-zinc-900/90 via-black/90 to-red-950/20 backdrop-blur-xl border border-red-900/20 shadow-2xl shadow-red-900/10 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-800/30">
                  <Zap className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-sm font-bold text-white uppercase tracking-[0.2em]">Quick Actions</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Browse Movies', path: '/movies', icon: Film },
                  { label: 'TV Series', path: '/tv-shows', icon: TrendingUp },
                  { label: 'Back to Home', path: '/', icon: ArrowLeft },
                ].map((action) => (
                  <motion.button
                    key={action.path}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate(action.path)}
                    className="w-full rounded-xl bg-gradient-to-r from-zinc-950/80 to-black/80 border-2 border-zinc-800/50 hover:border-red-800/50 px-5 py-3.5 text-left text-sm font-semibold text-zinc-300 hover:text-red-400 transition-all duration-300 backdrop-blur-sm flex items-center gap-3 group"
                  >
                    <action.icon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                    {action.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Premium Card */}
            <div className="rounded-3xl bg-gradient-to-br from-amber-950/30 via-black/90 to-red-950/20 backdrop-blur-xl border border-amber-900/30 shadow-2xl shadow-amber-900/10 p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600/5 to-transparent"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-400 font-bold">Premium Milestones</p>
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                  Upgrade for 4K streams, exclusive early previews, and unlimited device access.
                </p>
                {!subscription?.isPremium && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-900/20 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade to Premium
                  </motion.button>
                )}
              </div>
            </div>
          </motion.aside>
        </div>
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

function songsPlaceholder(movies: Movie[]) {
  if (movies.length > 0) return movies.slice(0, 3);
  return [{
    id: 'empty-1',
    title: 'Browse New Releases',
    synopsis: 'Add favorites to your list to see them here.',
    backdropUrl: '',
    posterUrl: '',
    videoUrl: '',
    category: 'New Releases',
    mediaType: 'Movie',
    seriesCount: 0,
    rating: 0,
    releaseYear: 2026,
    duration: '0m',
    ageRating: 'PG',
    genres: [],
    cast: [],
  }];
}