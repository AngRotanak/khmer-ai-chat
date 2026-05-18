import {
  defineConfig,
  presetIcons,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
  extractorSplit,
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
      brand: {
        teal: '#14b8a6',
        tealDark: '#0d9488',
      },
    },
    extend: {
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(5deg)' },
        },
        tealPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(20, 184, 166, 0.6)' },
          '50%': { boxShadow: '0 0 10px 4px rgba(20, 184, 166, 0.8)' },
        },
        fade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUpFadeIn: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDownFadeOut: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(20px)', opacity: '0' },
        },
      },
      animation: {
        wiggle: 'wiggle 0.5s ease-in-out',
        tealPulse: 'tealPulse 2s infinite',
        fade: 'fade 0.5s ease-in-out forwards',
        slideUpFadeIn: 'slideUpFadeIn 0.5s ease-out forwards',
        slideDownFadeOut: 'slideDownFadeOut 0.4s ease-in forwards',
      },
    },
  },

  shortcuts: {
    'node-classic':
      'bg-white dark:bg-dark-900 text-black dark:text-light-100 border border-brand-teal rounded-xl shadow-sm transition-colors duration-300 divide-y',

    'btn-primary':
      'bg-brand-teal hover:bg-brand-tealDark text-white px-4 py-2 rounded shadow transition',
    'btn-danger':
      'bg-khmer-danger text-white px-4 py-2 rounded shadow transition',
    'btn-warning':
      'bg-khmer-warning text-black px-4 py-2 rounded shadow transition',

    'panel':
      'bg-dark-900 text-light-100 p-4 rounded-xl shadow-sm hover:bg-dark-800 transition-colors cursor-pointer',

    'icon-chat': 'i-mynaui:chat size-5 text-brand-teal',
    'icon-comments': 'i-heroicons:chat-bubble-left-right size-5 text-brand-teal',
    'icon-posts': 'i-mynaui:pin size-5 text-brand-teal',

    'badge':
      'absolute -top-1 -right-1 bg-khmer-danger text-white text-xs px-1.5 rounded-full shadow',

    'tab-active':
      'w-12 h-12 flex items-center justify-center rounded-lg mb-4 bg-brand-teal text-white shadow-md transition-colors',
    'tab-inactive':
      'w-12 h-12 flex items-center justify-center rounded-lg mb-4 bg-dark-700 text-light-300 hover:bg-dark-600 transition-colors',

    'bottom-sheet':
      'absolute bottom-0 left-0 right-0 bg-dark-800 rounded-t-lg shadow-lg p-4',

    'scroll-top-btn':
      'fixed bottom-6 right-6 bg-gray-700 text-white px-3 py-2 rounded-full shadow-lg transition-all duration-500 transform ' +
      'hover:bg-teal-600 hover:scale-110 hover:shadow-teal-500/50',
  },

  rules: [
    ['input', {
      padding: '0.5rem',
      border: '1px solid #14b8a6',
      'border-radius': '0.375rem',
      'background-color': '#0f172a',
      color: '#f8fafc',
      outline: 'none',
      transition: 'border-color 0.2s ease',
    }],
    ['btn-primary', {
      background: '#14b8a6',
      color: '#fff',
      padding: '0.5rem 1rem',
      'border-radius': '0.375rem',
      'font-weight': '600',
      transition: 'background-color 0.2s ease',
    }],
    ['table-header', {
      'background-color': '#0d9488',
      color: '#fff',
      'font-weight': '600',
      'text-align': 'left',
    }],
    ['animate-slide-up', { animation: 'slide-up 0.3s ease-out forwards' }],
    ['animate-slide-down', { animation: 'slide-down 0.3s ease-in forwards' }],
    ['animate-fade', { animation: 'fade 0.5s ease-in-out forwards' }],
    ['animate-slideUpFadeIn', { animation: 'slideUpFadeIn 0.5s ease-out forwards' }],
    ['animate-slideDownFadeOut', { animation: 'slideDownFadeOut 0.4s ease-in forwards' }],
  ],

  transformers: [transformerDirectives(), transformerVariantGroup()],
  extractors: [extractorSplit],

  safelist: [
    'animate-slide-up',
    'animate-slide-down',
    'animate-fade',
    'animate-slideUpFadeIn',
    'animate-slideDownFadeOut',
    'animate-wiggle',
    'animate-tealPulse',
  ],

  preflights: [
    {
      getCSS: () => `
        h1, h2, h3, h4, h5, h6 {
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        p {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        ul, ol {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          padding-left: 1.25rem;
        }
        button, input, select, textarea {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        table {
          border-collapse: collapse;
          width: 100%;
        }
        th, td {
          padding: 0.5rem;
          border: 1px solid #e5e7eb;
        }
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slide-down {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(100%); opacity: 0; }
        }
        @keyframes fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUpFadeIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDownFadeOut {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(20px); opacity: 0; }
        }
      `,
    },
  ],
})
