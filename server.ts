import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pkg from 'pg';
import Mux from '@mux/mux-node';
import { Resend } from 'resend';

// Load environment variables
dotenv.config();

// Resolve paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __cwd = process.cwd();

const { Pool } = pkg;
const pgPool = process.env.DATABASE_URL || process.env.POSTGRES_URL ? new Pool({ connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL }) : null;
const mux = process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET ? new Mux({ tokenId: process.env.MUX_TOKEN_ID, tokenSecret: process.env.MUX_TOKEN_SECRET }) : null;
const resend = process.env.RESEND_API_KEY ?  new Resend('re_W7eRvHRf_Gzf3NpJdZGcRnTFFw5b9RbMi') : null ;

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev_admin_jwt_secret';

// In-memory stores as fallback when Postgres is not configured
const userStore = new Map<string, any>();

interface AdminRecord {
  adminId: string;
  email: string;
  passwordHash: string;
  name?: string;
  createdAt?: number;
}

const adminStore = new Map<string, AdminRecord>();
const subscriptionStore = new Map<string, any>();
const notificationStore = new Map<string, any[]>();

type AuthenticatedRequest = Request & {
  user?: Record<string, any>;
  admin?: Record<string, any>;
};

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : 'Unknown error';

const verifyAdminToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as Record<string, any>;
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin role required.' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
  }
};

const app = express();
app.use(express.json());

const PORT = 3000;

const verificationStore = new Map<string, { code: string; expiresAt: number }>();

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

interface MovieRecord {
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
  rating: number;
  releaseYear: number;
  duration: string;
  ageRating: string;
  genres: string[];
  cast: string[];
  isTrending?: boolean;
  isPopular?: boolean;
  trendingRank?: number;
  muxPlaybackId?: string;
  episodeUrls?: string[];
}

const movieStore = new Map<string, MovieRecord>();

const DEFAULT_MOVIES: Array<Omit<MovieRecord, 'id'>> = [
  {
    title: 'Midnight Circuit',
    synopsis: 'A rogue AI programmer discovers a hidden network that predicts the future of cinema.',
    backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    trailerUrl: 'https://www.w3schools.com/html/movie.mp4',
    category: 'Sci-Fi & Thrillers',
    rating: 4.8,
    releaseYear: 2026,
    duration: '2h 08m',
    ageRating: 'PG-13',
    genres: ['Sci-Fi', 'Thriller', 'Action'],
    cast: ['Maya Chen', 'Jordan Brooks', 'Alicia Price'],
    isTrending: true,
    isPopular: true,
    muxPlaybackId: 'demo-midnight-circuit',
  },
  {
    title: 'Golden Hour',
    synopsis: 'A struggling filmmaker returns home to shoot a secretive wedding story that changes everything.',
    backdropUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1400&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    category: 'Award-Winning Dramas',
    rating: 4.6,
    releaseYear: 2025,
    duration: '1h 57m',
    ageRating: 'PG',
    genres: ['Drama', 'Romance'],
    cast: ['Elena Cruz', 'Samir Cole'],
    isTrending: true,
    isPopular: false,
  },
  {
    title: 'Neon Harbor',
    synopsis: 'A team of marine architects races to save a city from a rising tide and a hidden conspiracy.',
    backdropUrl: 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=1400&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    category: 'New Releases',
    mediaType: 'Movie',
    seriesCount: 0,
    rating: 4.7,
    releaseYear: 2026,
    duration: '2h 14m',
    ageRating: 'R',
    genres: ['Action', 'Adventure'],
    cast: ['Darius Hall', 'Nina Sol'],
    isPopular: true,
  },
  {
    title: 'Neon Protocol',
    synopsis: 'A covert cyber team tracks a digital ghost across nine episodes of corporate espionage.',
    backdropUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    category: 'TV Series',
    mediaType: 'TV Series',
    seriesCount: 9,
    episodeUrls: [
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'https://www.w3schools.com/html/movie.mp4',
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'https://www.w3schools.com/html/movie.mp4',
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'https://www.w3schools.com/html/movie.mp4',
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'https://www.w3schools.com/html/movie.mp4',
      'https://www.w3schools.com/html/mov_bbb.mp4',
    ],
    rating: 4.5,
    releaseYear: 2026,
    duration: '9 Episodes',
    ageRating: 'TV-14',
    genres: ['Sci-Fi', 'Thriller'],
    cast: ['Riley Stone', 'Mina Kade', 'Jonas Finch'],
    isTrending: true,
    isPopular: true,
  },
];

