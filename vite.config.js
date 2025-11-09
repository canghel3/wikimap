import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

const FE_BASE_URL = process.env.FE_BASE_URL || ''

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    root: "frontend",
    base: FE_BASE_URL,
    build: {
        outDir: "../dist",
    }
})
