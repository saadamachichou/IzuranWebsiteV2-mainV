import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configure CORS with specific options for local development
app.use(cors({
  origin: 'http://localhost:3000', // or your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}));

// Increase header size limit and set headers for SoundCloud embeds
app.use((req, res, next) => {
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Add Permissions-Policy header to allow encrypted-media for SoundCloud embeds
  // This must be set for all responses, not just HTML
  res.setHeader('Permissions-Policy', 'encrypted-media=*, microphone=*, camera=*, geolocation=*');
  
  // Temporarily disable CSP for development to allow SoundCloud embeds
  // res.setHeader(
  //   'Content-Security-Policy',
  //   "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://w.soundcloud.com https://soundcloud.com https://*.soundcloud.com; style-src 'self' 'unsafe-inline' https://w.soundcloud.com https://*.soundcloud.com; frame-src 'self' https://w.soundcloud.com https://soundcloud.com https://*.soundcloud.com; img-src 'self' data: https: https://*.soundcloud.com; media-src 'self' https: https://*.soundcloud.com; connect-src 'self' https: https://*.soundcloud.com; font-src 'self' data: https:;"
  // );
  
  next();
});

// Parse cookies for JWT token extraction
app.use(cookieParser());

// Handle CORS preflight requests more permissively
app.options('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
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
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: false, // true in production with HTTPS
    httpOnly: true,
    sameSite: 'lax' // 'none' if cross-site in production
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
  });

  // Set Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers, except for Firebase Auth, API auth routes, static assets, and the root route
  if (
    req.path.startsWith('/__/auth/') ||
    req.path.startsWith('/api/auth/') ||
    req.path.startsWith('/api/admin/') ||
    req.path.startsWith('/api/') ||
    req.path.startsWith('/assets/') ||
    req.path.startsWith('/uploads/') ||
    req.path.startsWith('/images/') ||
    req.path.startsWith('/fonts/') ||
    req.path === '/'
  ) {
    return next();
  }
  
  // Set security headers but allow SoundCloud media functionality
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless'); // Less restrictive than 'require-corp'

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
// Serve client/public assets (like logos) - must come after specific routes
app.use(express.static(path.join(process.cwd(), 'client/public')));

(async () => {
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
      log(`✓ Serving static files from: ${path.resolve(process.cwd(), "dist", "public")}`);
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
