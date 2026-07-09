import React, { useEffect, useMemo, useState } from 'react';
import { Film, Loader2, PlusCircle, Trash2, PencilLine, Users, Crown, Database, LogOut, Shield, TrendingUp, Star, Clock, Calendar } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    const response = await fetch(`/api/movies/${movieId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' } });
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
    <div className="min-h-screen bg-linear-to-br from-black via-zinc-950 to-red-950 p-6 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-red-800 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-black rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 relative z-10">
        {/* Header Card */}
        <div className="rounded-3xl bg-linear-to-br from-zinc-900/90 via-black/90 to-red-950/20 backdrop-blur-xl border border-red-900/20 shadow-2xl shadow-red-900/5 p-8">
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-linear-to-br from-zinc-950/80 to-black/80 border border-red-900/20 p-5 backdrop-blur-sm hover:border-red-800/40 transition-all duration-300 group">
              <div className="mb-3 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-linear-to-br from-red-600/20 to-red-900/20 border border-red-800/30 group-hover:from-red-600/30 group-hover:to-red-900/30 transition-all">
                  <Film className="h-5 w-5 text-red-400" />
                </div>
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-semibold">Catalog</span>
              </div>
              <div className="text-3xl font-black bg-linear-to-r from-red-400 to-red-600 bg-clip-text text-transparent">{stats.movies}</div>
            </div>
            <div className="rounded-2xl bg-linear-to-br from-zinc-950/80 to-black/80 border border-emerald-900/20 p-5 backdrop-blur-sm hover:border-emerald-800/40 transition-all duration-300 group">
              <div className="mb-3 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-linear-to-br from-emerald-600/20 to-emerald-900/20 border border-emerald-800/30 group-hover:from-emerald-600/30 group-hover:to-emerald-900/30 transition-all">
                  <Users className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-semibold">Users</span>
              </div>
              <div className="text-3xl font-black bg-linear-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">{stats.users}</div>
            </div>
            <div className="rounded-2xl bg-linear-to-br from-zinc-950/80 to-black/80 border border-amber-900/20 p-5 backdrop-blur-sm hover:border-amber-800/40 transition-all duration-300 group">
              <div className="mb-3 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-linear-to-br from-amber-600/20 to-amber-900/20 border border-amber-800/30 group-hover:from-amber-600/30 group-hover:to-amber-900/30 transition-all">
                  <Crown className="h-5 w-5 text-amber-400" />
                </div>
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-semibold">Premium</span>
              </div>
              <div className="text-3xl font-black bg-linear-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">{stats.subscriptions}</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-linear-to-br from-red-600 to-red-900 shadow-lg shadow-red-900/20">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-semibold mb-1">Content Management</p>
                <h1 className="text-3xl font-black bg-linear-to-r from-red-500 via-red-400 to-red-600 bg-clip-text text-transparent">Movie CMS</h1>
                <p className="text-sm text-zinc-400 mt-1">Add or update movies and their details from one place.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={resetForm} 
                className="px-5 py-2.5 rounded-xl bg-linear-to-r from-red-600/20 to-red-900/20 border border-red-800/30 text-sm font-semibold text-red-300 hover:from-red-600/30 hover:to-red-900/30 hover:border-red-700/50 transition-all duration-300 flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                New Movie
              </button>
              <button 
                onClick={handleLogout} 
                className="px-5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-700/50 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-all duration-300 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Form Section */}
          <div className="rounded-3xl bg-linear-to-br from-zinc-900/90 via-black/90 to-red-950/20 backdrop-blur-xl border border-red-900/20 shadow-2xl shadow-red-900/5 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                {editingId ? (
                  <PencilLine className="h-6 w-6 text-red-400" />
                ) : (
                  <PlusCircle className="h-6 w-6 text-red-400" />
                )}
                {title}
              </h2>
              <p className="text-sm text-zinc-400">Manage movie records and publish updates for your streaming library.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="p-1 rounded-full bg-red-600/20">
                    <Shield className="h-4 w-4 text-red-400" />
                  </div>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="p-1 rounded-full bg-emerald-600/20">
                    <Star className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-sm text-emerald-300">{success}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="group">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Title</label>
                  <input 
                    value={form.title} 
                    onChange={(e) => setForm({ ...form, title: e.target.value })} 
                    className="w-full rounded-xl bg-zinc-950/80 border border-zinc-700/50 text-white px-4 py-3.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm" 
                    placeholder="Enter movie title"
                    required 
                  />
                </div>
                <div className="group">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Category</label>
                  <input 
                    value={form.category} 
                    onChange={(e) => setForm({ ...form, category: e.target.value })} 
                    className="w-full rounded-xl bg-zinc-950/80 border border-zinc-700/50 text-white px-4 py-3.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm" 
                    required 
                  />
                </div>
              </div>

              <div className="group">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Synopsis</label>
                <textarea 
                  value={form.synopsis} 
                  onChange={(e) => setForm({ ...form, synopsis: e.target.value })} 
                  className="min-h-28 w-full rounded-xl bg-zinc-950/80 border border-zinc-700/50 text-white px-4 py-3.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm resize-none" 
                  placeholder="Write a brief synopsis of the movie..."
                  required 
                />
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div className="group">
                  <label className="mb-2 inline-flex w-full text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400 items-center gap-2">
                    <Star className="h-3 w-3" /> Rating
                  </label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={form.rating} 
                    onChange={(e) => setForm({ ...form, rating: e.target.value })} 
                    className="w-full rounded-xl bg-zinc-950/80 border border-zinc-700/50 text-white px-4 py-3.5 text-sm focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm" 
                  />
                </div>
                <div className="group">
                  <label className="mb-2 inline-flex w-full text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400 items-center gap-2">
                    <Calendar className="h-3 w-3" /> Release Year
                  </label>
                  <input 
                    type="number" 
                    value={form.releaseYear} 
                    onChange={(e) => setForm({ ...form, releaseYear: e.target.value })} 
                    className="w-full rounded-xl bg-zinc-950/80 border border-zinc-700/50 text-white px-4 py-3.5 text-sm focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm" 
                  />
                </div>
                <div className="group">
                  <label className="mb-2 inline-flex w-full text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400 items-center gap-2">
                    <Shield className="h-3 w-3" /> Age Rating
                  </label>
                  <input 
                    value={form.ageRating} 
                    onChange={(e) => setForm({ ...form, ageRating: e.target.value })} 
                    className="w-full rounded-xl bg-zinc-950/80 border border-zinc-700/50 text-white px-4 py-3.5 text-sm focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm" 
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="group">
                  <label className="mb-2 inline-flex w-full text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400 items-center gap-2">
                    <Clock className="h-3 w-3" /> Duration
                  </label>
                  <input 
                    value={form.duration} 
                    onChange={(e) => setForm({ ...form, duration: e.target.value })} 
                    className="w-full rounded-xl bg-zinc-950/80 border border-zinc-700/50 text-white px-4 py-3.5 text-sm focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm" 
                  />
                </div>
                <div className="group">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Genres</label>
                  <input 
                    value={form.genres} 
                    onChange={(e) => setForm({ ...form, genres: e.target.value })} 
                    className="w-full rounded-xl bg-zinc-950/80 border border-zinc-700/50 text-white px-4 py-3.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm" 
                    placeholder="Action, Drama, Sci-Fi" 
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="group">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Cast</label>
                  <input 
                    value={form.cast} 
                    onChange={(e) => setForm({ ...form, cast: e.target.value })} 
                    className="w-full rounded-xl bg-zinc-950/80 border border-zinc-700/50 text-white px-4 py-3.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm" 
                    placeholder="Actor One, Actor Two" 
                  />
                </div>
                <div className="group">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Video URL</label>
                  <input 
                    value={form.videoUrl} 
                    onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} 
                    className="w-full rounded-xl bg-zinc-950/80 border border-zinc-700/50 text-white px-4 py-3.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm" 
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="group">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Poster URL</label>
                  <input 
                    value={form.posterUrl} 
                    onChange={(e) => setForm({ ...form, posterUrl: e.target.value })} 
                    className="w-full rounded-xl bg-zinc-950/80 border border-zinc-700/50 text-white px-4 py-3.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm" 
                  />
                </div>
                <div className="group">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Backdrop URL</label>
                  <input 
                    value={form.backdropUrl} 
                    onChange={(e) => setForm({ ...form, backdropUrl: e.target.value })} 
                    className="w-full rounded-xl bg-zinc-950/80 border border-zinc-700/50 text-white px-4 py-3.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm" 
                  />
                </div>
              </div>

              <div className="group">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Trailer URL</label>
                <input 
                  value={form.trailerUrl} 
                  onChange={(e) => setForm({ ...form, trailerUrl: e.target.value })} 
                  className="w-full rounded-xl bg-zinc-950/80 border border-zinc-700/50 text-white px-4 py-3.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm" 
                  placeholder="https://..." 
                />
              </div>

              <div className="flex gap-6 p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={form.isTrending} 
                    onChange={(e) => setForm({ ...form, isTrending: e.target.checked })} 
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-red-600 focus:ring-red-600 focus:ring-offset-zinc-900 cursor-pointer" 
                  />
                  <TrendingUp className="h-4 w-4 text-zinc-500 group-hover:text-red-400 transition-colors" />
                  <span className="font-medium">Trending</span>
                </label>
                <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={form.isPopular} 
                    onChange={(e) => setForm({ ...form, isPopular: e.target.checked })} 
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-red-600 focus:ring-red-600 focus:ring-offset-zinc-900 cursor-pointer" 
                  />
                  <Star className="h-4 w-4 text-zinc-500 group-hover:text-red-400 transition-colors" />
                  <span className="font-medium">Popular</span>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full relative group overflow-hidden rounded-xl bg-linear-to-r from-red-700 via-red-600 to-red-800 p-px transition-all duration-300 hover:shadow-lg hover:shadow-red-900/30"
              >
                <div className="relative w-full rounded-xl bg-linear-to-r from-red-600 via-red-500 to-red-700 px-6 py-4 transition-all duration-300 group-hover:from-red-500 group-hover:via-red-400 group-hover:to-red-600">
                  <span className="relative z-10 flex items-center justify-center gap-3 text-sm font-bold text-white">
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : editingId ? (
                      <>
                        <PencilLine className="h-5 w-5" />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-5 w-5" />
                        Publish Movie
                      </>
                    )}
                  </span>
                </div>
              </button>
            </form>
          </div>

          {/* Movies List Section */}
          <div className="rounded-3xl bg-linear-to-br from-zinc-900/90 via-black/90 to-red-950/20 backdrop-blur-xl border border-red-900/20 shadow-2xl shadow-red-900/5 p-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Film className="h-5 w-5 text-red-400" />
                <div>
                  <h2 className="text-xl font-bold text-white">Published Movies</h2>
                  <p className="text-sm text-red-300">Manage all available titles with rich metadata and quick actions.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <label className="relative block">
                  <span className="sr-only">Search movies</span>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search movies..."
                    className="w-full min-w-[220px] rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 outline-none"
                  />
                </label>
                <span className="px-4 py-2 rounded-full bg-red-900/20 border border-red-700/30 text-sm font-semibold text-red-200">
                  {movies.length} titles
                </span>
              </div>
            </div>
            <div className="overflow-x-auto rounded-3xl border border-red-900/30 bg-[#060606]/90">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead className="bg-[#080808] text-zinc-400 uppercase tracking-[0.18em] text-[11px]">
                  <tr>
                    <th className="sticky top-0 border-b border-zinc-800 px-4 py-4">Title</th>
                    <th className="sticky top-0 border-b border-zinc-800 px-4 py-4">Category</th>
                    <th className="sticky top-0 border-b border-zinc-800 px-4 py-4">Type</th>
                    <th className="sticky top-0 border-b border-zinc-800 px-4 py-4">Year</th>
                    <th className="sticky top-0 border-b border-zinc-800 px-4 py-4">Rating</th>
                    <th className="sticky top-0 border-b border-zinc-800 px-4 py-4">Status</th>
                    <th className="sticky top-0 border-b border-zinc-800 px-4 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-red-300">
                        <div className="inline-flex items-center gap-3">
                          <Loader2 className="h-5 w-5 animate-spin text-red-400" />
                          Loading movies...
                        </div>
                      </td>
                    </tr>
                  ) : movies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                        <Database className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
                        No movies published yet.
                      </td>
                    </tr>
                  ) : (
                    movies.map((movie, index) => (
                      <tr key={movie.id} className={index % 2 === 0 ? 'bg-[#090909]' : 'bg-[#060606]'}>
                        <td className="px-4 py-4 align-top text-white max-w-60 truncate">{movie.title}</td>
                        <td className="px-4 py-4 align-top text-red-300">{movie.category}</td>
                        <td className="px-4 py-4 align-top text-zinc-300">{movie.mediaType || 'Movie'}</td>
                        <td className="px-4 py-4 align-top text-zinc-300">{movie.releaseYear}</td>
                        <td className="px-4 py-4 align-top text-zinc-300">{movie.rating?.toFixed?.(1) ?? movie.rating}</td>
                        <td className="px-4 py-4 align-top">
                          <div className="inline-flex items-center gap-2 rounded-full border border-red-800/40 bg-red-950/50 px-3 py-1 text-[11px] uppercase text-red-300 tracking-[0.18em]">
                            {movie.isPopular ? 'Popular' : movie.isTrending ? 'Trending' : 'Standard'}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button 
                              onClick={() => handleEdit(movie)} 
                              className="inline-flex items-center gap-2 rounded-full border border-red-700/50 bg-red-800/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-700/20 transition"
                            >
                              <PencilLine className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(movie.id)} 
                              className="inline-flex items-center gap-2 rounded-full border border-zinc-700/50 bg-zinc-900/80 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-red-800/20 hover:text-red-200 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style>{`
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(185, 28, 28, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(185, 28, 28, 0.5);
        }
      `}</style>
    </div>
  );
}