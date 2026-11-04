import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => ({
    plugins: [
        react(),
        ...(mode === 'analyze'
            ? [
                  (await import('rollup-plugin-visualizer')).visualizer({
                      filename: 'reports/bundle.html',
                      gzipSize: true,
                      open: false,
                  }),
              ]
            : []),
    ],
    build: {
        manifest: true,
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        {
                            name: 'react-vendor',
                            test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,
                            priority: 20,
                        },
                        {
                            name: 'router-vendor',
                            test: /node_modules[\\/](?:react-router|react-router-dom)[\\/]/,
                            priority: 10,
                        },
                    ],
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/shared/lib/test/setup-tests.ts'],
        env: {
            VITE_API_URL: 'http://localhost/api/v1',
        },
    },
}))