async function ensureDatabaseSchema() {
  if (!pgPool) {
    return;
  }

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      password_hash TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      user_id TEXT PRIMARY KEY,
      is_premium BOOLEAN DEFAULT FALSE,
      tx_ref TEXT,
      transaction_id TEXT,
      subscribed_at BIGINT,
      expires_at BIGINT
    )
  `);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS movies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      synopsis TEXT,
      backdrop_url TEXT,
      poster_url TEXT,
      video_url TEXT,
      category TEXT,
      media_type TEXT,
      series_count INT,
      episode_urls TEXT[],
      rating NUMERIC,
      release_year INT,
      duration TEXT,
      age_rating TEXT,
      genres TEXT[],
      "cast" TEXT[],
      is_trending BOOLEAN DEFAULT FALSE,
      is_popular BOOLEAN DEFAULT FALSE,
      mux_playback_id TEXT,
      trailer_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      email TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      movie_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, movie_id)
    )
  `);
}

// Initialize database before starting server
await ensureDatabaseSchema();

if (!pgPool) {
  for (const [idx, movie] of DEFAULT_MOVIES.entries()) {
    movieStore.set(`m_mem_${idx}`, {
      id: `m_mem_${idx}`,
      ...movie,
    });
  }
}

async function seedStarterMovies() {
  if (!pgPool) return;
  try {
    const existing = await pgPool.query('SELECT COUNT(*)::int AS count FROM movies');
    if ((existing.rows[0]?.count ?? 0) > 0) {
      return;
    }

    for (const movie of DEFAULT_MOVIES) {
      const movieId = `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await pgPool.query(
        `INSERT INTO movies(id, title, synopsis, backdrop_url, poster_url, video_url, category, media_type, series_count, episode_urls, rating, release_year, duration, age_rating, genres, "cast", is_trending, is_popular, mux_playback_id, trailer_url)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [movieId, movie.title, movie.synopsis, movie.backdropUrl, movie.posterUrl, movie.videoUrl, movie.category, movie.mediaType || null, movie.seriesCount || 0, movie.episodeUrls || null, movie.rating, movie.releaseYear, movie.duration, movie.ageRating, movie.genres, movie.cast, movie.isTrending, movie.isPopular, movie.muxPlaybackId || null, movie.trailerUrl || null]
      );
    }
  } catch (error) {
    console.error('Starter movie seed error:', getErrorMessage(error));
  }
}

await seedStarterMovies();

app.get('/api/health', (_req, res) => {
  res.json({ success: true, status: 'ok', database: pgPool ? 'postgres' : 'memory' });
});

