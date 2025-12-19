import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    cssCodeSplit: true,
    cssMinify: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React - loaded immediately
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-core';
          }
          // Router - needed for navigation
          if (id.includes('react-router')) {
            return 'router';
          }
          // Supabase - defer until needed
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          // Charts - heavy, defer loading
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts';
          }
          // UI components - load on demand
          if (id.includes('@radix-ui')) {
            return 'ui-radix';
          }
          // Form libraries
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
            return 'forms';
          }
          // Date utilities
          if (id.includes('date-fns')) {
            return 'date-utils';
          }
          // DnD
          if (id.includes('@dnd-kit')) {
            return 'dnd';
          }
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
}));
