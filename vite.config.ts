/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Set SINGLEFILE=1 to inline all JS/CSS into one standalone index.html
// (double-click to run, no server). Otherwise a normal multi-file build for hosting.
const singlefile = process.env.SINGLEFILE === '1'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), ...(singlefile ? [viteSingleFile()] : [])],
  // The standalone/offline build is local-only by design: blank out the
  // Supabase keys so it never requires login and works fully offline.
  define: singlefile
    ? {
        'import.meta.env.VITE_SUPABASE_URL': '""',
        'import.meta.env.VITE_SUPABASE_ANON_KEY': '""',
      }
    : {},
  test: {
    environment: 'jsdom',
    // Force local-only mode in tests so .env.local's Supabase keys don't gate
    // the UI behind the auth screen.
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
    },
  },
})
