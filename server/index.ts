import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
// Import from static.ts (no vite dependencies) for production
import { serveStatic, log } from "./static";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@db";
import { configurePassport } from "./auth";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import cors from "cors";
// import { performanceMonitor } from "./performance-monitor";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// In production, canonicalize www → non-www so cookies stay on a single domain
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.hostname === 'www.izuranrecords.com') {
      return res.redirect(301, `https://izuranrecords.com${req.originalUrl}`);
    }
    next();
  });
}

// Configure CORS - allow localhost and production domain
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://izuranrecords.com',
    'https://www.izuranrecords.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Permissions-Policy', 'encrypted-media=*, microphone=*, camera=*, geolocation=*');

  // Allow Firebase popup auth to communicate back to the opener window.
  // Without this, mobile Safari cannot close the popup or read window.closed,
  // causing the popup tab to linger and potentially triggering a page reload.
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  
  // Content Security Policy — permissive enough for all features:
  //   unsafe-eval   : Firebase SDK, Vite HMR, framer-motion, and dynamic libraries use eval
  //   unsafe-inline : inline scripts/styles used by Vite dev, React, and many UI libs
  //   firebaseapp   : Firebase auth iframe + redirect handler
  //   googleapis    : Google Fonts, Firebase, Google account chooser
  //   soundcloud    : SoundCloud embeds and player
  //   data: / blob: : local object URLs (audio, images)
  const isDev = process.env.NODE_ENV !== 'production';
  const csp = [
    "default-src 'self'",
    // Scripts: allow eval for Firebase/Vite, inline for React/UI, and all needed origins
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.googleapis.com https://apis.google.com https://w.soundcloud.com https://soundcloud.com https://*.soundcloud.com${isDev ? " http://localhost:* ws://localhost:*" : ""}`,
    // Styles: allow inline (used by Framer Motion, Radix, etc.) and Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.soundcloud.com",
    // Fonts: self + Google Fonts CDN + data URIs
    "font-src 'self' data: https://fonts.gstatic.com",
    // Frames: Firebase auth handler + SoundCloud player
    "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://w.soundcloud.com https://soundcloud.com https://bandcamp.com https://*.bandcamp.com",
    // Images: anything HTTPS + data URIs (Google profile pics, SoundCloud, etc.)
    "img-src 'self' data: blob: https:",
    // Media: audio/video from SoundCloud and self
    "media-src 'self' blob: https:",
    // Connections: Firebase, Google APIs, SoundCloud, Stripe, local dev
    `connect-src 'self' https://*.firebaseio.com wss://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://*.soundcloud.com https://api.stripe.com${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
    // Workers: blob URIs for service workers
    "worker-src 'self' blob:",
    // Object/manifest
    "object-src 'none'",
    "manifest-src 'self'",
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);
  
  next();
});

// Parse cookies for JWT token extraction
app.use(cookieParser());

// Handle CORS preflight requests more permissively
app.options('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://izuranrecords.com', 'https://www.izuranrecords.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}));

// Setup session table synchronously before session middleware
let sessionTableReady = false;
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
    `);
    sessionTableReady = true;
    console.log('Session table verified');
  } catch (err) {
    console.error('Error setting up session table:', err);
    // Still allow server to start, but log the error
    sessionTableReady = true;
  }
})();

// Configure express-session with PostgreSQL store
const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    pool,
    tableName: 'session',
    // Optimize session store configuration
    pruneSessionInterval: 300, // 5 minutes instead of default 60 seconds
    ttl: 86400, // 24 hours in seconds
    schemaName: 'public'
  }),
  secret: process.env.SESSION_SECRET || 'izuran-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  },
  // Add session performance optimizations
  name: 'izuran.sid',
  rolling: true,
  unset: 'destroy'
}));

// Initialize and configure passport
app.use(passport.initialize());
app.use(passport.session());
configurePassport(passport);

// Add performance monitoring middleware
// app.use(performanceMonitor.middleware());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
    // In production, log page and asset requests so we can see if HTML/JS are served
    if (process.env.NODE_ENV === "production" && req.method === "GET") {
      if (path === "/" || path.startsWith("/assets/") || path === "/bfcache-patch.js") {
        log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
      }
    }
  });

  // COEP (Cross-Origin-Embedder-Policy) is intentionally NOT set.
  // Setting it (even to "credentialless") blocks the Firebase auth iframe
  // (izuran-4731d.firebaseapp.com/__/auth/iframe) that is loaded on every page
  // via AuthProvider, breaking Google sign-in session persistence.
  next();
});

