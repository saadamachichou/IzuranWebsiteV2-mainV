import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Production static serving - mirrors setupVite() order and behavior exactly:
 * 1. Static files from dist/public (like Vite serving built output)
 * 2. app.use("*") catch-all that serves index.html for SPA routes (same as dev)
 */
export function serveStatic(app: Express) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const distPath = fs.existsSync(path.join(__dirname, "public"))
    ? path.join(__dirname, "public")
    : path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  const indexPath = path.resolve(distPath, "index.html");
  if (!fs.existsSync(indexPath)) {
    throw new Error(`index.html not found at ${indexPath}`);
  }

  log(`Serving static files from: ${distPath}`);

  // 1. Same as dev: serve static files (Vite does this via middleware; we use express.static)
  app.use(express.static(distPath, {
    index: false,
    maxAge: "1y",
    etag: true,
    lastModified: true,
    dotfiles: "ignore",
  }));

  // 2. Same as dev: app.use("*", ...) catch-all - skip conditions match setupVite exactly
  app.use("*", (req, res, next) => {
    const url = req.originalUrl;

    if (
      url.startsWith("/api/") ||
      url.startsWith("/uploads/") ||
      url.startsWith("/images/") ||
      url.startsWith("/fonts/") ||
      url === "/favicon.ico" ||
      url === "/manifest.json" ||
      url.match(/\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|json|css|js|map)$/)
    ) {
      return next();
    }

    // Serve built index.html (dev uses vite.transformIndexHtml on client/index.html)
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.sendFile(indexPath);
  });
}
