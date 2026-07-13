import React, { useState, useEffect } from 'react';
import { Movie, UserProfile, UserSubscription, InAppNotification } from './types';
import { MOVIES } from './data/movies';
import AdminCMSPage from './components/AdminCMSPage';
import AdminAuthPage from './components/AdminAuthPage';
import AuthPage from './components/AuthPage';
import ProfileSelector from './components/ProfileSelector';
import PaymentSimulator from './components/PaymentSimulator';
import HeroBanner from './components/HeroBanner';
import MovieRow from './components/MovieRow';
import MovieDetailModal from './components/MovieDetailModal';
import VideoPlayer from './components/VideoPlayer';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import MoviesPage from './pages/MoviesPage';
import TVShowsPage from './pages/TVShowsPage';
import logoUrl from './assets/logo.svg';
import { 
  Search, Bell, ChevronDown, Sparkles, Wifi, WifiOff, HelpCircle, X, List, Compass, 
  Film, LogOut, Check, ArrowRight, ShieldAlert, CreditCard, Download, Trash2, Crown,
  Home, Tv, Clapperboard, User, Settings, Zap
} from 'lucide-react';
import { fetchMovies, initializeSubscriptionCheckout } from './lib/api';
import { motion, AnimatePresence } from 'motion/react';

const GUEST_PROFILE: UserProfile = {
  id: 'guest',
  name: 'Guest Browser',
  avatar: '🍿',
  color: 'zinc',
};

const DEFAULT_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'notif_welcome',
    title: 'Welcome to Stream Max!',
    message: 'Unlock personalized profiles, custom subtitle accent colors, and 4K cinema feeds.',
    userId: 'all',
    timestamp: Date.now() - 60000 * 5,
    isRead: false,
    type: 'release',
  },
  {
    id: 'notif_recs',
    title: 'Workspace Critiques Live',
    message: 'Head over to any movie details to join the workspace review stream and post critiques.',
    userId: 'all',
    timestamp: Date.now() - 3600000,
    isRead: false,
    type: 'release',
  }
];

