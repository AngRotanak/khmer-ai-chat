import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import unocss from 'unocss/vite'
import autoImport from 'unplugin-auto-import/vite'
import unhead from "@unhead/addons/vite";


import path from 'path'

export default defineConfig({
    optimizeDeps: {
        include: ['@emoji-mart/react', '@emoji-mart/data'],
        exclude: ['@tanstack/router-vite-plugin'],
    },

    resolve: {
        alias: {
            '~': path.resolve(__dirname, 'src'),
            '~@': path.resolve(__dirname, 'src/bootstrap'),
            '~pages': path.resolve(__dirname, 'src/routes'),
        },
    },

    css: {
        preprocessorOptions: {
            scss: {
                additionalData: '',
                includePaths: [path.resolve(__dirname, 'src/assets/styles')],
            },
        },
    },

    base: '/',
    build: {
        target: 'esnext',
        outDir: 'dist',
        chunkSizeWarningLimit: 1000, // raise limit to 1MB
        rollupOptions: {
            output: {
                manualChunks: {
                    firebase: ['firebase/app', 'firebase/database'],
                    router: ['@tanstack/react-router'],
                    charts: ['chart.js', 'react-chartjs-2'],
                    maps: ['leaflet', 'react-leaflet'],
                    tiptap: ['@tiptap/react', '@tiptap/starter-kit'],
                },
            },
        },
    },


    esbuild: {
        supported: {
            'top-level-await': true,
        },
    },

    plugins: [
        unocss(),
        react(),
        unhead(),
        autoImport({
            dts: "./.generated/auto-import.d.ts",
            include: [/\.[jt]sx?$/],
            imports: [
                "react",
                {
                    from: "unhead",
                    imports: [
                        "getActiveHead",
                        { name: "useHead", as: "withHead" },
                        { name: "useSeoMeta", as: "withSeoMeta" },
                        { name: "useHeadSafe", as: "withHeadSafe" }
                    ]
                }
            ]
        })

    ],
})
