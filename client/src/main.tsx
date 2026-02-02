// CRITICAL: Import React first to ensure it loads before any vendor chunks
import "react";
import "react-dom";
import { Component } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Router } from "wouter";

// Note: Unload handler patching is now handled in index.html before React loads
// This ensures it runs before any third-party widgets

function showError(message: string, err?: unknown) {
  const root = document.getElementById("root");
  if (root && typeof (window as any).__showAppError === "function") {
    (window as any).__showAppError(message, err);
  } else if (root) {
    const detail = err instanceof Error ? err.stack : String(err ?? "");
    root.innerHTML = `<div style="padding:24px;font-family:system-ui;background:#0f0f0f;color:#e5e5e5;min-height:100vh"><h2 style="color:#f97316">Error</h2><pre style="white-space:pre-wrap">${message}</pre><pre style="margin-top:12px;font-size:12px;opacity:0.8">${detail}</pre></div>`;
  }
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error) {
    showError(error.message, error);
  }
  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: "system-ui", background: "#0f0f0f", color: "#e5e5e5", minHeight: "100vh" }}>
          <h2 style={{ color: "#f97316" }}>Something went wrong</h2>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{this.state.error.message}</pre>
          <pre style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

try {
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("Root element #root not found");
  createRoot(rootEl).render(
    <ErrorBoundary>
      <Router>
        <App />
      </Router>
    </ErrorBoundary>
  );
  // Confirm frontend is running: one API call so logs show /api/* when app loads
  fetch("/api/health").catch(() => {});
} catch (err) {
  showError(err instanceof Error ? err.message : String(err), err);
  throw err;
}