export default function App() {
  const [pagePath, setPagePath] = useState(window.location.pathname || '/');
  const [authUser, setAuthUser] = useState<{ uid: string; email: string; displayName: string } | null>(() => {
    const saved = localStorage.getItem('netflix_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [forceAuthScreen, setForceAuthScreen] = useState(false);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('netflix_active_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [blockedMovieToWatch, setBlockedMovieToWatch] = useState<Movie | null>(null);
  const [watchlistMovieIds, setWatchlistMovieIds] = useState<string[]>([]);
  const [continueWatchingMovies, setContinueWatchingMovies] = useState<{ movie: Movie; progress: number }[]>([]);
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [movies, setMovies] = useState<Movie[]>(MOVIES);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [downloadedMovieIds, setDownloadedMovieIds] = useState<string[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => setPagePath(window.location.pathname || '/');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setPagePath(path);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resolveMovieById = (movieId: string) => {
    return movies.find((movie) => movie.id === movieId) ?? MOVIES.find((movie) => movie.id === movieId) ?? null;
  };

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const data = await fetchMovies();
        if (Array.isArray(data.movies)) {
          setMovies(data.movies);
        }
      } catch (error) {
        console.warn('Unable to load movies from backend, using bundled data.', error);
      }
    };
    loadMovies();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const watchId = urlParams.get('watch');
    if (watchId) {
      const target = resolveMovieById(watchId);
      if (target) {
        setSelectedMovie(target);
      }
    }
    const paymentStatus = urlParams.get('payment');
    if (paymentStatus === 'success') {
      setShowToast('🎉 Premium HD Cinematic Subscription Activated!');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'failed') {
      setShowToast('❌ Payment verification was cancelled or declined.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Sync Subscription state
  useEffect(() => {
    if (!authUser) {
      setSubscription(null);
      return;
    }
    const syncSub = async () => {
      try {
        const token = localStorage.getItem('netflix_auth_token');
        const response = await fetch('/api/subscriptions/me', {
          headers: { Authorization: `Bearer ${token || ''}` },
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.subscription) {
          setSubscription({
            isPremium: Boolean(data.subscription.isPremium && data.subscription.expiresAt > Date.now()),
            txRef: data.subscription.txRef || '',
            transactionId: data.subscription.transactionId || '',
            subscribedAt: data.subscription.subscribedAt || 0,
            expiresAt: data.subscription.expiresAt || 0,
          });
          return;
        }
      } catch (error) {
        console.warn('Unable to sync subscription from backend.', error);
      }
      const subKey = `subscription_${authUser.uid}`;
      const saved = localStorage.getItem(subKey);
      if (saved) {
        const data = JSON.parse(saved);
        setSubscription({
          isPremium: data.isPremium && data.expiresAt > Date.now(),
          txRef: data.txRef,
          transactionId: data.transactionId,
          subscribedAt: data.subscribedAt,
          expiresAt: data.expiresAt,
        });
      } else {
        setSubscription(null);
      }
    };
    syncSub();
    const interval = setInterval(syncSub, 10000);
    return () => clearInterval(interval);
  }, [authUser]);

  // Sync Watchlist
  useEffect(() => {
    if (!activeProfile) {
      setWatchlistMovieIds([]);
      return;
    }
    const syncWatchlist = () => {
      const key = `watchlist_${activeProfile.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setWatchlistMovieIds(JSON.parse(saved) as string[]);
      } else {
        setWatchlistMovieIds([]);
      }
    };
    syncWatchlist();
    const interval = setInterval(syncWatchlist, 1000);
    return () => clearInterval(interval);
  }, [activeProfile]);

  // Sync Continue Watching
  useEffect(() => {
    if (!activeProfile) {
      setContinueWatchingMovies([]);
      return;
    }
    const syncProgress = () => {
      const key = `progress_${activeProfile.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const progressList = JSON.parse(saved) as { movieId: string; progress: number; updatedAt: number }[];
        const list: { movie: Movie; progress: number; updatedAt: number }[] = [];
        progressList.forEach((item) => {
          const progressVal = item.progress || 0;
          if (progressVal > 0 && progressVal < 95) {
            const matchedMovie = resolveMovieById(item.movieId);
            if (matchedMovie) {
              list.push({
                movie: matchedMovie,
                progress: progressVal,
                updatedAt: item.updatedAt || 0
              });
            }
          }
        });
        list.sort((a, b) => b.updatedAt - a.updatedAt);
        setContinueWatchingMovies(list.map(item => ({ movie: item.movie, progress: item.progress })));
      } else {
        setContinueWatchingMovies([]);
      }
    };
    syncProgress();
    const interval = setInterval(syncProgress, 1000);
    return () => clearInterval(interval);
  }, [activeProfile]);

  useEffect(() => {
    setIsContentLoading(true);
    const timer = setTimeout(() => {
      setIsContentLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [activeProfile]);

  // Sync Peer Recommendations
  useEffect(() => {
    if (!activeProfile) {
      setRecommendations([]);
      return;
    }
    const syncRecommendations = () => {
      const key = `recommendations_${activeProfile.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setRecommendations(JSON.parse(saved));
      } else {
        setRecommendations([]);
      }
    };
    syncRecommendations();
    const interval = setInterval(syncRecommendations, 1500);
    return () => clearInterval(interval);
  }, [activeProfile]);

  // Sync Notifications
  useEffect(() => {
    const key = `notifications_${authUser?.uid || 'guest'}`;
    const syncNotifs = () => {
      const saved = localStorage.getItem(key);
      if (saved) {
        setNotifications(JSON.parse(saved));
      } else {
        localStorage.setItem(key, JSON.stringify(DEFAULT_NOTIFICATIONS));
        setNotifications(DEFAULT_NOTIFICATIONS);
      }
    };
    syncNotifs();
    const interval = setInterval(syncNotifs, 2000);
    return () => clearInterval(interval);
  }, [authUser]);

  // Sync offline downloads
  useEffect(() => {
    if (!activeProfile) {
      setDownloadedMovieIds([]);
      return;
    }
    const syncDownloads = () => {
      const downloadedList = JSON.parse(localStorage.getItem(`downloads_${activeProfile.id}`) || '[]');
      setDownloadedMovieIds(downloadedList);
    };
    syncDownloads();
    const interval = setInterval(syncDownloads, 2000);
    return () => clearInterval(interval);
  }, [activeProfile, selectedMovie]);

  // Scroll threshold
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSelectProfile = (profile: UserProfile) => {
    setActiveProfile(profile);
    localStorage.setItem('netflix_active_profile', JSON.stringify(profile));
  };

  const handleLogoutProfile = () => {
    setActiveProfile(null);
    localStorage.removeItem('netflix_active_profile');
    setIsProfileMenuOpen(false);
  };

  const handleSignOutUser = () => {
    localStorage.removeItem('netflix_auth_user');
    setAuthUser(null);
    handleLogoutProfile();
  };

  const handleToggleWatchlist = (movie: Movie) => {
    if (currentProfile?.id === 'guest' || !currentProfile) {
      setForceAuthScreen(true);
      return;
    }
    const listKey = `watchlist_${currentProfile.id}`;
    const saved = localStorage.getItem(listKey);
    const currentList = saved ? (JSON.parse(saved) as string[]) : [];
    const updated = currentList.includes(movie.id)
      ? currentList.filter((id) => id !== movie.id)
      : [...currentList, movie.id];
    localStorage.setItem(listKey, JSON.stringify(updated));
    setWatchlistMovieIds(updated);
    setShowToast(updated.includes(movie.id) ? 'Added to My List' : 'Removed from My List');
  };

  const handleInitiateCheckout = async () => {
    if (!authUser) {
      setShowToast('Please log in to access premium features.');
      return;
    }
    setIsCheckoutLoading(true);
    try {
      const response = await initializeSubscriptionCheckout({
        email: authUser.email,
        uid: authUser.uid,
        profileId: activeProfile?.id || 'default',
        name: authUser.displayName || authUser.email,
      });
      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      } else {
        setShowToast('Subscription checkout is unavailable right now.');
      }
    } catch (error: any) {
      setShowToast(error.message || 'Checkout could not be started.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleAuthRequired = () => {
    setForceAuthScreen(true);
  };

  const handlePlayMovieTrigger = (movie: Movie) => {
    const isSubscribed = subscription?.isPremium === true;
    if (isOfflineMode || isSubscribed) {
      setPlayingMovie(movie);
    } else {
      setBlockedMovieToWatch(movie);
      setShowSubscriptionModal(true);
    }
  };

  const markNotificationRead = (id: string) => {
    const key = `notifications_${authUser?.uid || 'guest'}`;
    const updated = notifications.map((n: any) => n.id === id ? { ...n, isRead: true } : n);
    localStorage.setItem(key, JSON.stringify(updated));
    setNotifications(updated);
  };

  const movieCatalog = movies.length > 0 ? movies : MOVIES;
  const currentProfile = authUser ? activeProfile ?? GUEST_PROFILE : GUEST_PROFILE;

  if (authUser && !activeProfile && pagePath !== '/auth' && pagePath !== '/admin' && pagePath !== '/cms' && pagePath !== '/payment-simulator') {
    return <ProfileSelector userId={authUser.uid} onSelect={handleSelectProfile} />;
  }

  let baseMovies = movieCatalog;
  if (isOfflineMode && activeProfile) {
    baseMovies = movieCatalog.filter(m => downloadedMovieIds.includes(m.id));
  }

  const trendingMovies = baseMovies.filter(m => m.isTrending);
  const popularMovies = baseMovies.filter(m => m.isPopular);
  const scifiMovies = baseMovies.filter(m => m.category === 'Sci-Fi & Thrillers');
  const dramaMovies = baseMovies.filter(m => m.category === 'Award-Winning Dramas');
  const watchlistMovies = baseMovies.filter(m => watchlistMovieIds.includes(m.id));
  const recommendedMovieIds = recommendations.map((r: any) => r.movieId);
  const recommendedMovies = baseMovies.filter(m => recommendedMovieIds.includes(m.id));

  const searchedMovies = baseMovies.filter(m => {
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.synopsis.toLowerCase().includes(q) ||
      m.genres.some(g => g.toLowerCase().includes(q))
    );
  });

  const featuredMovie = baseMovies[0] || movieCatalog[0] || MOVIES[0];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-red-950 flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-red-800 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Film className="w-16 h-16 text-red-500" />
        </motion.div>
        <span className="font-mono text-sm tracking-widest uppercase text-zinc-500">Loading Secure Session...</span>
      </div>
    );
  }

  if (pagePath === '/payment-simulator') {
    return <PaymentSimulator />;
  }

  if (pagePath === '/auth' && !authUser) {
    return <AuthPage onClose={() => setForceAuthScreen(false)} onLoginSuccess={(u) => setAuthUser(u)} />;
  }

  if (pagePath === '/cms') {
    return <AdminCMSPage />;
  }

  if (pagePath === '/admin') {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    return adminToken ? <AdminCMSPage /> : <AdminAuthPage />;
  }

  if (pagePath === '/profile') {
    if (!authUser) {
      return <AuthPage onClose={() => setForceAuthScreen(false)} onLoginSuccess={(u) => setAuthUser(u)} />;
    }
    return (
      <ProfilePage
        authUser={authUser}
        profile={currentProfile}
        subscription={subscription}
        movies={movieCatalog}
        watchlistMovieIds={watchlistMovieIds}
        continueWatchingMovies={continueWatchingMovies}
        onNavigate={navigate}
        onPlay={handlePlayMovieTrigger}
        onOpenDetails={setSelectedMovie}
        onAuthRequired={handleAuthRequired}
        onSignOut={handleSignOutUser}
      />
    );
  }

  if (pagePath === '/movies') {
    return (
      <MoviesPage
        movies={movieCatalog}
        profile={currentProfile}
        onPlay={handlePlayMovieTrigger}
        onOpenDetails={setSelectedMovie}
        onAuthRequired={handleAuthRequired}
        onNavigate={navigate}
      />
    );
  }

  if (pagePath === '/tv-shows') {
    return (
      <TVShowsPage
        movies={movieCatalog}
        profile={currentProfile}
        onPlay={handlePlayMovieTrigger}
        onOpenDetails={setSelectedMovie}
        onAuthRequired={handleAuthRequired}
        onNavigate={navigate}
      />
    );
  }

  if (forceAuthScreen && !authUser) {
    return <AuthPage onClose={() => setForceAuthScreen(false)} onLoginSuccess={(u) => setAuthUser(u)} />;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-red-950 text-white font-sans antialiased overflow-x-hidden select-none">
      
      {/* Toast notifications */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 16, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[101] bg-gradient-to-r from-zinc-900/95 to-black/95 backdrop-blur-xl border-2 border-red-900/20 text-sm text-zinc-200 font-semibold px-6 py-4 rounded-2xl shadow-2xl shadow-red-900/10 flex items-center gap-3"
          >
            <Sparkles className="w-4 h-4 text-red-400" />
            <span>{showToast}</span>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowToast(null)} 
              className="p-1 rounded-lg hover:bg-red-950/30 text-zinc-500 hover:text-red-400 transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Player */}
      <AnimatePresence>
        {playingMovie && (
          <VideoPlayer
            movie={playingMovie}
            profile={currentProfile}
            isPremium={isOfflineMode || subscription?.isPremium === true}
            onClose={() => setPlayingMovie(null)}
            onSubscribeTrigger={() => {
              setPlayingMovie(null);
              setBlockedMovieToWatch(playingMovie);
              setShowSubscriptionModal(true);
            }}
            onAuthRequired={handleAuthRequired}
          />
        )}
      </AnimatePresence>

      {/* Movie Details Modal */}
      <AnimatePresence>
        {selectedMovie && (
          <MovieDetailModal
            movie={selectedMovie}
            profile={currentProfile}
            onClose={() => setSelectedMovie(null)}
            onPlay={handlePlayMovieTrigger}
            onAuthRequired={handleAuthRequired}
          />
        )}
      </AnimatePresence>

      {/* Subscription Modal */}
      <AnimatePresence>
        {showSubscriptionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gradient-to-br from-black/95 via-zinc-950/95 to-red-950/95 backdrop-blur-md">
            <div className="absolute inset-0 cursor-default" onClick={() => setShowSubscriptionModal(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-gradient-to-b from-zinc-900/95 via-black/95 to-red-950/30 backdrop-blur-xl border-2 border-red-900/20 p-8 rounded-2xl max-w-sm w-full shadow-2xl z-20 space-y-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-16 h-16 bg-gradient-to-br from-red-600/20 to-red-900/20 border-2 border-red-500/50 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-900/20"
              >
                <Crown className="w-8 h-8 text-red-400" />
              </motion.div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">Subscribe to Stream</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Watching full movies requires a premium subscription. Play the free trailer, or unlock ultra-HD access now.
                </p>
              </div>

              <div className="bg-gradient-to-r from-zinc-950/80 to-black/80 border-2 border-zinc-800/50 p-5 rounded-xl flex justify-between items-center text-left backdrop-blur-sm">
                <div>
                  <span className="text-sm font-bold text-white block">Cinematic Premium</span>
                  <span className="text-xs text-zinc-500">Auto-renewing monthly</span>
                </div>
                <span className="text-xl font-black bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">$9.99/mo</span>
              </div>

              <div className="flex flex-col gap-3">
                {!authUser ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowSubscriptionModal(false);
                      setForceAuthScreen(true);
                    }}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Sign In to Subscribe
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleInitiateCheckout}
                    disabled={isCheckoutLoading}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                  >
                    {isCheckoutLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Zap className="w-4 h-4" />
                        </motion.div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Crown className="w-4 h-4" />
                        Unlock Premium Now
                      </>
                    )}
                  </motion.button>
                )}
                
                {blockedMovieToWatch && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowSubscriptionModal(false);
                      setPlayingMovie(blockedMovieToWatch);
                    }}
                    className="w-full bg-gradient-to-r from-zinc-900/80 to-black/80 border-2 border-zinc-700/50 hover:border-red-800/50 text-zinc-300 font-bold py-3 rounded-xl text-sm transition-all backdrop-blur-sm"
                  >
                    Watch Free Trailer (Preview)
                  </motion.button>
                )}

                <button
                  onClick={() => setShowSubscriptionModal(false)}
                  className="text-sm text-zinc-500 hover:text-red-400 font-semibold transition-colors"
                >
                  Cancel & Return
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Offline Mode Banner */}
      <AnimatePresence>
        {isOfflineMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-amber-950/50 to-amber-900/30 border-b border-amber-800/50 text-center py-2.5 text-xs font-bold text-amber-400 flex items-center justify-center gap-2 z-50 relative backdrop-blur-sm"
          >
            <WifiOff className="w-4 h-4" />
            <span>OFFLINE MODE ACTIVE • Showing local downloaded content</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Navbar */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-6xl rounded-2xl border transition-all duration-500 flex items-center justify-between px-6 py-3 backdrop-blur-xl ${
          isScrolled 
            ? 'bg-black/95 border-red-900/20 shadow-2xl shadow-red-900/10' 
            : 'bg-black/60 border-zinc-800/30 shadow-lg'
        }`}
      >
        <div className="flex items-center gap-6">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')} 
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-lg shadow-red-900/20">
              <Film className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg md:text-xl font-black tracking-tighter text-white uppercase hidden sm:block">
              Stream Max
            </span>
          </motion.button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { path: '/', label: 'Home', icon: Home },
              { path: '/tv-shows', label: 'TV Shows', icon: Tv },
              { path: '/movies', label: 'Movies', icon: Clapperboard },
              { path: '/profile', label: 'Profile', icon: User },
              { path: '/admin', label: 'Admin', icon: ShieldAlert },
            ].map(({ path, label, icon: Icon }) => (
              <motion.button
                key={path}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(path)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  pagePath === path
                    ? 'bg-gradient-to-r from-red-600/20 to-red-900/20 text-red-400 border border-red-800/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </motion.button>
            ))}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Offline Mode Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border-2 transition-all duration-300 ${
              isOfflineMode 
                ? 'bg-gradient-to-r from-amber-600/20 to-amber-900/20 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-900/10' 
                : 'bg-zinc-900/60 border-zinc-700/50 text-zinc-400 hover:text-white hover:border-red-800/50'
            }`}
            title="Toggle Offline mode"
          >
            {isOfflineMode ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{isOfflineMode ? 'Online' : 'Offline'}</span>
          </motion.button>

          {/* Search */}
          <div className="relative flex items-center">
            <motion.div
              animate={{ width: isSearchOpen ? '200px' : '40px' }}
              className={`flex items-center bg-zinc-900/80 backdrop-blur-sm border-2 rounded-xl py-2 transition-all overflow-hidden ${
                isSearchOpen ? 'border-red-800/50 px-3' : 'border-zinc-700/50'
              }`}
            >
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-zinc-400 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>
              <input
                type="text"
                placeholder="Search titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`ml-2 w-full bg-transparent border-none text-sm text-white placeholder-zinc-500 focus:outline-none transition-opacity ${
                  isSearchOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />
              {isSearchOpen && searchQuery && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setSearchQuery('')}
                  className="text-zinc-400 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </motion.div>
          </div>

          {/* Notifications */}
          <div className="relative">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              className="relative p-2 rounded-xl bg-zinc-900/60 border-2 border-zinc-700/50 hover:border-red-800/50 text-zinc-400 hover:text-red-400 transition-all duration-300"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-r from-red-600 to-red-700 rounded-full text-[10px] font-black text-white flex items-center justify-center shadow-lg shadow-red-900/30 border-2 border-zinc-900"
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotificationMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 bg-gradient-to-b from-zinc-900/95 to-black/95 backdrop-blur-xl border-2 border-red-900/20 rounded-2xl overflow-hidden shadow-2xl z-50"
                >
                  <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-red-400" />
                      Notifications
                    </h3>
                    <span className="text-xs text-zinc-500 font-mono">{notifications.length} total</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-zinc-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <motion.button
                          key={notif.id}
                          whileHover={{ backgroundColor: 'rgba(185, 28, 28, 0.1)' }}
                          onClick={() => {
                            markNotificationRead(notif.id);
                            setShowNotificationMenu(false);
                          }}
                          className={`w-full text-left p-4 border-b border-zinc-800/30 transition-all ${
                            notif.isRead ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-white">{notif.title}</p>
                              <p className="text-xs text-zinc-400 mt-1">{notif.message}</p>
                            </div>
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5"></span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-600 font-mono mt-2 block">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </motion.button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile / Auth */}
          {!authUser ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setForceAuthScreen(true)}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Sign In
            </motion.button>
          ) : (
            <div className="flex items-center gap-3">
              {subscription?.isPremium && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-600/20 to-amber-900/20 border-2 border-amber-500/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 shadow-lg shadow-amber-900/10"
                >
                  <Crown className="w-3.5 h-3.5" />
                  Premium
                </motion.span>
              )}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900/60 border-2 border-zinc-700/50 hover:border-red-800/50 transition-all duration-300"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-800/30 flex items-center justify-center text-lg">
                    {currentProfile.avatar}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-gradient-to-b from-zinc-900/95 to-black/95 backdrop-blur-xl border-2 border-red-900/20 rounded-2xl overflow-hidden shadow-2xl z-50"
                    >
                      <div className="p-3 border-b border-zinc-800/50">
                        <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Signed in as</p>
                        <p className="text-sm font-bold text-white">{currentProfile.name}</p>
                      </div>
                      <div className="p-2 space-y-1">
                        <motion.button
                          whileHover={{ backgroundColor: 'rgba(185, 28, 28, 0.1)' }}
                          onClick={handleLogoutProfile}
                          className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:text-white transition-colors"
                        >
                          <List className="w-4 h-4" />
                          Switch Profile
                        </motion.button>
                        <motion.button
                          whileHover={{ backgroundColor: 'rgba(185, 28, 28, 0.1)' }}
                          onClick={handleSignOutUser}
                          className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 transition-colors font-semibold"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-zinc-900/60 border-2 border-zinc-700/50 text-zinc-400"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <List className="w-5 h-5" />}
          </motion.button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-4 right-4 z-30 lg:hidden bg-gradient-to-b from-zinc-900/95 to-black/95 backdrop-blur-xl border-2 border-red-900/20 rounded-2xl shadow-2xl p-4"
          >
            <nav className="space-y-2">
              {[
                { path: '/', label: 'Home', icon: Home },
                { path: '/tv-shows', label: 'TV Shows', icon: Tv },
                { path: '/movies', label: 'Movies', icon: Clapperboard },
                { path: '/profile', label: 'Profile', icon: User },
                { path: '/admin', label: 'Admin', icon: ShieldAlert },
              ].map(({ path, label, icon: Icon }) => (
                <motion.button
                  key={path}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    pagePath === path
                      ? 'bg-gradient-to-r from-red-600/20 to-red-900/20 text-red-400 border border-red-800/30'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </motion.button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="pt-24 pb-20">
        {searchQuery ? (
          <div className="px-4 md:px-12 pt-10 space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl md:text-2xl font-bold text-zinc-300"
            >
              Results for <span className="text-red-400">"{searchQuery}"</span>
            </motion.h1>

            {searchedMovies.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-black/80 border border-zinc-800/50 mx-auto flex items-center justify-center mb-6">
                  <Search className="w-10 h-10 text-zinc-600" />
                </div>
                <p className="font-bold text-lg text-white mb-2">No matches found</p>
                <p className="text-sm text-zinc-400">Try adjusting your keywords or toggling Offline Mode.</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
              >
                {searchedMovies.map((movie) => (
                  <motion.div
                    key={movie.id}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedMovie(movie)}
                    className="bg-gradient-to-b from-zinc-900/90 to-black/90 rounded-xl overflow-hidden border-2 border-zinc-800/50 hover:border-red-800/30 transition-all cursor-pointer group shadow-lg hover:shadow-red-900/10 backdrop-blur-sm"
                  >
                    <div className="relative aspect-video">
                      <img
                        src={movie.backdropUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <span className="absolute top-2 right-2 bg-gradient-to-r from-red-600 to-red-700 text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg">
                        {movie.rating}
                      </span>
                    </div>
                    <div className="p-3 space-y-2">
                      <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-red-400 transition-colors">
                        {movie.title}
                      </h4>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {movie.synopsis}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                        <span className="text-[10px] text-zinc-500 font-mono">{movie.releaseYear}</span>
                        <span className="text-[10px] text-emerald-400 font-bold">
                          {Math.round(movie.rating * 20)}% Match
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
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
                  <MovieRow title="Continue Watching" isLoading={true} />
                  <MovieRow title="Trending Now" isLoading={true} />
                  <MovieRow title="Popular on Stream Max" isLoading={true} />
                </>
              ) : (
                <>
                  {continueWatchingMovies.length > 0 && (
                    <MovieRow
                      title="Continue Watching"
                      movies={continueWatchingMovies.map(item => item.movie)}
                      profile={currentProfile}
                      onPlay={handlePlayMovieTrigger}
                      onOpenDetails={setSelectedMovie}
                      onAuthRequired={handleAuthRequired}
                    />
                  )}

                  {recommendedMovies.length > 0 && (
                    <div className="bg-gradient-to-r from-red-950/20 via-transparent to-transparent py-4 border-y border-red-500/10">
                      <MovieRow
                        title="Shared with Me"
                        movies={recommendedMovies}
                        profile={currentProfile}
                        onPlay={handlePlayMovieTrigger}
                        onOpenDetails={setSelectedMovie}
                        onAuthRequired={handleAuthRequired}
                      />
                    </div>
                  )}

                  <div id="my-list-section">
                    <MovieRow
                      title="My List"
                      movies={watchlistMovies}
                      profile={currentProfile}
                      onPlay={handlePlayMovieTrigger}
                      onOpenDetails={setSelectedMovie}
                      onAuthRequired={handleAuthRequired}
                    />
                  </div>

                  <MovieRow
                    title="Trending Now"
                    movies={trendingMovies}
                    profile={currentProfile}
                    onPlay={handlePlayMovieTrigger}
                    onOpenDetails={setSelectedMovie}
                    onAuthRequired={handleAuthRequired}
                  />

                  <MovieRow
                    title="Popular on Stream Max"
                    movies={popularMovies}
                    profile={currentProfile}
                    onPlay={handlePlayMovieTrigger}
                    onOpenDetails={setSelectedMovie}
                    onAuthRequired={handleAuthRequired}
                  />

                  <MovieRow
                    title="Sci-Fi & Fantasy Masterpieces"
                    movies={scifiMovies}
                    profile={currentProfile}
                    onPlay={handlePlayMovieTrigger}
                    onOpenDetails={setSelectedMovie}
                    onAuthRequired={handleAuthRequired}
                  />

                  <MovieRow
                    title="Award-Winning Dramas"
                    movies={dramaMovies}
                    profile={currentProfile}
                    onPlay={handlePlayMovieTrigger}
                    onOpenDetails={setSelectedMovie}
                    onAuthRequired={handleAuthRequired}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-red-900/10 bg-gradient-to-b from-black to-zinc-950 py-16 px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4 max-w-md">
            <div className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-lg shadow-red-900/20">
                <Film className="w-7 h-7 bg-linear-to-br from-red-600 to-red-900" />
              </div>
              <div>
                <p className="text-lg font-black uppercase tracking-wider text-white">Stream Max</p>
                <p className="text-xs text-zinc-500">Premium streaming experience</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Enjoy seamless content discovery, TV series management, and multi-profile support with an advanced streaming experience built for modern media businesses.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-4">Browse</h3>
              <ul className="space-y-2.5">
                {['Home', 'Movies', 'TV Shows', 'Profile'].map(item => (
                  <li 
                    key={item}
                    onClick={() => navigate(item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '-')}`)}
                    className="text-sm text-zinc-400 hover:text-red-400 transition-colors cursor-pointer font-medium"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-4">Support</h3>
              <ul className="space-y-2.5">
                {['Help Center', 'Contact Sales', 'Privacy'].map(item => (
                  <li key={item} className="text-sm text-zinc-400 hover:text-red-400 transition-colors cursor-pointer font-medium">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-4">Company</h3>
              <ul className="space-y-2.5">
                {['About Us', 'Careers', 'Press'].map(item => (
                  <li key={item} className="text-sm text-zinc-400 hover:text-red-400 transition-colors cursor-pointer font-medium">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800/30 text-center">
          <p className="text-xs text-zinc-600 font-mono uppercase tracking-wider">
            © {new Date().getFullYear()} Stream Max • Built for modern streaming operations
          </p>
        </div>
      </footer>

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
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(185, 28, 28, 0.3);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}