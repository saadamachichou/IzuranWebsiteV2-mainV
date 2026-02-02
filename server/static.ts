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
 * Production static serving - mirrors setupVite() order and behavior.
 * Uses __dirname when bundled (dist/index.js) so path works from any cwd.
 */
export function serveStatic(app: Express) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const distByDir = path.resolve(__dirname, "public");
  const distByCwd = path.resolve(process.cwd(), "dist", "public");
  const distPath = fs.existsSync(distByDir) ? distByDir : distByCwd;

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find dist/public. Tried: ${distByDir} and ${distByCwd}. Run "npm run build" then "npm start".`,
    );
  }

  const indexPath = path.resolve(distPath, "index.html");
  if (!fs.existsSync(indexPath)) {
    throw new Error(`index.html not found at ${indexPath}`);
  }

  log(`Serving static files from: ${distPath}`);
  log(`index.html at: ${indexPath}`);

  // 1. Serve static files from dist/public
  app.use(express.static(distPath, {
    index: false,
    maxAge: "1y",
    etag: true,
    lastModified: true,
    dotfiles: "ignore",
  }));

  // 2. Catch-all: serve index.html for SPA routes (same skip logic as dev setupVite)
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

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.sendFile(indexPath, (err) => {
      if (err) {
        log(`Error sending index.html: ${err.message}`, "static");
        if (!res.headersSent) res.status(500).send("Error loading page");
      }
    });
  });
}