app.post('/api/auth/send-code', async (req, res) => {
  const { email } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'A valid email is required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const code = generateCode();
  verificationStore.set(normalizedEmail, { code, expiresAt: Date.now() + 10 * 60 * 1000 });

  try {
    if (resend) {
      await resend.emails.send({
        from: 'Stream Max <streammax@streammaxcomp.com>',
        to: [normalizedEmail],
        subject: 'Your StreamMax verification code',
        html: `<p>Your StreamMax verification code is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p>`,
      });
      return res.json({ success: true, message: `A 6-digit verification code was sent to ${normalizedEmail}.` });
    }

    console.log(`[auth] verification code for ${normalizedEmail}: ${code}`);
    return res.json({
      success: true,
      message: `A 6-digit verification code was prepared for ${normalizedEmail}.`,
      debugCode: code,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Unable to send verification code.' });
  }
});

app.post('/api/auth/verify-code', async (req, res) => {
  const { email, code, name } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required.' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const record = verificationStore.get(normalizedEmail);
  if (!record) {
    return res.status(400).json({ error: 'No verification code was requested for that email.' });
  }

  if (record.expiresAt < Date.now()) {
    verificationStore.delete(normalizedEmail);
    return res.status(400).json({ error: 'The verification code has expired. Please request a new one.' });
  }

  if (record.code !== String(code).trim()) {
    return res.status(400).json({ error: 'The verification code is incorrect.' });
  }

  verificationStore.delete(normalizedEmail);

  // Create or lookup user record (persist to Postgres if available)
  let user: any = null;
  if (pgPool) {
    try {
      const result = await pgPool.query('SELECT id, email, full_name FROM users WHERE email = $1', [normalizedEmail]);
      if (result.rows.length === 0) {
        const fullName = String(name || '').trim() || normalizedEmail.split('@')[0];
        const insert = await pgPool.query('INSERT INTO users(email, full_name ) VALUES($1,$2) RETURNING id, email, full_name', [normalizedEmail, fullName]);
        user = { uid: `u_${insert.rows[0].id}`, email: insert.rows[0].email, displayName: insert.rows[0].full_name || insert.rows[0].email.split('@')[0] };
      } else {
        const r = result.rows[0];
        user = { uid: `u_${r.id}`, email: r.email, displayName: r.full_name || r.email.split('@')[0] };
      }
    } catch (err) {
      console.error('Postgres user lookup error:', getErrorMessage(err));
    }
  }

  if (!user) {
    // fallback to in-memory user
    const uid = `u_${Date.now()}`;
    user = { uid, email: normalizedEmail, displayName: normalizedEmail.split('@')[0] };
    userStore.set(uid, user);
  }

  const token = jwt.sign({ uid: user.uid, email: user.email, displayName: user.displayName }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '30d' });

  return res.json({ success: true, message: 'Email verified successfully.', user, token });
});

app.get('/api/movies', async (req, res) => {
  if (pgPool) {
    try {
      const result = await pgPool.query('SELECT * FROM movies ORDER BY created_at DESC');
      const movies = result.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        synopsis: row.synopsis || '',
        backdropUrl: row.backdrop_url || '',
        posterUrl: row.poster_url || '',
        videoUrl: row.video_url || '',
        trailerUrl: row.trailer_url || '',
        category: row.category || 'New Releases',
        mediaType: row.media_type || 'Movie',
        seriesCount: Number(row.series_count || 0),
        episodeUrls: row.episode_urls || [],
        rating: Number(row.rating || 4.7),
        releaseYear: Number(row.release_year || 2026),
        duration: row.duration || '2h 10m',
        ageRating: row.age_rating || 'PG-13',
        genres: row.genres || [],
        cast: row.cast || [],
        isTrending: Boolean(row.is_trending),
        isPopular: Boolean(row.is_popular),
        muxPlaybackId: row.mux_playback_id || '',
      }));
      return res.json({ success: true, movies });
    } catch (error: any) {
      console.error('Postgres movie fetch error:', error.message);
    }
  }

  const movies = Array.from(movieStore.values());
  return res.json({ success: true, movies });
});

