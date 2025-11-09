import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

const BASE_URL = process.env.BASE_URL || ''

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    root: "frontend",
    base: BASE_URL,
    build: {
        outDir: "../dist",
    }
})
