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
      provider: 'google',
      fonts: {
        sans: 'Inter',
        khmer: 'Nokora',
      },
    }),
    presetAnimations(),
    presetUseful() as any, // ✅ no need for `as any` if you’re on latest
  ],

   theme: {
    colors: {
      brand: {
        teal: '#14b8a6',
        tealDark: '#0f766e',
      },
      khmer: {
        primary: '#14b8a6',
        danger: '#ef4444',
        warning: '#f59e0b',
      },
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
      },
      animation: {
        wiggle: 'wiggle 0.5s ease-in-out',
        tealPulse: 'tealPulse 2s infinite',
      },
    },
  },

  shortcuts: {
    // Classic node container
    'node-classic':
      'bg-white dark:bg-dark-900 text-black dark:text-light-100 border border-brand-teal rounded-xl shadow-sm transition-colors duration-300 divide-y',

    // Buttons
    'btn-primary':
      'bg-brand-teal hover:bg-brand-tealDark text-white px-4 py-2 rounded shadow transition',
    'btn-danger':
      'bg-khmer-danger text-white px-4 py-2 rounded shadow transition',
    'btn-warning':
      'bg-khmer-warning text-black px-4 py-2 rounded shadow transition',

    // Panels / cards
    'panel':
      'bg-dark-900 text-light-100 p-4 rounded-xl shadow-sm hover:bg-dark-800 transition-colors cursor-pointer',

    // Icons
    'icon-chat': 'i-mynaui:chat size-5 text-brand-teal',
    'icon-comments': 'i-heroicons:chat-bubble-left-right size-5 text-brand-teal',
    'icon-posts': 'i-mynaui:pin size-5 text-brand-teal',

    // Badges
    'badge':
      'absolute -top-1 -right-1 bg-khmer-danger text-white text-xs px-1.5 rounded-full shadow',

    // Tabs
    'tab-active':
      'w-12 h-12 flex items-center justify-center rounded-lg mb-4 bg-brand-teal text-white shadow-md transition-colors',
    'tab-inactive':
      'w-12 h-12 flex items-center justify-center rounded-lg mb-4 bg-dark-700 text-light-300 hover:bg-dark-600 transition-colors',

    // Bottom sheet
    'bottom-sheet':
      'absolute bottom-0 left-0 right-0 bg-dark-800 rounded-t-lg shadow-lg p-4',

    // Floating Scroll to Top button
    'scroll-top-btn':
      'fixed bottom-6 right-6 bg-gray-700 text-white px-3 py-2 rounded-full shadow-lg transition-all duration-500 transform ' +
      'hover:bg-teal-600 hover:scale-110 hover:shadow-teal-500/50',
  },


  rules: [
    // Inputs styled with black background + teal border
    ['input', {
      padding: '0.5rem',
      border: '1px solid #14b8a6',
      'border-radius': '0.375rem',
      'background-color': '#0f172a',
      color: '#f8fafc',
      'outline': 'none',
      'transition': 'border-color 0.2s ease',
    }],

    // Primary button (black + teal)
    ['btn-primary', {
      background: '#14b8a6',
      color: '#fff',
      padding: '0.5rem 1rem',
      'border-radius': '0.375rem',
      'font-weight': '600',
      'transition': 'background-color 0.2s ease',
    }],

    // Table header styling
    ['table-header', {
      'background-color': '#0d9488',
      color: '#fff',
      'font-weight': '600',
      'text-align': 'left',
    }],

    // Animations
    ['animate-slide-up', { animation: 'slide-up 0.3s ease-out forwards' }],
    ['animate-slide-down', { animation: 'slide-down 0.3s ease-in forwards' }],
  ],

  transformers: [transformerDirectives(), transformerVariantGroup()],
  extractors: [extractorSplit],

  safelist: ['animate-slide-up', 'animate-slide-down', 'animate-wiggle', 'animate-tealPulse'],
  preflights: [
  {
    getCSS: () => `
      /* Headings and paragraphs */
      h1, h2, h3, h4, h5, h6 {
        margin-top: 1rem;
        margin-bottom: 0.5rem;
        font-weight: 600;
      }
      p {
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;
      }

      /* Lists */
      ul, ol {
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;
        padding-left: 1.25rem;
      }

      /* Form controls */
      button, input, select, textarea {
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;
      }

      /* Tables */
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
    `,
  },
],

})
