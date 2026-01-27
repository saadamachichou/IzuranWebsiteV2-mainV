import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Only use Vite middleware for non-API routes and non-static files
  app.use((req, res, next) => {
    const path = req.path;
    // Skip API routes and static files
    if (path.startsWith('/api/') || 
        path.startsWith('/uploads/') ||
        path.startsWith('/images/') ||
        path.startsWith('/fonts/') ||
        path === '/favicon.ico' ||
        path === '/manifest.json' ||
        path.match(/\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|json)$/)) {
      return next();
    }
    vite.middlewares(req, res, next);
  });
  
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip API routes and static files - let them be handled by Express routes
    if (url.startsWith('/api/') || 
        url.startsWith('/uploads/') ||
        url.startsWith('/images/') ||
        url.startsWith('/fonts/') ||
        url === '/favicon.ico' ||
        url === '/manifest.json' ||
        url.match(/\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|json)$/)) {
      return next();
    }

    try {
      const clientTemplate = path.join(
        process.cwd(),
        "client",
        "index.html",
      );

      // Check if index.html exists
      if (!fs.existsSync(clientTemplate)) {
        return res.status(404).send('index.html not found');
      }

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      console.error('Error serving index.html:', e);
      vite.ssrFixStacktrace(e as Error);
      // Don't call next() here - just send a 500 response
      res.status(500).send('Internal Server Error');
    }
  });
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
  // Use absolute path and ensure it's registered correctly
  app.use(express.static(distPath, {
    // Don't serve index.html automatically for directory requests
    index: false,
    // Set proper cache headers
    maxAge: '1y',
    etag: true,
    lastModified: true,
    // Ensure dotfiles are served (like .map files)
    dotfiles: 'ignore'
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
      res.setHeader('Content-Type', 'text/html');
      res.sendFile(indexPath);
    } else {
      res.status(404).send('index.html not found');
    }
  });
}
