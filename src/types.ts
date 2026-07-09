export interface Movie {
  id: string;
  title: string;
  synopsis: string;
  backdropUrl: string;
  posterUrl: string;
  videoUrl: string;
  trailerUrl?: string;
  category: string;
  mediaType?: string;
  seriesCount?: number;
  episodeUrls?: string[];
  rating: number; // e.g. 4.9
  releaseYear: number;
  duration: string; // e.g. '9 Episodes' or '2h 18m'
  ageRating: string; // e.g. 'TV-14', 'R'
  genres: string[];
  cast: string[];
  isTrending?: boolean;
  isPopular?: boolean;
  trendingRank?: number;
  muxPlaybackId?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface ReviewDoc {
  id: string;
  profileId: string;
  profileName: string;
  profileAvatar: string;
  movieId: string;
  content: string;
  timestamp: number;
}

export interface UserSubscription {
  isPremium: boolean;
  txRef: string;
  transactionId: string;
  subscribedAt: number;
  expiresAt: number;
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  userId: string;
  timestamp: number;
  isRead: boolean;
  type: 'release' | 'payment';
}

export interface SubtitleSettings {
  language: 'en' | 'es' | 'fr' | 'off';
  size: 'small' | 'medium' | 'large';
  color: 'white' | 'yellow' | 'green';
  opacity: 0 | 50 | 100;
}