app.post('/api/movies', verifyAdminToken, async (req, res) => {
  const payload = req.body || {};
  const movieId = `m_${Date.now()}`;
  let videoUrl = payload.videoUrl || '';
  let muxPlaybackId = payload.muxPlaybackId || '';
  const trailerUrl = payload.trailerUrl || '';

  if (!videoUrl && mux && payload.muxPlaybackId) {
    muxPlaybackId = payload.muxPlaybackId;
    videoUrl = `https://stream.mux.com/${payload.muxPlaybackId}.m3u8`;
  }

  const movie: MovieRecord = {
    id: movieId,
    title: payload.title || 'Untitled Movie',
    synopsis: payload.synopsis || '',
    backdropUrl: payload.backdropUrl || '',
    posterUrl: payload.posterUrl || '',
    videoUrl,
    trailerUrl,
    category: payload.category || 'New Releases',
    mediaType: payload.mediaType || 'Movie',
    seriesCount: Number(payload.seriesCount) || 0,
    episodeUrls: Array.isArray(payload.episodeUrls)
      ? payload.episodeUrls.filter(Boolean)
      : typeof payload.episodeUrls === 'string'
      ? String(payload.episodeUrls).split('\n').map((url: string) => url.trim()).filter(Boolean)
      : [],
    }
  movieStore.set(movie.id, movie);

  if (pgPool) {
    try {
      await pgPool.query(
        `INSERT INTO movies(id, title, synopsis, backdrop_url, poster_url, video_url, category, media_type, series_count, rating, release_year, duration, age_rating, genres, "cast", is_trending, is_popular, mux_playback_id, trailer_url)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
        [movie.id, movie.title, movie.synopsis, movie.backdropUrl, movie.posterUrl, movie.videoUrl, movie.category, movie.mediaType || null, movie.seriesCount || 0, movie.episodeUrls || null, movie.rating, movie.releaseYear, movie.duration, movie.ageRating, movie.genres, movie.cast, movie.isTrending, movie.isPopular, movie.muxPlaybackId || null, movie.trailerUrl || null]
      );
    } catch (error: any) {
      console.error('Postgres movie insert error:', error.message);
    }
  }

  return res.json({ success: true, movie });
});

app.put('/api/movies/:id', verifyAdminToken, async (req, res) => {

  const movieId = req.params.id;
  const existing = movieStore.get(movieId);
  if (!existing) return res.status(404).json({ error: 'Movie not found' });

  const payload = req.body || {};
  const updated: MovieRecord = {
    ...existing,
    title: payload.title || existing.title,
    synopsis: payload.synopsis || existing.synopsis,
    backdropUrl: payload.backdropUrl || existing.backdropUrl,
    posterUrl: payload.posterUrl || existing.posterUrl,
    videoUrl: payload.videoUrl || existing.videoUrl,
    trailerUrl: payload.trailerUrl || existing.trailerUrl || '',
    category: payload.category || existing.category,
    mediaType: payload.mediaType || existing.mediaType || 'Movie',
    seriesCount: Number(payload.seriesCount) || existing.seriesCount || 0,
    episodeUrls: Array.isArray(payload.episodeUrls)
      ? payload.episodeUrls.filter(Boolean)
      : typeof payload.episodeUrls === 'string'
      ? String(payload.episodeUrls).split('\n').map((url: string) => url.trim()).filter(Boolean)
      : existing.episodeUrls || [],
    rating: Number(payload.rating) || existing.rating,
    releaseYear: Number(payload.releaseYear) || existing.releaseYear,
    duration: payload.duration || existing.duration,
    ageRating: payload.ageRating || existing.ageRating,
    genres: Array.isArray(payload.genres) ? payload.genres : existing.genres,
    cast: Array.isArray(payload.cast) ? payload.cast : existing.cast,
    isTrending: Boolean(payload.isTrending),
    isPopular: Boolean(payload.isPopular),
  };

  movieStore.set(movieId, updated);

  if (pgPool) {
    try {
      await pgPool.query(
        `UPDATE movies SET title=$2, synopsis=$3, backdrop_url=$4, poster_url=$5, video_url=$6, category=$7, media_type=$8, series_count=$9, episode_urls=$10, rating=$11, release_year=$12, duration=$13, age_rating=$14, genres=$15, "cast"=$16, is_trending=$17, is_popular=$18, mux_playback_id=$19, trailer_url=$20 WHERE id=$1`,
        [movieId, updated.title, updated.synopsis, updated.backdropUrl, updated.posterUrl, updated.videoUrl, updated.category, updated.mediaType || null, updated.seriesCount || 0, updated.episodeUrls || null, updated.rating, updated.releaseYear, updated.duration, updated.ageRating, updated.genres, updated.cast, updated.isTrending, updated.isPopular, updated.muxPlaybackId || null, updated.trailerUrl || null]
      );
    } catch (error: any) {
      console.error('Postgres movie update error:', error.message);
    }
  }

  return res.json({ success: true, movie: updated });
});

app.delete('/api/movies/:id', verifyAdminToken, async (req, res) => {
  const movieId = req.params.id;
  const exists = movieStore.has(movieId);
  if (!exists) return res.status(404).json({ error: 'Movie not found' });
  movieStore.delete(movieId);

  if (pgPool) {
    try {
      await pgPool.query('DELETE FROM movies WHERE id = $1', [movieId]);
    } catch (error: any) {
      console.error('Postgres movie delete error:', error.message);
    }
  }

  return res.json({ success: true });
});

/**
 * FLUTTERWAVE ENDPOINT: Initialize Subscription Payment
 */
app.get('/api/subscriptions/me', async (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as Record<string, any>;
    const uid = decoded.uid || decoded.userId || decoded.sub;
    if (!uid) {
      return res.status(400).json({ error: 'Missing user identity.' });
    }

    if (pgPool) {
      const result = await pgPool.query('SELECT is_premium, tx_ref, transaction_id, subscribed_at, expires_at FROM subscriptions WHERE user_id = $1', [uid]);
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return res.json({
          success: true,
          subscription: {
            uid,
            isPremium: Boolean(row.is_premium),
            txRef: row.tx_ref,
            transactionId: row.transaction_id,
            subscribedAt: Number(row.subscribed_at || 0),
            expiresAt: Number(row.expires_at || 0),
          },
        });
      }
    }

    const stored = subscriptionStore.get(uid);
    if (stored) {
      return res.json({ success: true, subscription: stored });
    }

    return res.json({ success: true, subscription: null });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid user token.' });
  }
});

app.get('/api/admin/stats', verifyAdminToken, async (req, res) => {
  try {
    if (!pgPool) {
      return res.json({ success: true, stats: { movies: movieStore.size, users: userStore.size, subscriptions: 0 } });
    }

    const [moviesResult, usersResult, subscriptionsResult] = await Promise.all([
      pgPool.query('SELECT COUNT(*)::int AS count FROM movies'),
      pgPool.query('SELECT COUNT(*)::int AS count FROM users'),
      pgPool.query('SELECT COUNT(*)::int AS count FROM subscriptions WHERE is_premium = TRUE'),
    ]);

    return res.json({
      success: true,
      stats: {
        movies: Number(moviesResult.rows[0]?.count || 0),
        users: Number(usersResult.rows[0]?.count || 0),
        subscriptions: Number(subscriptionsResult.rows[0]?.count || 0),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error) });
  }
});

app.post('/api/payments/initialize', async (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, any>;
    req.user = decoded;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid user token.' });
  }

  const { email, uid, profileId, name } = req.body;

  if (!email || !uid) {
    return res.status(400).json({
      error: 'Auth credentials are required.',
    });
  }

  const tx_ref = `sub_${uid}_${profileId || 'default'}_${Date.now()}`;
  const flutterwaveSecret = process.env.FLUTTERWAVE_SECRET_KEY;

  // If no Flutterwave key is configured, use the payment simulator
  if (!flutterwaveSecret) {
    return res.json({
      success: true,
      sandboxMode: true,
      checkoutUrl: `/payment-simulator?tx_ref=${tx_ref}&email=${encodeURIComponent(email)}&uid=${uid}&name=${encodeURIComponent(name || 'Subscriber')}`,
    });
  }

  try {
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${flutterwaveSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref,
        amount: '9.99',
        currency: 'USD',
        redirect_url: `${process.env.BASE_URL || 'http://localhost:3000'}/api/payments/callback`,
        payment_options: 'card,mobilemoney,banktransfer',

        customer: {
          email,
          name: name || 'Subscriber',
        },

        customizations: {
          title: 'Netflix AI Studio',
          description: 'Premium Movie Subscription',
        },

        meta: {
          uid,
          profileId: profileId || 'default',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Flutterwave API returned status ${response.status}: ${errText}`
      );
    }

    const resData = await response.json();

    if (resData?.data?.link) {
      return res.json({
        success: true,
        checkoutUrl: resData.data.link,
      });
    }

    throw new Error('Invalid Flutterwave response format');

  } catch (err: any) {
    console.error('Flutterwave Initialization Error:', err.message);

    // Fallback to local payment simulator
    return res.json({
      success: true,
      sandboxMode: true,
      error: 'Flutterwave key invalid or inactive. Running sandbox payment instead.',
      checkoutUrl: `/payment-simulator?tx_ref=${tx_ref}&email=${encodeURIComponent(email)}&uid=${uid}&name=${encodeURIComponent(name || 'Subscriber')}`,
    });
  }
});
/**
 * FLUTTERWAVE ENDPOINT: Callback Redirect
 */
