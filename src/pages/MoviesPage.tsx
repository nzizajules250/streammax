import React from 'react';
import { Movie, UserProfile } from '../types';
import MovieRow from '../components/MovieRow';

interface MoviesPageProps {
  movies: Movie[];
  profile: UserProfile;
  onPlay: (movie: Movie) => void;
  onOpenDetails: (movie: Movie) => void;
  onAuthRequired: () => void;
  onNavigate: (path: string) => void;
}

export default function MoviesPage({ movies, profile, onPlay, onOpenDetails, onAuthRequired, onNavigate }: MoviesPageProps) {
  const categories = [
    { title: 'Popular Movies', filter: (movie: Movie) => movie.isPopular },
    { title: 'Sci-Fi & Fantasy', filter: (movie: Movie) => movie.category === 'Sci-Fi & Thrillers' },
    { title: 'Award-Winning Dramas', filter: (movie: Movie) => movie.category === 'Award-Winning Dramas' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-24 space-y-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Movies</p>
          <h1 className="text-4xl md:text-5xl font-black text-white">All titles curated for you</h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-2xl">Discover blockbuster hits, hidden gems, and premium stories with real streaming support for any MP4 URL.</p>
        </div>
        <button onClick={() => onNavigate('/')} className="rounded-full border border-zinc-700 px-4 py-2 text-xs uppercase tracking-[0.3em] text-zinc-300 hover:bg-zinc-900">Back to home</button>
      </div>

      <div className="grid gap-6">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
          <h2 className="text-xl font-semibold text-white">Browse the library</h2>
          <p className="mt-2 text-sm text-zinc-400">Stream any video URL saved in the library or pick from the latest catalog updates.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(({ title, filter }) => (
              <div key={title} className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4">
                <h3 className="text-sm uppercase tracking-[0.25em] text-zinc-500">{title}</h3>
                <p className="mt-3 text-sm text-zinc-300">{movies.filter(filter).length} titles available</p>
              </div>
            ))}
          </div>
        </div>

        {categories.map(({ title, filter }) => (
          <MovieRow key={title} title={title} movies={movies.filter(filter)} profile={profile} onPlay={onPlay} onOpenDetails={onOpenDetails} onAuthRequired={onAuthRequired} />
        ))}

        <MovieRow title="Complete Catalog" movies={movies} profile={profile} onPlay={onPlay} onOpenDetails={onOpenDetails} onAuthRequired={onAuthRequired} />
      </div>
    </div>
  );
}
