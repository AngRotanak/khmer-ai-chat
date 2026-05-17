// ~/modules/flow-builder/constants/khmer-ai-node-types.ts

export const KHMER_AI_NODE_TYPES = {
  SMART_WELCOME: 'smart-welcome',
  CUSTOM_INTRO: 'custom-intro',
  QUICK_MENU: 'quick-menu',
} as const

export type KhmerAiNodeType = keyof typeof KHMER_AI_NODE_TYPES
