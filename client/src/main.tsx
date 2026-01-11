import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Router } from "wouter";

// Note: Unload handler patching is now handled in index.html before React loads
// This ensures it runs before any third-party widgets

createRoot(document.getElementById("root")!).render(
  <Router>
    <App />
  </Router>
);
