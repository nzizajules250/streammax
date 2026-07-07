import React, { useState, useEffect } from 'react';
import { Movie, UserProfile, UserSubscription, InAppNotification } from './types';
import { MOVIES } from './data/movies';
import AuthScreen from './components/AuthScreen';
import ProfileSelector from './components/ProfileSelector';
import PaymentSimulator from './components/PaymentSimulator';
import HeroBanner from './components/HeroBanner';
import MovieRow from './components/MovieRow';
import MovieDetailModal from './components/MovieDetailModal';
import VideoPlayer from './components/VideoPlayer';
import { 
  Search, Bell, ChevronDown, Sparkles, Wifi, WifiOff, HelpCircle, X, List, Compass, 
  Film, LogOut, Check, ArrowRight, ShieldAlert, CreditCard, Download, Trash2
} from 'lucide-react';
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
    title: 'Welcome to Netflix Studio!',
    message: 'Unlock personalized profiles, custom subtitle accent colors, and 4K cinema feeds.',
    userId: 'all',
    timestamp: Date.now() - 60000 * 5, // 5 min ago
    isRead: false,
    type: 'release',
  },
  {
    id: 'notif_recs',
    title: 'Workspace Critiques Live',
    message: 'Head over to any movie details to join the workspace review stream and post critiques.',
    userId: 'all',
    timestamp: Date.now() - 3600000, // 1 hour ago
    isRead: false,
    type: 'release',
  }
];

