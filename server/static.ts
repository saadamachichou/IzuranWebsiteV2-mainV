import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  
  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  // When bundled, import.meta.dirname points to dist/, so we need to go up one level
  // and then into dist/public. But we should use process.cwd() for reliability.
  const distPath = path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  log(`Serving static files from: ${distPath}`);

  // Serve static files from dist/public - MUST be registered before catch-all
  // This will serve all assets (JS, CSS, images, etc.)
  app.use(express.static(distPath, {
    // Don't serve index.html automatically for directory requests
    index: false,
    // Cache hashed assets for 1 year, but allow revalidation
    maxAge: '1y',
    immutable: true,
    etag: true,
    lastModified: true,
    // Ensure dotfiles are served (like .map files)
    dotfiles: 'ignore',
    // Set proper Content-Type for JavaScript modules
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (filePath.endsWith('.html')) {
        // HTML should not be cached
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));
  
  // Log that static middleware is registered
  log(`Static file middleware registered for: ${distPath}`);

  // Fall through to index.html for non-API, non-static file routes (SPA routing)
  // This MUST be registered AFTER express.static and AFTER all API routes
  app.get("*", (req, res, next) => {
    // Skip API routes - let them 404 if not found
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // Skip static file requests - these should have been handled by express.static above
    // If we reach here for a static file, it means the file doesn't exist, so 404
    if (req.path.match(/\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|json|css|js|map)$/)) {
      return res.status(404).send('File not found');
    }
    
    // Skip uploads, images, fonts (handled by other middleware)
    if (req.path.startsWith('/uploads/') || 
        req.path.startsWith('/images/') || 
        req.path.startsWith('/fonts/')) {
      return next();
    }
    
    // Serve index.html for all other routes (SPA fallback)
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      // Ensure HTML is never cached to allow updates
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(indexPath);
    } else {
      res.status(404).send('index.html not found');
    }
  });
}
