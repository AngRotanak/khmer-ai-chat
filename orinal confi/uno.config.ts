import {
  defineConfig,
  presetIcons,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'
import presetAnimations from 'unocss-preset-animations'
import { presetUseful } from 'unocss-preset-useful'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      collections: {
        mynaui: () => import('@iconify-json/mynaui/icons.json').then(i => i.default),
      },
    }),
    presetWebFonts({
      fonts: {
        sans: [
          {
            name: 'Inter',
            weights: ['400', '500', '600', '700', '800', '900'],
            italic: true,
          },
          {
            name: 'Nokora', // or Hanuman, Kantumruy
            provider: 'google',
          },
        ],
      },
    }),
    presetAnimations(),
    presetUseful() as any,
  ],
 theme: {
  colors: {
    // 🌑 Dark theme shades
    dark: {
      900: '#0f172a', // canvas background
      800: '#1e293b', // sidebar background
      700: '#334155', // node background
      600: '#475569', // borders and buttons
      500: '#64748b', // hover states
      400: '#94a3b8', // secondary text
    },

    // 🌕 Light theme shades
    light: {
      100: '#f8fafc', // canvas background
      200: '#e2e8f0', // sidebar background
      300: '#cbd5e1', // node background
      400: '#94a3b8', // borders and buttons
      500: '#64748b', // hover states
    },

    // 🎨 Accent colors
    khmer: {
      primary: '#14b8a6', // teal for Khmer-first highlights
      danger: '#ef4444',  // red for alerts
      warning: '#f59e0b', // yellow for incomplete translations
    },
    shortcuts: {
      'node-classic': 'bg-white dark:bg-dark-900 text-black dark:text-light-100 border border-teal-600 rounded-xl shadow-sm transition-colors duration-300 divide-y',
      'btn-danger': 'bg-khmer-danger text-white px-4 py-2 rounded',
      'btn-warning': 'bg-khmer-warning text-black px-4 py-2 rounded',
      'panel': 'bg-white dark:bg-dark-800 p-4 rounded-xl shadow-sm hover:bg-light-200 dark:hover:bg-dark-700 transition-colors cursor-pointer',
        }

  },
},
rules: [
  ['input', { padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.375rem' }],
  ['btn-primary', { background: '#008080', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.375rem' }],
],
  transformers: [transformerDirectives(), transformerVariantGroup()],
})