// Ensure upload directories exist
const uploadDirs = [
  'public/uploads/event_images',
  'public/uploads/product_images',
  'public/uploads/article_images',
  'public/uploads/podcast_images'
];

uploadDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Serve static files from the public directory
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Serve static assets from public directory
app.use('/favicon.ico', (req, res, next) => {
  const faviconPath = path.join(process.cwd(), 'public/favicon.ico');
  if (fs.existsSync(faviconPath)) {
    res.sendFile(faviconPath);
  } else {
    res.status(404).end();
  }
});
app.use('/manifest.json', (req, res, next) => {
  const manifestPath = path.join(process.cwd(), 'public/manifest.json');
  if (fs.existsSync(manifestPath)) {
    res.sendFile(manifestPath);
  } else {
    next();
  }
});
app.use('/images', express.static(path.join(process.cwd(), 'public/images')));
// Serve fonts from client/public/fonts (where the font file actually is)
app.use('/fonts', express.static(path.join(process.cwd(), 'client/public/fonts')));
// Also check public/fonts if it exists
app.use('/fonts', express.static(path.join(process.cwd(), 'public/fonts')));
// PRODUCTION: Serve built assets (/assets/*, index.html, bfcache-patch.js) FIRST so they load like in dev
// Use __dirname when bundled (dist/index.js → __dirname is dist/) so it works from any cwd
if (process.env.NODE_ENV === "production") {
  const distPublicByDir = path.resolve(__dirname, "public");
  const distPublicByCwd = path.resolve(process.cwd(), "dist", "public");
  const distPublic = fs.existsSync(distPublicByDir) ? distPublicByDir : distPublicByCwd;
  if (fs.existsSync(distPublic)) {
    log(`[production] Serving built assets from: ${distPublic}`);
    app.use(express.static(distPublic, { index: false }));
  } else {
    log(`[production] WARNING: dist/public not found at ${distPublicByDir} or ${distPublicByCwd}`);
  }
}
// Serve client/public (logos, bfcache-patch.js in dev; prod uses dist/public above first)
app.use(express.static(path.join(process.cwd(), "client/public")));

(async () => {
  // Register all API routes (auth, artists, events, products, payments, etc.)
  // Same server serves both: API at /api/* and built frontend from dist/public
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Don't send response if headers already sent
    if (res.headersSent) {
      return _next(err);
    }
    
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const isDevelopment = process.env.NODE_ENV !== "production";
  
  if (isDevelopment) {
    // Dynamic import with computed path to prevent esbuild from bundling vite.ts
    // This ensures vite and its dependencies are never included in the production bundle
    const vitePath = [".", "vite"].join("/");
    const { setupVite } = await import(/* @vite-ignore */ vitePath);
    await setupVite(app, server);
  } else {
    // In production, serve static files from dist/public
    // This MUST be called after registerRoutes to ensure API routes are registered first
    serveStatic(app);
  }

  // Catch-all to serve client-side app for any unhandled routes
  // Only needed in development - in production, serveStatic handles this
  if (isDevelopment) {
    app.use('*', (req, res, next) => {
      // Skip static files and API routes
      if (req.path.startsWith('/api/') || 
          req.path.startsWith('/uploads/') ||
          req.path.startsWith('/images/') ||
          req.path.startsWith('/fonts/') ||
          req.path === '/favicon.ico' ||
          req.path === '/manifest.json' ||
          req.path.match(/\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|json|css|js)$/)) {
        return next();
      }
      // Don't serve HTML for static assets
      if (req.path.includes('.') && !req.path.includes('html')) {
        return res.status(404).send('Not found');
      }
      const indexPath = path.join(process.cwd(), 'client', 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(path.resolve(indexPath));
      } else {
        res.status(404).send('index.html not found');
      }
    });
  }

  // ALWAYS serve the app on port 3000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === "production";
  server.listen(port, () => {
    log(`✓ Server is running on http://localhost:${port}`);
    log(`✓ Environment: ${isProduction ? "production" : "development"}`);
    if (isProduction) {
      log(`✓ API routes at /api/* (e.g. /api/health, /api/artists)`);
      log(`✓ Static frontend from: ${path.resolve(process.cwd(), "dist", "public")}`);
    }
  });
  
  server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      log(`✗ Port ${port} is already in use. Please stop the other process or use a different port.`);
    } else {
      log(`✗ Server error: ${error.message}`);
    }
    process.exit(1);
  });
})().catch((error) => {
  console.error('✗ Failed to start server:', error);
  if (error instanceof Error) {
    console.error('Error stack:', error.stack);
  }
  process.exit(1);
});
