import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    root: "src",
    build: {
        outDir: "dist",
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:9876',
                changeOrigin: true
            }
        }
    }
})
