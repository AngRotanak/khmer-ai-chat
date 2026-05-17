import {
  defineConfig,
  presetIcons,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
  extractorSplit,   // ✅ now imported from 'unocss'
} from 'unocss'

import presetAnimations from 'unocss-preset-animations'
import { presetUseful } from 'unocss-preset-useful'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      collections: {
        mynaui: () =>
          import('@iconify-json/mynaui/icons.json').then(i => i.default),
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
          { name: 'Nokora', provider: 'google' },
        ],
      },
    }),
    presetAnimations(),
    presetUseful() as any, // ✅ no need for `as any` if you’re on latest
  ],

  theme: {
    colors: {
      dark: {
        900: '#0f172a',
        800: '#1e293b',
        700: '#334155',
        600: '#475569',
        500: '#64748b',
        400: '#94a3b8',
      },
      light: {
        100: '#f8fafc',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
      },
      khmer: { primary: '#14b8a6', danger: '#ef4444', warning: '#f59e0b' },
    },
  },

  shortcuts: {
    'node-classic':
      'bg-white dark:bg-dark-900 text-black dark:text-light-100 border border-teal-600 rounded-xl shadow-sm transition-colors duration-300 divide-y',
    'btn-danger': 'bg-khmer-danger text-white px-4 py-2 rounded',
    'btn-warning': 'bg-khmer-warning text-black px-4 py-2 rounded',
    'panel':
      'bg-white dark:bg-dark-800 p-4 rounded-xl shadow-sm hover:bg-light-200 dark:hover:bg-dark-700 transition-colors cursor-pointer',
    'icon-chat': 'i-mynaui:chat size-5',
    'icon-comments': 'i-heroicons:chat-bubble-left-right size-5',
    'icon-posts': 'i-mynaui:pin size-5',
    'badge': 'absolute -top-1 -right-1 bg-khmer-danger text-white text-xs px-1.5 rounded-full shadow',
    'tab-active':
      'w-12 h-12 flex items-center justify-center rounded-lg mb-4 bg-khmer-primary text-white shadow-md transition-colors',
    'tab-inactive':
      'w-12 h-12 flex items-center justify-center rounded-lg mb-4 bg-dark-700 text-light-300 hover:bg-dark-600 transition-colors',
    'bottom-sheet':
      'absolute bottom-0 left-0 right-0 bg-dark-800 rounded-t-lg shadow-lg p-4',
  },

  rules: [
    ['input', { padding: '0.5rem', border: '1px solid #ccc', 'border-radius': '0.375rem' }],
    ['btn-primary', { background: '#008080', color: '#fff', padding: '0.5rem 1rem', 'border-radius': '0.375rem' }],
    ['animate-slide-up', { animation: 'slide-up 0.3s ease-out forwards' }],
    ['animate-slide-down', { animation: 'slide-down 0.3s ease-in forwards' }],
  ],

  transformers: [transformerDirectives(), transformerVariantGroup()],
  extractors: [extractorSplit],

  safelist: ['animate-slide-up', 'animate-slide-down'],

  preflights: [
    {
      getCSS: () => `
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slide-down {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(100%); opacity: 0; }
        }
      `,
    },
  ],
})
