import type { ComponentType } from 'react'
import type { Edge, Node } from '@xyflow/react'

export enum BuilderNode {
  START = 'start',
  END = 'end',
  TEXT_MESSAGE = 'text-message',
  CONDITIONAL_PATH = 'conditional-path',
  GENERIC_TEMPLATE = 'generic-template',
  SMART_WELCOME = 'smart-welcome',
  CUSTOM_INTRO = 'custom-intro',
  QUICK_MENU = 'quick-menu',
  FEATURE_BLOCK = 'feature-block',
  INTENT = 'intent',
  INFO = 'info',
  PRODUCT = 'product',
  CAROUSEL = 'carousel' // ✅ fixed
}

export type BuilderNodeType = `${BuilderNode}`

export type BotBlockType =
  | 'start'
  | 'end'
  | 'text-message'
  | 'conditional-path'
  | 'generic-template'
  | 'smart-welcome'
  | 'custom-intro'
  | 'quick-menu'
  | 'feature-block'
  | 'intent'
  | 'info'
  | 'product'
  | 'carousel'

export interface BaseNodeData extends Record<string, any> {
  deletable?: boolean
}

export interface TextMessageNodeData extends BaseNodeData {
  type: 'text-message'
  message_kh: string
  message_en: string
}

export interface ImageBlockData extends BaseNodeData {
  type: 'image'
  image_url: string
  alt_text_kh?: string
  alt_text_en?: string
}

export interface VideoBlockData extends BaseNodeData {
  type: 'video'
  video_url: string
  caption_kh?: string
  caption_en?: string
}

export interface VoiceBlockData extends BaseNodeData {
  type: 'voice'
  audio_url: string
  transcript_kh?: string
  transcript_en?: string
}

export interface ButtonBlockData extends BaseNodeData {
  buttons: {
    id: string
    label_kh: string
    label_en: string
    type: 'postback' | 'web_url'
    payload?: string
    url?: string
  }[]
}

export interface GenericTemplateNodeData extends BaseNodeData {
  cards: {
    title: string
    title_km?: string
    subtitle: string
    subtitle_km?: string
    image_url: string
    layout?: string
    options: {
      id: string
      label: string
      label_en: string
      label_kh?: string
      payload?: string
      type: 'postback' | 'web_url' | 'phone_number'
      url?: string
    }[]
  }[]
  condition: {
    id: string
    condition: string
  }

  // Legacy fallback fields
  title?: string
  title_km?: string
  subtitle?: string
  subtitle_km?: string
  image_url?: string
  layout?: string
  options?: {
    id: string // ✅ add this
    label: string
    label_en: string
    label_kh?: string
    payload?: string
    type: 'postback' | 'web_url' | 'phone_number'
    url?: string
  }[]
}


export type BlockContentType =
  | TextMessageNodeData
  | GenericTemplateNodeData
  | VideoBlockData
  | ImageBlockData
  | ButtonBlockData
  | VoiceBlockData

export interface BotBlock extends BaseNodeData {
  id: string
  type: BotBlockType
  key?: string
  intent?: string
  content: {
    kh: BlockContentType
    en: BlockContentType
  }
  config?: {
    sessionExpiryHours?: number
    quickMenuButtons?: QuickMenuButton[]
    promoTags?: string[]
  }
  metadata?: {
    createdBy?: string
    lastUpdated?: string
  }
}

export interface QuickMenuButton {
  title: string
  targetNodeId: string | null
}

export interface QuickMenuNodeData {
  language: 'kh' | 'en'
  buttons: {
    title: string
    targetNodeId: string | null
  }[]
  metadata?: {
    createdBy?: string
    lastUpdated?: string
  }
}

export interface ButtonData {
  id: string
  label: string
  blockType: string
  targetBlockId?: string | null // ✅ optional and nullable
}


export interface FeatureBlockNodeData extends BaseNodeData {
  blockType: 'info' | 'product' | 'intent' | 'smart-welcome' | 'quick-menu' | 'carousel'
  name?: string
  config: Record<string, any>
  paths: ButtonData[]
  kh?: ExportedTemplate[] // ✅ Add this
  en?: ExportedTemplate[] // ✅ Add this
}


export interface EndNodeData extends BaseNodeData {
  label?: string
  is_active?: boolean
}

export interface RegisterNodeMetadata<T = Record<string, any>> {
  type: BuilderNodeType
  node: ComponentType<any>
  detail: {
    icon: string
    title: string
    description: string
  }
  connection: {
    inputs: number
    outputs: number
  }
  available?: boolean
  defaultData?: T
  propertyPanel?: ComponentType<any>
}

const test: BuilderNode = BuilderNode.CAROUSEL
console.log(test) // should print 'carousel'


export interface ExportedBlock {
  kh: ExportedTemplate[]
  en: ExportedTemplate[]
  metadata: {
    blockType: string
    flow_name: string
    name: string
    config: Record<string, any>
    linked_pages: string[]
    created_by: string
    last_updated: string
    is_active: boolean
  }
  linked_blocks: string[]
  flow_data?: {
    kh: ExportedTemplate[]
    en: ExportedTemplate[]
    metadata: ExportedBlock['metadata']
    linked_blocks: {
      kh: ExportedTemplate[]
      en: ExportedTemplate[]
      metadata: ExportedBlock['metadata']
    }[]
  }
}


export interface ExportedTemplate {
  template_type: 'text' | 'generic'
  is_active: boolean
  silent?: boolean
  text?: string
  cards?: ExportedCard[]
}

export interface ExportedCard {
  title: string
  subtitle?: string
  layout?: string
  image_url: string
  options: ExportedOption[]
}

export type ExportedOption =
  | {
      type: 'postback' | 'web_url' | 'phone_number'
      payload: string
      label_kh?: string
      label_en?: string
      url?: string
    }
  | {
      type: 'text'
      text: string
      payload?: ''
      label_kh?: string
      label_en?: string
    }



// 🔧 Type for card options used in generic templates
export type Option = {
  type: 'postback' | 'web_url' | string
  payload?: string
  url?: string
  label?: string
  label_kh?: string
  label_en?: string
}

export type GenericCard = {
  title: string
  subtitle: string
  layout: 'hero' | 'compact' | string
  image_url: string
  options: Option[]
}

export interface FullFlowExport {
  canvas: {
    nodes: Node[]
    edges: Edge[]
  }
  flow_data: {
    kh: ExportedTemplate[]
    en: ExportedTemplate[]
    metadata: ExportedBlock['metadata']
    linked_blocks: string[] // ✅ this is correct
    }

  }
