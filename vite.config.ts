import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { localRunner } from './scripts/local-runner.ts'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    // Runs C++/Bash challenges with the local toolchain (dev & preview only).
    localRunner(),
  ],
})
