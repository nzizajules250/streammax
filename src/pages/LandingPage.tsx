import React from 'react';
import { Movie, UserProfile, UserSubscription, InAppNotification } from '../types';
import HeroBanner from '../components/HeroBanner';
import MovieRow from '../components/MovieRow';

interface LandingPageProps {
  featuredMovie: Movie;
  currentProfile: UserProfile;
  movies: Movie[];
  watchlistMovieIds: string[];
  continueWatchingMovies: { movie: Movie; progress: number }[];
  isContentLoading: boolean;
  isOfflineMode: boolean;
  downloadedMovieIds: string[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  handleToggleWatchlist: (movie: Movie) => void;
  handlePlayMovieTrigger: (movie: Movie) => void;
  handleAuthRequired: () => void;
  setSelectedMovie: (movie: Movie | null) => void;
  currentProfileId: string;
  notifications: InAppNotification[];
}

export default function LandingPage({
  featuredMovie,
  currentProfile,
  movies,
  watchlistMovieIds,
  continueWatchingMovies,
  isContentLoading,
  isOfflineMode,
  downloadedMovieIds,
  searchQuery,
  setSearchQuery,
  handleToggleWatchlist,
  handlePlayMovieTrigger,
  handleAuthRequired,
  setSelectedMovie,
  currentProfileId,
  notifications,
}: LandingPageProps) {
  const movieCatalog = movies.length > 0 ? movies : [];

  const baseMovies = isOfflineMode ? movieCatalog.filter(m => downloadedMovieIds.includes(m.id)) : movieCatalog;
  const trendingMovies = baseMovies.filter(m => m.isTrending);
  const popularMovies = baseMovies.filter(m => m.isPopular);
  const scifiMovies = baseMovies.filter(m => m.category === 'Sci-Fi & Thrillers');
  const dramaMovies = baseMovies.filter(m => m.category === 'Award-Winning Dramas');
  const watchlistMovies = baseMovies.filter(m => watchlistMovieIds.includes(m.id));
  const recommendedMovieIds = notifications.map((n) => n.id).slice(0, 5).map((id) => id);
  const recommendedMovies = baseMovies.filter((m) => recommendedMovieIds.includes(m.id));
  const searchedMovies = baseMovies.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.synopsis.toLowerCase().includes(q) ||
      m.genres.some(g => g.toLowerCase().includes(q))
    );
  });

  return (
    <div className="pt-24 pb-20">
      {searchQuery ? (
        <div className="px-4 md:px-12 pt-10 space-y-6">
          <h1 className="text-xl md:text-2xl font-bold text-neutral-300">
            Showing search results for <span className="text-white">"{searchQuery}"</span>
          </h1>

          {searchedMovies.length === 0 ? (
            <div className="text-center py-20 text-neutral-500 flex flex-col items-center justify-center">
              <p className="font-semibold text-lg">No matches found</p>
              <p className="text-sm mt-1 text-neutral-400">Try adjusting your keywords or toggling Offline Mode.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {searchedMovies.map((movie) => (
                <div key={movie.id} onClick={() => setSelectedMovie(movie)} className="bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer group flex flex-col justify-between">
                  <div className="relative aspect-video">
                    <img src={movie.backdropUrl} alt={movie.title} className="w-full h-full object-cover filter brightness-95" referrerPolicy="no-referrer" />
                    <span className="absolute top-2 right-2 bg-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">{movie.rating}</span>
                  </div>
                  <div className="p-3 text-xs flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="font-bold text-neutral-200 line-clamp-1">{movie.title}</h4>
                      <p className="text-neutral-400 line-clamp-2 mt-1 leading-normal font-medium">{movie.synopsis}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-[10px] text-neutral-500 font-mono">
                      <span>{movie.releaseYear}</span>
                      <span className="text-emerald-500 font-bold">{Math.round(movie.rating * 20)}% Match</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          <HeroBanner
            movie={featuredMovie}
            profile={currentProfile}
            onPlay={handlePlayMovieTrigger}
            onOpenDetails={setSelectedMovie}
            onAuthRequired={handleAuthRequired}
            onToggleList={handleToggleWatchlist}
            inList={watchlistMovieIds.includes(featuredMovie.id)}
            isLoading={isContentLoading}
          />

          <div className="space-y-10 -mt-16 sm:-mt-24 md:-mt-32 relative z-10 pb-10">
            {isContentLoading ? (
              <>
                <MovieRow title="Continue Watching" isLoading />
                <MovieRow title="Trending Now" isLoading />
                <MovieRow title="Popular on Netflix" isLoading />
              </>
            ) : (
              <>
                {continueWatchingMovies.length > 0 && (
                  <MovieRow title="Continue Watching" movies={continueWatchingMovies.map(item => item.movie)} profile={currentProfile} onPlay={handlePlayMovieTrigger} onOpenDetails={setSelectedMovie} onAuthRequired={handleAuthRequired} />
                )}
                {watchlistMovies.length > 0 && (
                  <div id="my-list-section">
                    <MovieRow title="My List" movies={watchlistMovies} profile={currentProfile} onPlay={handlePlayMovieTrigger} onOpenDetails={setSelectedMovie} onAuthRequired={handleAuthRequired} />
                  </div>
                )}
                <MovieRow title="Trending Now" movies={trendingMovies} profile={currentProfile} onPlay={handlePlayMovieTrigger} onOpenDetails={setSelectedMovie} onAuthRequired={handleAuthRequired} />
                <MovieRow title="Popular on Netflix" movies={popularMovies} profile={currentProfile} onPlay={handlePlayMovieTrigger} onOpenDetails={setSelectedMovie} onAuthRequired={handleAuthRequired} />
                <MovieRow title="Sci-Fi & Fantasy Masterpieces" movies={scifiMovies} profile={currentProfile} onPlay={handlePlayMovieTrigger} onOpenDetails={setSelectedMovie} onAuthRequired={handleAuthRequired} />
                <MovieRow title="Award-Winning Dramas" movies={dramaMovies} profile={currentProfile} onPlay={handlePlayMovieTrigger} onOpenDetails={setSelectedMovie} onAuthRequired={handleAuthRequired} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
