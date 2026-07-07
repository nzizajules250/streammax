import React, { useState, useEffect } from 'react';
import { Movie, UserProfile, UserSubscription, InAppNotification } from './types';
import { db } from './lib/firebase';
import { useUser, useAuth } from '@clerk/clerk-react';
import { 
  collection, query, where, onSnapshot, doc, getDoc, updateDoc, addDoc, limit, orderBy
} from 'firebase/firestore';
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

export default function App() {
  // 1. Payment Simulator Intercept
  const isSimulatorPath = window.location.pathname === '/payment-simulator';
  if (isSimulatorPath) {
    return <PaymentSimulator />;
  }

  // 2. Clerk Authentication hooks & Mapping
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut, getToken } = useAuth();

  const authUser = user ? {
    uid: user.id,
    email: user.primaryEmailAddress?.emailAddress || '',
    displayName: user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User',
  } : null;

  const authLoading = !isLoaded;

  // 2.5 Force auth screen state
  const [forceAuthScreen, setForceAuthScreen] = useState(false);

  // 3. Active Profile
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('netflix_active_profile');
    return saved ? JSON.parse(saved) : null;
  });

  // 4. Subscription State
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [blockedMovieToWatch, setBlockedMovieToWatch] = useState<Movie | null>(null);

  // 5. Watchlist & History
  const [watchlistMovieIds, setWatchlistMovieIds] = useState<string[]>([]);
  const [historyMovieIds, setHistoryMovieIds] = useState<string[]>([]);

  // 6. In-App Peer Sharing Recommendations
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

  // Detect URL share referrals (e.g. /?watch=m2)
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

  // Sync Auth session (handled via Clerk useUser hook directly)

  // Sync Subscription status
  useEffect(() => {
    if (!authUser) {
      setSubscription(null);
      return;
    }

    const docRef = doc(db, 'subscriptions', authUser.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
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
    });

    return () => unsubscribe();
  }, [authUser]);

  // Sync Watchlist from Firestore
  useEffect(() => {
    if (!activeProfile) {
      setWatchlistMovieIds([]);
      return;
    }

    const q = query(
      collection(db, 'watchlist'),
      where('profileId', '==', activeProfile.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids: string[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.movieId) {
          ids.push(data.movieId);
        }
      });
      setWatchlistMovieIds(ids);
    });

    return () => unsubscribe();
  }, [activeProfile]);

  // Sync Peer-to-Peer Recommendations from Firestore
  useEffect(() => {
    if (!activeProfile) {
      setRecommendations([]);
      return;
    }

    const q = query(
      collection(db, 'recommendations'),
      where('toProfileId', '==', activeProfile.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: any[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push({ id: docSnap.id, ...docSnap.data() });
      });
      setRecommendations(loaded);
    });

    return () => unsubscribe();
  }, [activeProfile]);

  // Sync In-App real-time Notifications from Firestore
  useEffect(() => {
    if (!authUser) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [authUser.uid, 'all']),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: InAppNotification[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push({ id: docSnap.id, ...docSnap.data() } as InAppNotification);
      });
      setNotifications(loaded);
    });

    return () => unsubscribe();
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
    // Watch for detail modal download toggles using storage event or intervals
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

  const handleSignOutUser = async () => {
    await clerkSignOut();
    handleLogoutProfile();
  };

  const handleInitiateCheckout = async () => {
    if (!authUser) return;
    setIsCheckoutLoading(true);

    try {
      const token = await getToken();
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          email: authUser.email,
          uid: authUser.uid,
          name: authUser.displayName || authUser.email?.split('@')[0],
          profileId: activeProfile?.id || 'default'
        }),
      });

      const data = await response.json();
      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || 'Failed to initialize checkout gateway.');
      }
    } catch (err: any) {
      console.error(err);
      setShowToast('❌ Checkout initialization failed.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleAuthRequired = () => {
    setForceAuthScreen(true);
  };

  const handlePlayMovieTrigger = (movie: Movie) => {
    // Premium condition: If offline mode is active OR if user is premium, play instantly!
    // Else, prompt subscription checkout but allow trailer playback
    const isSubscribed = subscription?.isPremium === true;
    if (isOfflineMode || isSubscribed) {
      setPlayingMovie(movie);
    } else {
      setBlockedMovieToWatch(movie);
      setShowSubscriptionModal(true);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
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
    return <AuthScreen onClose={() => setForceAuthScreen(false)} />;
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

      {/* Database/Service Status Status Indicator */}
      <div className="bg-neutral-950 border-b border-neutral-900 text-[10px] sm:text-xs font-mono px-4 sm:px-12 py-2 flex justify-between items-center tracking-wider text-neutral-400">
        <div className="flex items-center gap-2 flex-wrap">
          <Wifi className="h-3.5 w-3.5 text-red-500 animate-pulse" />
          <span className="hidden sm:inline">SECURE MULTI-PROFILE PIPELINE:</span>
          <span className="text-emerald-500 font-bold uppercase">
            {!authUser ? 'PUBLIC PREVIEW ACTIVE • LOGIN TO UNLOCK' : 'FIREBASE AUTH + FIRESTORE ACTIVE'}
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-neutral-300">
          <span className="hidden sm:inline">Tier: <strong className="text-amber-500">{subscription?.isPremium ? 'Cinematic Premium ⭐' : !authUser ? 'Free Preview Mode 🍿' : 'Free Demo Tier 🍿'}</strong></span>
          <span>Profile: <strong className="text-white font-bold">{currentProfile.name} {currentProfile.avatar}</strong></span>
        </div>
      </div>

      {/* Top Warning Banner for Offline mode */}
      {isOfflineMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-center py-2 text-xs font-bold text-amber-500 flex items-center justify-center gap-1.5">
          <WifiOff className="w-4 h-4 animate-bounce" />
          <span>⚡ OFFLINE MODE ACTIVE • Showing local downloaded content (Play unrestricted)</span>
        </div>
      )}

      {/* Global Navbar */}
      <header
        className={`fixed top-10 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-12 py-3 transition-colors duration-500 ${
          isScrolled ? 'bg-black/95 backdrop-blur-md border-b border-neutral-900' : 'bg-gradient-to-b from-black/80 to-transparent'
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
              <Sparkles className="h-3.5 w-3.5 text-red-500" />
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
            {isOfflineMode ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
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
                        {movie.ageRating}
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
            
            {baseMovies.length > 0 && (
              <HeroBanner
                movie={featuredMovie}
                profile={currentProfile}
                onPlay={handlePlayMovieTrigger}
                onOpenDetails={setSelectedMovie}
                onAuthRequired={handleAuthRequired}
              />
            )}

            <div className="space-y-10 -mt-16 sm:-mt-24 md:-mt-32 relative z-10 pb-10">
              
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

              {/* My List synced to Firestore */}
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
        <div className="font-semibold text-neutral-400 uppercase">REAL-TIME MULTI-PROFILE ENGINE SYNCHRONIZED SECURELY BY FIRESTORE</div>
        <div className="text-[10px] text-neutral-600">© {new Date().getFullYear()} Netflix Web Clone Premium Edition • Built with Antigravity Workspace</div>
      </footer>
    </div>
  );
}