export default function App() {
  // 1. Payment Simulator Intercept
  const isSimulatorPath = window.location.pathname === '/payment-simulator';
  if (isSimulatorPath) {
    return <PaymentSimulator />;
  }

  // 2. Client-side Authentication state
  const [authUser, setAuthUser] = useState<{ uid: string; email: string; displayName: string } | null>(() => {
    const saved = localStorage.getItem('netflix_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [forceAuthScreen, setForceAuthScreen] = useState(false);

  // 3. Active Profile state
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('netflix_active_profile');
    return saved ? JSON.parse(saved) : null;
  });

  // 4. Subscription State
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [blockedMovieToWatch, setBlockedMovieToWatch] = useState<Movie | null>(null);

  // 5. Watchlist & History state
  const [watchlistMovieIds, setWatchlistMovieIds] = useState<string[]>([]);
  const [continueWatchingMovies, setContinueWatchingMovies] = useState<{ movie: Movie; progress: number }[]>([]);
  const [isContentLoading, setIsContentLoading] = useState(true);

  // 6. In-App Peer Sharing Recommendations state
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // 7. Notifications State
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  // 8. Offline Mode State
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [downloadedMovieIds, setDownloadedMovieIds] = useState<string[]>([]);

  // 9. UI Layout States
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Detect URL share referrals (e.g. /?watch=m2) & Payment redirects
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const watchId = urlParams.get('watch');
    if (watchId) {
      const target = MOVIES.find(m => m.id === watchId);
      if (target) {
        setSelectedMovie(target);
      }
    }

    const paymentStatus = urlParams.get('payment');
    if (paymentStatus === 'success') {
      setShowToast('🎉 Premium HD Cinematic Subscription Activated!');
      // Clean query parameter
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

    const syncSub = () => {
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
    const interval = setInterval(syncSub, 1500);
    return () => clearInterval(interval);
  }, [authUser]);

  // Sync Watchlist from LocalStorage
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

  // Sync Continue Watching progress from LocalStorage
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
            const matchedMovie = MOVIES.find(m => m.id === item.movieId);
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

  // Handle skeleton loading timer on mount and profile switch
  useEffect(() => {
    setIsContentLoading(true);
    const timer = setTimeout(() => {
      setIsContentLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [activeProfile]);

  // Sync Peer Recommendations from LocalStorage
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

  // Sync Notifications from LocalStorage
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

  // Sync offline downloads list
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

  const handleInitiateCheckout = () => {
    if (!authUser) return;
    setIsCheckoutLoading(true);

    setTimeout(() => {
      const txRef = `sim_tx_${Date.now()}`;
      const email = encodeURIComponent(authUser.email);
      const uid = encodeURIComponent(authUser.uid);
      const name = encodeURIComponent(authUser.displayName || '');
      
      // Redirect to sandbox payment simulator directly
      window.location.href = `/payment-simulator?tx_ref=${txRef}&email=${email}&uid=${uid}&name=${name}`;
      setIsCheckoutLoading(false);
    }, 800);
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
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    localStorage.setItem(key, JSON.stringify(updated));
    setNotifications(updated);
  };

  // Movie collections filter
  let baseMovies = MOVIES;
  if (isOfflineMode && activeProfile) {
    baseMovies = MOVIES.filter(m => downloadedMovieIds.includes(m.id));
  }

  const trendingMovies = baseMovies.filter(m => m.isTrending);
  const popularMovies = baseMovies.filter(m => m.isPopular);
  const scifiMovies = baseMovies.filter(m => m.category === 'Sci-Fi & Thrillers');
  const dramaMovies = baseMovies.filter(m => m.category === 'Award-Winning Dramas');
  const watchlistMovies = baseMovies.filter(m => watchlistMovieIds.includes(m.id));
  
  // Peer recommendation movies mapping
  const recommendedMovieIds = recommendations.map(r => r.movieId);
  const recommendedMovies = baseMovies.filter(m => recommendedMovieIds.includes(m.id));

  // Search filter
  const searchedMovies = baseMovies.filter(m => {
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.synopsis.toLowerCase().includes(q) ||
      m.genres.some(g => g.toLowerCase().includes(q))
    );
  });

  const featuredMovie = baseMovies[0] || MOVIES[0];

  // Loaders
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-red-600 space-y-4">
        <Film className="w-12 h-12 animate-pulse" />
        <span className="font-mono text-xs tracking-widest uppercase text-zinc-500">Loading Secure Session...</span>
      </div>
    );
  }

  // Auth Guard & Force Auth
  if (forceAuthScreen && !authUser) {
    return <AuthScreen onClose={() => setForceAuthScreen(false)} onLoginSuccess={(u) => setAuthUser(u)} />;
  }

  // Profile Selection Guard (only applies to authenticated users)
  if (authUser && !activeProfile) {
    return <ProfileSelector userId={authUser.uid} onSelect={handleSelectProfile} />;
  }

  const currentProfile = authUser ? activeProfile! : GUEST_PROFILE;

  return (
    <div className="min-h-screen bg-[#141414] text-white font-sans antialiased overflow-x-hidden select-none">
      
      {/* Toast notifications */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 16 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-101 bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2"
          >
            <span>{showToast}</span>
            <button onClick={() => setShowToast(null)} className="text-zinc-500 hover:text-white ml-2">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Immersive Video Player overlay */}
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

      {/* Subscription Call-to-action Modal */}
      <AnimatePresence>
        {showSubscriptionModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs">
            <div className="absolute inset-0 cursor-default" onClick={() => setShowSubscriptionModal(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-zinc-950 border border-zinc-800 p-8 rounded-2xl max-w-sm w-full shadow-2xl z-20 space-y-6 text-center"
            >
              <div className="w-14 h-14 bg-red-600/10 border border-red-600 rounded-full flex items-center justify-center mx-auto text-red-500">
                <CreditCard className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-white">Subscribe to Stream</h3>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  Watching full movies requires a premium subscription. Play the free trailer, or unlock ultra-HD access now using Flutterwave secure payment gateway.
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex justify-between items-center text-left">
                <div>
                  <span className="text-xs font-bold text-white block">Cinematic Premium</span>
                  <span className="text-[10px] text-zinc-500 font-medium">Auto-renewing monthly</span>
                </div>
                <span className="text-lg font-black text-amber-500">$9.99/mo</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {!authUser ? (
                  <button
                    onClick={() => {
                      setShowSubscriptionModal(false);
                      setForceAuthScreen(true);
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
                  >
                    Sign In to Subscribe
                  </button>
                ) : (
                  <button
                    onClick={handleInitiateCheckout}
                    disabled={isCheckoutLoading}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isCheckoutLoading ? 'Connecting Checkout...' : 'Unlock Premium Now'}
                  </button>
                )}
                
                {blockedMovieToWatch && (
                  <button
                    onClick={() => {
                      setShowSubscriptionModal(false);
                      // Fallback: watch trailer mode
                      setPlayingMovie(blockedMovieToWatch);
                    }}
                    className="w-full bg-zinc-900 hover:bg-zinc-855 text-zinc-300 font-bold py-3 rounded-xl text-xs transition-all cursor-pointer border border-zinc-800"
                  >
                    Watch Free Trailer (Preview)
                  </button>
                )}

                <button
                  onClick={() => setShowSubscriptionModal(false)}
                  className="text-xs text-zinc-500 hover:text-white font-semibold pt-1.5 transition-colors cursor-pointer"
                >
                  Cancel & Return
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Warning Banner for Offline mode */}
      {isOfflineMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-center py-2 text-xs font-bold text-amber-500 flex items-center justify-center gap-1.5 z-50 relative">
          <WifiOff className="w-4 h-4 animate-bounce" />
          <span>⚡ OFFLINE MODE ACTIVE • Showing local downloaded content (Play unrestricted)</span>
        </div>
      )}

      {/* Global Navbar */}
      <header
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-6xl rounded-2xl border transition-all duration-300 flex items-center justify-between px-6 py-2.5 backdrop-blur-md ${
          isScrolled ? 'bg-black/90 border-neutral-800/80 shadow-2xl shadow-black/60' : 'bg-black/50 border-neutral-800/30 shadow-lg'
        }`}
      >
        <div className="flex items-center gap-4 md:gap-8">
          <span className="text-xl md:text-2xl font-black tracking-tighter text-red-600 uppercase font-sans cursor-pointer">
            NETFLIX
          </span>

          <nav className="hidden lg:flex items-center gap-6 text-xs md:text-sm text-neutral-300 font-medium">
            <button className="hover:text-neutral-400 transition-colors cursor-pointer text-white font-bold">Home</button>
            <button className="hover:text-neutral-400 transition-colors cursor-pointer">TV Shows</button>
            <button className="hover:text-neutral-400 transition-colors cursor-pointer">Movies</button>
            <button 
              onClick={() => {
                const listRow = document.getElementById('my-list-section');
                if (listRow) {
                  listRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="hover:text-neutral-400 transition-colors cursor-pointer"
            >
              My List
            </button>
            <button className="hover:text-neutral-400 transition-colors cursor-pointer flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-red-500 animate-pulse" />
              <span>Recommendations</span>
            </button>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4 text-sm font-semibold">
          
          {/* Offline Mode Switch */}
          <button
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            className={`flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all ${
              isOfflineMode 
                ? 'bg-amber-600/10 border-amber-500 text-amber-500' 
                : 'bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Toggle Offline mode"
          >
            {isOfflineMode ? <Wifi className="w-3.5 h-3.5 text-amber-500" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isOfflineMode ? 'Online' : 'Offline'}</span>
          </button>

          {/* Real-time search */}
          <div className="relative flex items-center">
            <motion.div
              animate={{ width: isSearchOpen ? '180px' : '36px' }}
              className={`flex items-center bg-neutral-900/80 border ${
                isSearchOpen ? 'border-neutral-700 px-2.5' : 'border-transparent'
              } rounded-full py-1.5 transition-all overflow-hidden`}
            >
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-neutral-300 hover:text-white cursor-pointer focus:outline-hidden"
              >
                <Search className="h-4 w-4" />
              </button>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`ml-2 w-full bg-transparent border-none text-xs text-white focus:outline-hidden transition-opacity ${
                  isSearchOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />
              {isSearchOpen && searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-neutral-400 hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              )}
            </motion.div>
          </div>

          {/* Real-time Notifications Bell dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              className="text-neutral-300 hover:text-white cursor-pointer relative"
            >
              <Bell className="h-4.5 w-4.5" />
              {notifications.some(n => !n.isRead) && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 rounded-full text-[9px] font-black text-white flex items-center justify-center shadow-lg">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotificationMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-3 w-72 bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl z-50 text-xs text-neutral-300 p-2 space-y-1"
                >
                  <div className="px-3 py-2 text-neutral-500 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-900 flex justify-between items-center">
                    <span>Live Announcements ({notifications.length})</span>
                    <button onClick={() => setShowNotificationMenu(false)} className="text-neutral-500 hover:text-white">✕</button>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 py-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-zinc-500 text-[10px] font-mono">
                        No notifications currently active
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <button
                          key={notif.id}
                          onClick={() => {
                            markNotificationRead(notif.id);
                            setShowNotificationMenu(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-lg border transition-all block ${
                            notif.isRead 
                              ? 'bg-neutral-950 border-transparent text-zinc-400' 
                              : 'bg-zinc-900/60 border-zinc-800 text-zinc-100 hover:bg-zinc-900 font-medium'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-zinc-200">{notif.title}</span>
                            <span className="text-[8px] text-zinc-600 font-mono flex-none">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">{notif.message}</p>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown or Sign In */}
          {!authUser ? (
            <button
              onClick={() => setForceAuthScreen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl cursor-pointer transition-all shadow-md shadow-red-600/10"
            >
              Sign In
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-1 cursor-pointer focus:outline-hidden"
              >
                <div className="w-7 h-7 rounded-sm bg-zinc-800 flex items-center justify-center text-base border border-zinc-700">
                  {currentProfile.avatar}
                </div>
                <ChevronDown className={`h-3 w-3 text-neutral-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-3 w-52 bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl z-50 text-xs text-neutral-300 p-2 space-y-1"
                  >
                    <div className="px-3 py-2 text-neutral-500 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-900">
                      Switch Profile
                    </div>

                    <button
                      onClick={handleLogoutProfile}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer text-neutral-400 font-medium"
                    >
                      <List className="h-4 w-4" />
                      <span>Manage Profiles</span>
                    </button>

                    <button
                      onClick={handleSignOutUser}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer text-red-400 font-semibold"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out of Netflix</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      {/* Main Catalog Container */}
      <div className="pt-24 pb-20">
        {searchQuery ? (
          <div className="px-4 md:px-12 pt-10 space-y-6">
            <h1 className="text-xl md:text-2xl font-bold text-neutral-300">
              Showing search results for <span className="text-white">"{searchQuery}"</span>
            </h1>

            {searchedMovies.length === 0 ? (
              <div className="text-center py-20 text-neutral-500 flex flex-col items-center justify-center">
                <Compass className="h-10 w-10 text-neutral-600 mb-3" />
                <p className="font-semibold text-lg">No matches found</p>
                <p className="text-sm mt-1 text-neutral-400">Try adjusting your keywords or toggling Offline Mode.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {searchedMovies.map((movie) => (
                  <motion.div
                    key={movie.id}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setSelectedMovie(movie)}
                    className="bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="relative aspect-video">
                      <img
                        src={movie.backdropUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover filter brightness-95"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-2 right-2 bg-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                        {movie.rating}
                      </span>
                    </div>

                    <div className="p-3 text-xs flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="font-bold text-neutral-200 line-clamp-1">{movie.title}</h4>
                        <p className="text-neutral-400 line-clamp-2 mt-1 leading-normal font-medium">
                          {movie.synopsis}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-[10px] text-neutral-500 font-mono">
                        <span>{movie.releaseYear}</span>
                        <span className="text-emerald-500 font-bold">{Math.round(movie.rating * 20)}% Match</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Default Immersive Catalog Row stack */
          <div className="space-y-12">
            
            <HeroBanner
              movie={featuredMovie}
              profile={currentProfile}
              onPlay={handlePlayMovieTrigger}
              onOpenDetails={setSelectedMovie}
              onAuthRequired={handleAuthRequired}
              isLoading={isContentLoading}
            />

            <div className="space-y-10 -mt-16 sm:-mt-24 md:-mt-32 relative z-10 pb-10">
              {isContentLoading ? (
                <>
                  <MovieRow title="Continue Watching" isLoading={true} />
                  <MovieRow title="Trending Now" isLoading={true} />
                  <MovieRow title="Popular on Netflix" isLoading={true} />
                </>
              ) : (
                <>
                  {/* Continue Watching row pulling from LocalStorage watch progress */}
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

                  {/* Dynamic Peer recommendation row */}
                  {recommendedMovies.length > 0 && (
                    <div className="bg-gradient-to-r from-red-950/20 via-transparent to-transparent py-4 border-y border-red-500/10">
                      <MovieRow
                        title="Shared with me"
                        movies={recommendedMovies}
                        profile={currentProfile}
                        onPlay={handlePlayMovieTrigger}
                        onOpenDetails={setSelectedMovie}
                        onAuthRequired={handleAuthRequired}
                      />
                    </div>
                  )}

                  {/* My List synced to LocalStorage */}
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
                    title="Popular on Netflix"
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

      {/* Footer Branding */}
      <footer className="text-center py-12 text-xs text-neutral-500 font-mono border-t border-neutral-900 bg-neutral-950 px-4 space-y-4">
        <div className="flex flex-wrap justify-center gap-6 text-[11px] text-neutral-400 font-medium">
          <a href="#" className="hover:underline">Audio Description</a>
          <a href="#" className="hover:underline">Help Center</a>
          <a href="#" className="hover:underline">Gift Cards</a>
          <a href="#" className="hover:underline">Media Center</a>
          <a href="#" className="hover:underline">Investor Relations</a>
          <a href="#" className="hover:underline">Terms of Use</a>
          <a href="#" className="hover:underline">Privacy Statement</a>
        </div>
        <div className="font-semibold text-neutral-400 uppercase">REAL-TIME MULTI-PROFILE ENGINE SYNCHRONIZED SECURELY BY BROWSER STORAGE</div>
        <div className="text-[10px] text-neutral-600">© {new Date().getFullYear()} Netflix Web Clone Premium Edition • Built with Antigravity Workspace</div>
      </footer>
    </div>
  );
}
