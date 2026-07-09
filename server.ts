import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import pkg from 'pg';
import Mux from '@mux/mux-node';

// Load environment variables
dotenv.config();

// Resolve paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __cwd = process.cwd();

// Load Firebase applet configuration
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = getFirestore();
const { Pool } = pkg;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const pgPool = process.env.DATABASE_URL || process.env.POSTGRES_URL ? new Pool({ connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL }) : null;
const mux = process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET ? new Mux({ tokenId: process.env.MUX_TOKEN_ID, tokenSecret: process.env.MUX_TOKEN_SECRET }) : null;

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev_admin_jwt_secret';

// In-memory stores as fallback when Postgres is not configured
const userStore = new Map<string, any>();
const adminStore = new Map<string, { email: string; passwordHash: string; name?: string }>();

const CLERK_PEM_DEFAULT = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsuX6xQsjqcIS4SzunDSr
MBFiIIt1zKWRvsVURl0nud7yQNZOt56hi1fSMOmLh/WfMYvwQ93vKezl+Y9QahI/
AYTDg4dA5a5vBn3ssjFT9SxKEGLx7o57ApUpSDc4HqjfpRlPg951M/cqhoo6/R69
FkESTg9MsmSp2AvKBy6KqdhEs3I2ENWYa9yqd9/wc2mhmEUpG84RRHI0TtXmeMIb
JLt8ckybJ046vGG6BF7bTO/woes5ijoiY6v+JmaZflrFLrXRXEthLAzidXTCZAYt
rAEUF9tpZ3WnqCkF7BelcADeBTkUmhFUPIreNzGB1ODnJb/1JAO8ud4YVpNunNuv
sQIDAQAB
-----END PUBLIC KEY-----`;

const verifyAdminToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin role required.' });
    }
    req.admin = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
  }
};

const verifyClerkToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  const publicKeyRaw = process.env.CLERK_PEM_PUBLIC_KEY || CLERK_PEM_DEFAULT;
  const publicKey = publicKeyRaw.replace(/\\n/g, '\n');

  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256']
    });
    req.user = decoded;
    next();
  } catch (err: any) {
    console.error('JWT Verification error:', err.message);
    return res.status(401).json({ error: 'Unauthorized: Session verification failed.', details: err.message });
  }
};

const app = express();
app.use(express.json());

const PORT = 3000;

/**
 * ADMIN AUTH ENDPOINTS
 */
app.post('/api/admin/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  if (adminStore.has(normalizedEmail)) {
    return res.status(400).json({ error: 'This admin account already exists.' });
  }

  const adminId = `admin_${Date.now()}`;
  adminStore.set(normalizedEmail, {
    adminId,
    email: normalizedEmail,
    password: password,
    createdAt: Date.now(),
  });

  const token = jwt.sign(
    { adminId, email: normalizedEmail, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return res.json({
    success: true,
    message: 'Admin account created successfully.',
    adminToken: token,
  });
});

app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const admin = adminStore.get(normalizedEmail);
  if (!admin || admin.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { adminId: admin.adminId, email: normalizedEmail, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return res.json({
    success: true,
    message: 'Admin logged in successfully.',
    adminToken: token,
  });
});
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
}

const movieStore = new Map<string, MovieRecord>();

async function ensureDatabaseSchema() {
  if (!pgPool) return;
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
}

// Initialize database before starting server
await ensureDatabaseSchema();

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
        from: 'Netflix Studio <onboarding@resend.dev>',
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
  const { email, code } = req.body || {};
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
        const insert = await pgPool.query('INSERT INTO users(email, full_name ) VALUES($1,$2) RETURNING id, email, full_name', [normalizedEmail, '']);
        user = { uid: `u_${insert.rows[0].id}`, email: insert.rows[0].email, displayName: insert.rows[0].full_name || insert.rows[0].email.split('@')[0] };
      } else {
        const r = result.rows[0];
        user = { uid: `u_${r.id}`, email: r.email, displayName: r.full_name || r.email.split('@')[0] };
      }
    } catch (err) {
      console.error('Postgres user lookup error:', err.message);
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
    rating: Number(payload.rating) || 4.7,
    releaseYear: Number(payload.releaseYear) || 2026,
    duration: payload.duration || '2h 10m',
    ageRating: payload.ageRating || 'PG-13',
    genres: Array.isArray(payload.genres) ? payload.genres : [],
    cast: Array.isArray(payload.cast) ? payload.cast : [],
    isTrending: Boolean(payload.isTrending),
    isPopular: Boolean(payload.isPopular),
    muxPlaybackId,
  };

  movieStore.set(movie.id, movie);

  if (pgPool) {
    try {
      await pgPool.query(
        `INSERT INTO movies(id, title, synopsis, backdrop_url, poster_url, video_url, category, rating, release_year, duration, age_rating, genres, "cast", is_trending, is_popular, mux_playback_id, trailer_url)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [movie.id, movie.title, movie.synopsis, movie.backdropUrl, movie.posterUrl, movie.videoUrl, movie.category, movie.rating, movie.releaseYear, movie.duration, movie.ageRating, movie.genres, movie.cast, movie.isTrending, movie.isPopular, movie.muxPlaybackId || null, movie.trailerUrl || null]
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
        `UPDATE movies SET title=$2, synopsis=$3, backdrop_url=$4, poster_url=$5, video_url=$6, category=$7, rating=$8, release_year=$9, duration=$10, age_rating=$11, genres=$12, "cast"=$13, is_trending=$14, is_popular=$15, mux_playback_id=$16, trailer_url=$17 WHERE id=$1`,
        [movieId, updated.title, updated.synopsis, updated.backdropUrl, updated.posterUrl, updated.videoUrl, updated.category, updated.rating, updated.releaseYear, updated.duration, updated.ageRating, updated.genres, updated.cast, updated.isTrending, updated.isPopular, updated.muxPlaybackId || null, updated.trailerUrl || null]
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
app.post('/api/payments/initialize', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
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
      try {
        // Record payment in Firestore
        await db.collection('subscriptions').doc(uid).set({
          isPremium: true,
          txRef: tx_ref,
          transactionId: transaction_id || 'simulated',
          subscribedAt: Date.now(),
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        // Trigger simulation notification for receipt
        await db.collection('notifications').add({
          title: 'Premium Activated! 🍿',
          message: 'Thank you for your subscription! Unlimited Ultra-HD streaming is now fully active.',
          userId: uid,
          timestamp: Date.now(),
          isRead: false,
          type: 'payment',
        });
      } catch (err) {
        console.error('Error saving subscription status in Firebase:', err);
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
      `, [uid, true, tx_ref || `sim_${Date.now()}`, `sim_${Math.floor(100000 + Math.random() * 900000)}`, Date.now(), Date.now() + 30 * 24 * 60 * 60 * 1000]);
    }

    // Record premium membership
    await db.collection('subscriptions').doc(uid).set({
      isPremium: true,
      txRef: tx_ref || `sim_${Date.now()}`,
      transactionId: `sim_${Math.floor(100000 + Math.random() * 900000)}`,
      subscribedAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    // Notify user of active premium status
    await db.collection('notifications').add({
      title: 'Premium Subscription Active! 🍿',
      message: 'Checkout completed successfully! You can now watch full movies in high-definition.',
      userId: uid,
      timestamp: Date.now(),
      isRead: false,
      type: 'payment',
    });

    return res.json({ success: true, message: 'Subscription processed successfully.' });
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
    await db.collection('notifications').add({
      title: title || 'New Release Incoming!',
      message: message || 'Discover the latest additions to Netflix AI Studio today.',
      userId: userId || 'all',
      timestamp: Date.now(),
      isRead: false,
      type: type || 'release',
    });
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
      console.error('Postgres admin insert error:', err.message);
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
      console.error('Postgres admin lookup error:', err.message);
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