app.get('/api/payments/callback', async (req, res) => {
  const { status, tx_ref, transaction_id } = req.query;

  if (status === 'successful' || status === 'completed') {
    // Parse UID from tx_ref (sub_uid_profileId_timestamp)
    const parts = (tx_ref as string || '').split('_');
    if (parts.length >= 3) {
      const uid = parts[1];
      const txId = String(transaction_id || 'simulated');
      const subscriptionRecord = {
        uid,
        isPremium: true,
        txRef: String(tx_ref || ''),
        transactionId: txId,
        subscribedAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };

      try {
        if (pgPool) {
          await pgPool.query(`
            INSERT INTO subscriptions(user_id, is_premium, tx_ref, transaction_id, subscribed_at, expires_at)
            VALUES($1,$2,$3,$4,$5,$6)
            ON CONFLICT (user_id) DO UPDATE SET
              is_premium = EXCLUDED.is_premium,
              tx_ref = EXCLUDED.tx_ref,
              transaction_id = EXCLUDED.transaction_id,
              subscribed_at = EXCLUDED.subscribed_at,
              expires_at = EXCLUDED.expires_at
          `, [uid, true, subscriptionRecord.txRef, subscriptionRecord.transactionId, subscriptionRecord.subscribedAt, subscriptionRecord.expiresAt]);
        } else {
          subscriptionStore.set(uid, subscriptionRecord);
        }

        const notifications = notificationStore.get(uid) || [];
        notifications.push({
          id: `notif_${Date.now()}`,
          title: 'Premium Activated! 🍿',
          message: 'Thank you for your subscription! Unlimited Ultra-HD streaming is now fully active.',
          userId: uid,
          timestamp: Date.now(),
          isRead: false,
          type: 'payment',
        });
        notificationStore.set(uid, notifications);
      } catch (err) {
        console.error('Error saving subscription status:', err);
      }
    }
    return res.redirect('/?payment=success');
  }

  return res.redirect('/?payment=failed');
});

