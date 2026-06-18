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
})
