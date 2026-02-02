import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@db": path.resolve(import.meta.dirname, "db"),
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      // Enable tree-shaking but be careful with side effects
      treeshake: {
        moduleSideEffects: 'no-external', // Only remove side effects from external modules
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
      output: {
        manualChunks: (id) => {
          // Separate node_modules into chunks
          if (id.includes('node_modules')) {
            // CRITICAL: ALL React-related packages MUST be in the same chunk
            // This includes React core AND any package that uses React
            if (id.includes('react') || 
                id.includes('@radix-ui') ||
                id.includes('framer-motion') ||
                id.includes('@tanstack/react-query') ||
                id.includes('lucide-react') ||
                id.includes('wouter') ||
                id.includes('recharts') ||
                id.includes('embla-carousel') ||
                id.includes('cmdk') ||
                id.includes('vaul') ||
                id.includes('input-otp')) {
              return 'react-vendor';
            }
            // Firebase - separate chunk (no React dependency)
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
              return 'form-vendor';
            }
            // Default vendor chunk for other node_modules
            return 'vendor';
          }
        },
        // Optimize chunk size
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Improve build performance
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    // Optimize chunk sizes - increase warning limit but still optimize
    chunkSizeWarningLimit: 600,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Report compressed sizes
    reportCompressedSize: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'wouter',
    ],
    exclude: ['react-icons', 'lucide-react'], // Exclude lucide-react from pre-bundling to ensure tree-shaking
    // Force esbuild optimization for better performance
    esbuildOptions: {
      target: 'esnext',
    },
  },
  // Server configuration for faster HMR and dev server
  server: {
    hmr: {
      overlay: false, // Disable error overlay for faster reloads
    },
    // Optimize file watching
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/dist/**'],
    },
  },
});
