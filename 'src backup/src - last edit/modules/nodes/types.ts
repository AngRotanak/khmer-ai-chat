import type { ComponentType } from 'react'
import type { Edge, Node } from '@xyflow/react'
import type { MessageChannelType } from '~/modules/nodes/nodes/text-message-node/constants/channels'

export enum BuilderNode {
  START = 'start',
  END = 'end',
  TEXT_MESSAGE = 'text-message',
  CONDITIONAL_PATH = 'conditional-path',
  GENERIC_TEMPLATE = 'generic-template',
  QUICK_REPLIES = 'quick-replies',
  BUTTON_TEMPLATE = 'button-template',
  MEDIA_TEMPLATE = 'media-template',
  SMART_WELCOME = 'smart-welcome',
  CUSTOM_INTRO = 'custom-intro',
  QUICK_MENU = 'menu',
  FEATURE_BLOCK = 'feature-block',
  INTENT = 'intent',
  INFO = 'info',
  PRODUCT = 'product',
  CAROUSEL = 'carousel'
}

export type BuilderNodeType = `${BuilderNode}`

export type BotBlockType =
  | 'start'
  | 'end'
  | 'text-message'
  | 'conditional-path'
  | 'generic-template'
  | 'quick-replies'
  | 'button-template'
  | 'media-template'
  | 'smart-welcome'
  | 'custom-intro'
  | 'menu'
  | 'feature-block'
  | 'intent'
  | 'info'
  | 'product'
  | 'carousel'

export interface BaseNodeData extends Record<string, any> {
  deletable?: boolean
}

export interface TextMessageNodeData extends BaseNodeData {
  channel: MessageChannelType; // e.g. 'messenger', 'sms', 'telegram'
  type: 'text-message'
  message_kh: string
  message_en: string
  is_active?: boolean
  delay_seconds?: number // delay before sending (0–60)
  show_typing?: boolean // show typing indicator before message
  tone?: 'neutral' | 'friendly' | 'urgent' // optional tone hint
  emoji_style?: 'none' | 'minimal' | 'expressive' // optional emoji rendering style
  priority?: 'normal' | 'high' // for future queueing/escalation
  trigger_condition?: string // optional condition to trigger this message
}

type QuickReplyOption = {
  id: string
  label_en?: string
  label_kh?: string
  payload: string
  type: 'text' | 'request_phone' | 'user_email' // matches Messenger spec
}

export interface QuickRepliesNodeData extends BaseNodeData {
  type: 'quick-replies'
  is_active: boolean
  intro_text?: {
    en?: string
    kh?: string
  }
  replies: QuickReplyOption[] // ✅ must not be optional
  condition?: {
    id: string
    condition: string
  }
  updatedAt?: number
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



export interface MediaTemplateNodeData extends BaseNodeData {
  type: 'media-template'
  is_active: boolean
  media_type: 'image' | 'video' | 'audio'
  media_url: string
  options: {
    id: string
    label_en?: string
    label_kh?: string
    type: 'postback' | 'web_url' | 'phone_number'
    payload?: string
    url?: string
  }[]
  condition?: {
    id: string
    condition: string
  }
  updatedAt?: number
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

export interface RegisterNodeMetadata<T extends BaseNodeData = BaseNodeData> {
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
  defaultData: T // ✅ required now
  propertyPanel?: ComponentType<any>
}

const test: BuilderNode = BuilderNode.CAROUSEL
console.log(test) // should print 'carousel'


export interface ExportedBlock {
  canvas: {
    nodes: Node[]
    edges: Edge[]
  }
  flow_data: {
    kh: ExportedTemplate[]
    en: ExportedTemplate[]
    metadata: ExportedMetadata
    linked_blocks: string[] // ✅ just block names or IDs
  }
}



export interface ExportedMetadata {
  blockType: string
  flow_name: string
  name: string
  created_by: string
  last_updated: string
  linked_pages: string[]
  is_active: boolean
  config: Record<string, any> // ✅ MUST be present
}



export interface ExportedTemplate {
  template_type: 'text' | 'generic'
  is_active: boolean
  text?: string
  cards?: ExportedCard[]
  silent?: boolean
  metadata?: {
    blockType: string
    name: string
    config: Record<string, any>
  }
}



export type ButtonOption =
  | {
      id: string
      type: 'web_url'
      label_en?: string
      label_kh?: string
      payload: string
      url: string
    }
  | {
      id: string
      type: 'postback' | 'phone_number'
      label_en?: string
      label_kh?: string
      payload: string
    }

export interface ButtonTemplateNodeData extends BaseNodeData {
  type: 'button-template'
  is_active: boolean
  intro_text?: {
    en?: string
    kh?: string
  }
  options: ButtonOption[] // ✅ must match
  condition?: {
    id: string
    condition: string
  }
  updatedAt?: number
}





export type TextQuickReplyOption = {
  id: string
  type: 'text'
  label_en?: string
  label_kh?: string
  text: string
  payload?: ''
}



export interface ExportedCard {
  title: string
  subtitle: string
  image_url: string
  layout: 'hero' | 'compact' | string
  options: ExportedOption[]
}


export type ExportedOption =
  | {
      type: 'text'
      text: string
      label_en?: string
      label_kh?: string
      payload: string
    }
  | {
      type?: 'postback' | 'web_url'
      payload?: string
      label_en?: string
      label_kh?: string
      url?: string
    }



// 🔧 Type for card options used in generic templates
export type Option = {
  id: string // ✅ Add this line
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
    metadata: ExportedMetadata
    linked_blocks: string[] // ✅ just names/IDs
  }
}



export type RenderableButtonOption = {
  id: string
  type: 'postback' | 'web_url' | 'phone_number'
  label_en?: string
  label_kh?: string
  payload?: string
  url?: string
}

