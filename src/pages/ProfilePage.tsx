import React from 'react';
import { ArrowLeft, Crown, Clock3, Heart, Play, ShieldCheck } from 'lucide-react';
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
  const premiumTag = subscription?.isPremium ? 'Premium member' : 'Basic access';

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-24">
      <button onClick={() => onNavigate('/')} className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Browse
      </button>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-3xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-4xl">{profile.avatar}</div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Profile</p>
                <h1 className="text-3xl font-black text-white">{profile.name}</h1>
                <p className="mt-1 text-sm text-zinc-400">{authUser?.email || 'No connected email'}</p>
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300"><ShieldCheck className="w-3.5 h-3.5" /> {premiumTag}</span>
              <button onClick={onSignOut} className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900">Sign out</button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Subscription</p>
              <p className="mt-3 text-2xl font-black text-white">{subscription?.isPremium ? 'Premium' : 'Standard'}</p>
            </div>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Profile Color</p>
              <p className="mt-3 text-2xl font-black text-white">{profile.color.replace('border-', '').split(' ')[0] || 'zinc'}</p>
            </div>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Active Watchlist</p>
              <p className="mt-3 text-2xl font-black text-white">{watchlistMovies.length}</p>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Welcome back</p>
                <h2 className="text-2xl font-black">Your profile dashboard</h2>
              </div>
              <div className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300">{profile.avatar} {profile.name}</div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-black/50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Continue watching</p>
                <p className="mt-2 text-sm text-zinc-400">Resume where you left off across profiles and devices.</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-black/50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Watch history</p>
                <p className="mt-2 text-sm text-zinc-400">Your latest progress is stored locally for speed and privacy.</p>
              </div>
            </div>
          </div>

          {continueWatchingMovies.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Continue Watching</h3>
                <button onClick={() => onNavigate('/movies')} className="text-xs uppercase tracking-[0.3em] text-red-500">Browse more</button>
              </div>
              <MovieRow title="Continue Watching" movies={continueWatchingMovies.map(item => item.movie)} profile={profile} onPlay={onPlay} onOpenDetails={onOpenDetails} onAuthRequired={onAuthRequired} />
            </div>
          )}

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Favorite picks</h3>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-zinc-500"><Heart className="w-3.5 h-3.5 text-red-500" /> Curated for you</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {songsPlaceholder(watchlistMovies).map((movie) => (
                <div key={movie.id} className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
                  <img src={movie.posterUrl} alt={movie.title} className="w-full h-40 object-cover" referrerPolicy="no-referrer" />
                  <div className="p-4">
                    <p className="font-semibold text-white">{movie.title}</p>
                    <p className="mt-2 text-sm text-zinc-400 line-clamp-2">{movie.synopsis}</p>
                    <button onClick={() => onPlay(movie)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-red-700"> <Play className="w-3.5 h-3.5" /> Play</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Your account</p>
            <div className="mt-4 text-sm text-zinc-300 space-y-3">
              <div className="flex justify-between border-b border-zinc-800 pb-3"><span>Email</span><span>{authUser?.email}</span></div>
              <div className="flex justify-between border-b border-zinc-800 pb-3"><span>Profile</span><span>{profile.name}</span></div>
              <div className="flex justify-between pt-3"><span>Access</span><span>{subscription?.isPremium ? 'Premium' : 'Standard'}</span></div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Quick actions</p>
            <div className="mt-4 grid gap-3">
              <button onClick={() => onNavigate('/movies')} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-800">Browse movies</button>
              <button onClick={() => onNavigate('/tv-shows')} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-800">Browse TV series</button>
              <button onClick={() => onNavigate('/')} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-800">Back to home</button>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Premium milestones</p>
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <p className="mt-3 text-sm text-zinc-400">Upgrade for 4K streams, exclusive early previews, and unlimited device access.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function songsPlaceholder(movies: Movie[]) {
  if (movies.length > 0) return movies.slice(0, 3);
  return [{
    id: 'empty-1',
    title: 'Browse new releases',
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
