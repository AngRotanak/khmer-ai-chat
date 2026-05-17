import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import unocss from 'unocss/vite'
import autoImport from 'unplugin-auto-import/vite'
import unhead from '@unhead/addons/vite'
// import tanStackRouter from '@tanstack/router-vite-plugin' // ✅ Correct

import path from 'path'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  optimizeDeps: {
  exclude: ['@tanstack/router-vite-plugin']
},

  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
      '~@': path.resolve(__dirname, 'src/bootstrap'),
      '~pages': path.resolve(__dirname, 'src/routes'),
    },
  },

  // ✅ Correct SCSS include paths
  css: {
    preprocessorOptions: {
      scss: {
        // optional, can be empty
        additionalData: '',
        includePaths: [path.resolve(__dirname, 'src/assets/styles')],
      },
    },
  },


  build: {
    target: 'esnext',
    outDir: 'dist',
  },

  esbuild: {
    supported: {
      'top-level-await': true,
    },
  },

  plugins: [
    unocss(),
    // tanStackRouter({
    //   quoteStyle: 'double',
    //   routesDirectory: './src/pages',
    //   generatedRouteTree: './.generated/route-tree.gen.ts',
    //   semicolons: true,
    // }),
    react(),
    unhead(),
    autoImport({
      dts: './.generated/auto-import.d.ts',
      include: [/\.[jt]sx?$/],
      imports: [
        {
          from: 'unhead',
          imports: [
            'getActiveHead',
            { name: 'useHead', as: 'withHead' },
            { name: 'useSeoMeta', as: 'withSeoMeta' },
            { name: 'useHeadSafe', as: 'withHeadSafe' },
          ],
        },
      ],
    }),
  ],
})
