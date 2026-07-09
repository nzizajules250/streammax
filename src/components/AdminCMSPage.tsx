import React, { useEffect, useMemo, useState } from 'react';
import { Film, Loader2, PlusCircle, Trash2, PencilLine, Users, Crown, Database } from 'lucide-react';
import { Movie } from '../types';
import { fetchAdminStats } from '../lib/api';

interface MovieFormState {
  title: string;
  synopsis: string;
  category: string;
  rating: string;
  releaseYear: string;
  duration: string;
  ageRating: string;
  posterUrl: string;
  backdropUrl: string;
  videoUrl: string;
  trailerUrl: string;
  genres: string;
  cast: string;
  isTrending: boolean;
  isPopular: boolean;
}

const emptyForm: MovieFormState = {
  title: '',
  synopsis: '',
  category: 'New Releases',
  rating: '4.7',
  releaseYear: '2026',
  duration: '2h 10m',
  ageRating: 'PG-13',
  posterUrl: '',
  backdropUrl: '',
  videoUrl: '',
  trailerUrl: '',
  genres: '',
  cast: '',
  isTrending: false,
  isPopular: false,
};

export default function AdminCMSPage() {
  // require admin token
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  if (!adminToken) {
    if (typeof window !== 'undefined') window.location.href = '/admin';
    return null;
  }

  const [movies, setMovies] = useState<Movie[]>([]);
  const [stats, setStats] = useState<{ movies: number; users: number; subscriptions: number }>({ movies: 0, users: 0, subscriptions: 0 });
  const [form, setForm] = useState<MovieFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // const [stats, setStats] = useState({ movies: 0, users: 0, subscriptions: 0 });

  const loadMovies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/movies');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch movies');
      setMovies(data.movies || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load movies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovies();
    if (adminToken) {
      setStatsLoading(true);
      fetchAdminStats(adminToken)
        .then((data) => setStats(data.stats || { movies: 0, users: 0, subscriptions: 0 }))
        .catch(() => setStats({ movies: 0, users: 0, subscriptions: 0 }))
        .finally(() => setStatsLoading(false));
    }
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin';
    }
  };

  const handleUnauthorized = () => {
    setError('Session expired. Please log in again.');
    handleLogout();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        title: form.title,
        synopsis: form.synopsis,
        category: form.category,
        rating: Number(form.rating),
        releaseYear: Number(form.releaseYear),
        duration: form.duration,
        ageRating: form.ageRating,
        posterUrl: form.posterUrl,
        backdropUrl: form.backdropUrl,
        videoUrl: form.videoUrl,
        trailerUrl: form.trailerUrl,
        genres: form.genres.split(',').map((item) => item.trim()).filter(Boolean),
        cast: form.cast.split(',').map((item) => item.trim()).filter(Boolean),
        isTrending: form.isTrending,
        isPopular: form.isPopular,
      };

      const response = await fetch(editingId ? `/api/movies/${editingId}` : '/api/movies', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) throw new Error(data.error || 'Unable to save movie');
      setSuccess(editingId ? 'Movie updated.' : 'Movie created.');
      resetForm();
      loadMovies();
    } catch (err: any) {
      setError(err.message || 'Unable to save movie');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (movieId: string) => {
    setError('');
    setSuccess('');
    const response = await fetch(`/api/movies/${movieId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` } });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      handleUnauthorized();
      return;
    }
    if (!response.ok) {
      setError(data.error || 'Unable to delete movie');
      return;
    }
    setSuccess('Movie removed.');
    loadMovies();
  };

  const handleEdit = (movie: Movie) => {
    setEditingId(movie.id);
    setForm({
      title: movie.title,
      synopsis: movie.synopsis,
      category: movie.category,
      rating: String(movie.rating),
      releaseYear: String(movie.releaseYear),
      duration: movie.duration,
      ageRating: movie.ageRating,
      posterUrl: movie.posterUrl,
      backdropUrl: movie.backdropUrl,
      videoUrl: movie.videoUrl,
      trailerUrl: movie.trailerUrl || '',
      genres: movie.genres.join(', '),
      cast: movie.cast.join(', '),
      isTrending: Boolean(movie.isTrending),
      isPopular: Boolean(movie.isPopular),
    });
  };

  const title = useMemo(() => (editingId ? 'Edit movie' : 'Add new movie'), [editingId]);

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl">
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
              <div className="mb-2 flex items-center gap-2 text-red-400"><Film className="h-4 w-4" /> <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Catalog</span></div>
              <div className="text-2xl font-black text-white">{stats.movies}</div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
              <div className="mb-2 flex items-center gap-2 text-emerald-400"><Users className="h-4 w-4" /> <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Users</span></div>
              <div className="text-2xl font-black text-white">{stats.users}</div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
              <div className="mb-2 flex items-center gap-2 text-amber-400"><Crown className="h-4 w-4" /> <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Premium</span></div>
              <div className="text-2xl font-black text-white">{stats.subscriptions}</div>
            </div>
          </div>
          <div className="mb-4 flex items-center gap-3 text-red-500">
            <Film className="h-8 w-8" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">CMS</p>
              <h1 className="text-2xl font-black">Movie Content Manager</h1>
            </div>
          </div>
          <p className="text-sm text-zinc-400">Add or update movies and their details from one place. Each record becomes available to the streaming app instantly.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="text-sm text-zinc-500">Manage movie records and publish updates for your streaming library.</p>
              </div>
              <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-3">
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-center">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-500">Movies</p>
                  <p className="mt-2 text-2xl font-black text-white">{statsLoading ? '...' : stats.movies}</p>
                </div>
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-center">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-500">Users</p>
                  <p className="mt-2 text-2xl font-black text-white">{statsLoading ? '...' : stats.users}</p>
                </div>
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-center">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-500">Premium</p>
                  <p className="mt-2 text-2xl font-black text-white">{statsLoading ? '...' : stats.subscriptions}</p>
                </div>
              </div>
            </div>
              <div className="flex items-center gap-3">
                <button onClick={resetForm} className="rounded-full border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300">New</button>
                <button onClick={handleLogout} className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700">Logout</button>
              </div>
            </div>

            {error ? <div className="mb-4 rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-300">{error}</div> : null}
            {success ? <div className="mb-4 rounded-xl border border-emerald-900/60 bg-emerald-950/40 p-3 text-sm text-emerald-300">{success}</div> : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Title</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm" required />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Category</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm" required />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Synopsis</label>
                <textarea value={form.synopsis} onChange={(e) => setForm({ ...form, synopsis: e.target.value })} className="min-h-24 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm" required />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Rating</label>
                  <input type="number" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Release Year</label>
                  <input type="number" value={form.releaseYear} onChange={(e) => setForm({ ...form, releaseYear: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Age Rating</label>
                  <input value={form.ageRating} onChange={(e) => setForm({ ...form, ageRating: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Duration</label>
                  <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Genres</label>
                  <input value={form.genres} onChange={(e) => setForm({ ...form, genres: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm" placeholder="Action, Drama" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Cast</label>
                  <input value={form.cast} onChange={(e) => setForm({ ...form, cast: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm" placeholder="Actor One, Actor Two" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Video URL</label>
                  <input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Poster URL</label>
                  <input value={form.posterUrl} onChange={(e) => setForm({ ...form, posterUrl: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Backdrop URL</label>
                  <input value={form.backdropUrl} onChange={(e) => setForm({ ...form, backdropUrl: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Trailer URL</label>
                <input value={form.trailerUrl} onChange={(e) => setForm({ ...form, trailerUrl: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm" placeholder="https://..." />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-zinc-400">
                  <input type="checkbox" checked={form.isTrending} onChange={(e) => setForm({ ...form, isTrending: e.target.checked })} />
                  Trending
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-400">
                  <input type="checkbox" checked={form.isPopular} onChange={(e) => setForm({ ...form, isPopular: e.target.checked })} />
                  Popular
                </label>
              </div>

              <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                {editingId ? 'Save changes' : 'Publish movie'}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Published movies</h2>
              <span className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-400">{movies.length}</span>
            </div>
            <div className="space-y-3">
              {loading ? <div className="text-sm text-zinc-500">Loading content...</div> : movies.map((movie) => (
                <div key={movie.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{movie.title}</p>
                      <p className="mt-1 text-sm text-zinc-500">{movie.category}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(movie)} className="rounded-full border border-zinc-700 p-2 text-zinc-300">
                        <PencilLine className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(movie.id)} className="rounded-full border border-zinc-700 p-2 text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
}
