import React from 'react';
import { Movie, UserProfile } from '../types';
import MovieRow from '../components/MovieRow';

interface TVShowsPageProps {
  movies: Movie[];
  profile: UserProfile;
  onPlay: (movie: Movie) => void;
  onOpenDetails: (movie: Movie) => void;
  onAuthRequired: () => void;
  onNavigate: (path: string) => void;
}

export default function TVShowsPage({ movies, profile, onPlay, onOpenDetails, onAuthRequired, onNavigate }: TVShowsPageProps) {
  const tvShows = movies.filter((movie) => movie.mediaType === 'TV Series' || movie.category === 'TV Series');

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-24 space-y-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">TV Shows</p>
          <h1 className="text-4xl md:text-5xl font-black text-white">Binge the best series</h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-2xl">Manage episodes, stream from any supported video URL, and organize your series library.</p>
        </div>
        <button onClick={() => onNavigate('/movies')} className="rounded-full border border-zinc-700 px-4 py-2 text-xs uppercase tracking-[0.3em] text-zinc-300 hover:bg-zinc-900">Browse movies</button>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">TV Series highlights</h2>
            <p className="mt-2 text-sm text-zinc-400">Quick access to series and episodes already in your library.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-emerald-300">{tvShows.length} shows</span>
        </div>
      </div>

      <div className="space-y-10">
        <MovieRow title="Latest series" movies={tvShows} profile={profile} onPlay={onPlay} onOpenDetails={onOpenDetails} onAuthRequired={onAuthRequired} />
      </div>
    </div>
  );
}