/**
 * MANUAL PAYMENT SIMULATOR: Supports full offline/test environments
 */
app.post('/api/payments/simulate-success', async (req, res) => {
  const { uid, tx_ref, email } = req.body;
  if (!uid) return res.status(400).json({ error: 'UID is required' });

  try {
    const subscriptionRecord = {
      uid,
      isPremium: true,
      txRef: String(tx_ref || `sim_${Date.now()}`),
      transactionId: `sim_${Math.floor(100000 + Math.random() * 900000)}`,
      subscribedAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };

    if (pgPool) {
      await pgPool.query(`
        INSERT INTO subscriptions(user_id, is_premium, tx_ref, transaction_id, subscribed_at, expires_at)
        VALUES($1,$2,$3,$4,$5,$6)
        ON CONFLICT (user_id) DO UPDATE SET
          is_premium = EXCLUDED.is_premium,
          tx_ref = EXCLUDED.tx_ref,
          transaction_id = EXCLUDED.transaction_id,
          subscribed_at = EXCLUDED.subscribed_at,
          expires_at = EXCLUDED.expires_at
      `, [uid, true, subscriptionRecord.txRef, subscriptionRecord.transactionId, subscriptionRecord.subscribedAt, subscriptionRecord.expiresAt]);
    } else {
      subscriptionStore.set(uid, subscriptionRecord);
    }

    const notifications = notificationStore.get(uid) || [];
    notifications.push({
      id: `notif_${Date.now()}`,
      title: 'Premium Subscription Active! 🍿',
      message: 'Checkout completed successfully! You can now watch full movies in high-definition.',
      userId: uid,
      timestamp: Date.now(),
      isRead: false,
      type: 'payment',
    });
    notificationStore.set(uid, notifications);

    return res.json({ success: true, message: 'Subscription processed successfully.', subscription: subscriptionRecord });
  } catch (err: any) {
    console.error('Error simulating payment success:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PUSH NOTIFICATIONS: Trigger system releases or billing notifications
 */
app.post('/api/notifications/simulate-release', async (req, res) => {
  const { title, message, type, userId } = req.body;
  try {
    const targetId = userId || 'all';
    const notifs = notificationStore.get(targetId) || [];
    notifs.push({
      id: `notif_${Date.now()}`,
      title: title || 'New Release Incoming!',
      message: message || 'Discover the latest additions to Netflix AI Studio today.',
      userId: targetId,
      timestamp: Date.now(),
      isRead: false,
      type: type || 'release',
    });
    notificationStore.set(targetId, notifs);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * ADMIN: register and login endpoints (simple JWT + bcrypt)
 */
app.post('/api/admin/register', async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const normalized = String(email).toLowerCase().trim();
  const passwordHash = await bcrypt.hash(String(password), 10);

  if (pgPool) {
    try {
      await pgPool.query('INSERT INTO admins(email,password_hash,full_name) VALUES($1,$2,$3) ON CONFLICT (email) DO NOTHING', [normalized, passwordHash, name || '']);
    } catch (err) {
      console.error('Postgres admin insert error:', getErrorMessage(err));
      return res.status(500).json({ error: 'Unable to create admin' });
    }
  } else {
    adminStore.set(normalized, { email: normalized, passwordHash, name });
  }

  return res.json({ success: true, message: 'Admin registered' });
});

app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const normalized = String(email).toLowerCase().trim();

  let passwordHash: string | null = null;
  if (pgPool) {
    try {
      const r = await pgPool.query('SELECT password_hash FROM admins WHERE email = $1', [normalized]);
      if (r.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
      passwordHash = r.rows[0].password_hash;
    } catch (err) {
      console.error('Postgres admin lookup error:', getErrorMessage(err));
      return res.status(500).json({ error: 'Login failed' });
    }
  } else {
    const rec = adminStore.get(normalized);
    if (!rec) return res.status(401).json({ error: 'Invalid credentials' });
    passwordHash = rec.passwordHash;
  }

  const match = await bcrypt.compare(String(password), passwordHash || '');
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ email: normalized, role: 'admin' }, ADMIN_JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
  return res.json({ success: true, token });
});

// Vite server or static production deployment middleware
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(__cwd, 'dist');
  app.use(express.static(distPath));
  // Serve payment-simulator and application assets safely
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
