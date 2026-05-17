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
  CONVERSATION_AGENT = 'conversation-agent',
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
  | 'conversation-agent'
  | 'intent'
  | 'info'
  | 'product'
  | 'carousel'

export interface BaseNodeData extends Record<string, any> {
  deletable?: boolean
}

export interface TextMessageNodeData extends BaseNodeData {
  channel: MessageChannelType;
  type: 'text-message';
  template_ref?: string; // ✅ used during export
  message_en?: string;   // ✅ editable in property panel
  message_kh?: string;   // ✅ editable in property panel
  is_active?: boolean;
  delay_seconds?: number;
  show_typing?: boolean;
  tone?: 'neutral' | 'friendly' | 'urgent';
  emoji_style?: 'none' | 'minimal' | 'expressive';
  priority?: 'normal' | 'high';
  trigger_condition?: string;
}


type QuickReplyOption = {
  id: string
  label_en?: string
  label_kh?: string
  payload: string
  type: 'text' | 'request_phone' | 'user_email' // matches Messenger spec
}

export interface QuickRepliesNodeData extends BaseNodeData {
  intro_text?: {
    en?: string
    kh?: string
  }
  replies: QuickReplyOption[] // ✅ must not be optional
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
      label_en: string
      label_kh?: string
      payload?: string
      type: 'postback' | 'web_url' | 'phone_number'
      url?: string
    }[]
  }[]
  // Legacy fallback fields
  title?: string
  title_km?: string
  subtitle?: string
  subtitle_km?: string
  image_url?: string
  layout?: string
  options?: {
    id: string // ✅ add this
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
 // ✅ Multilingual intro text
  intro_text?: {
    en?: string
    kh?: string
  }

  // ✅ Messenger-style button options
  options: {
    id: string
    label_en?: string
    label_kh?: string
    payload?: string // used for 'postback'
    type: 'postback' | 'web_url' | 'phone_number'

    url?: string     // ✅ required for 'web_url'
  }[]
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


export type ExportedOption = {
  type: 'postback' | 'web_url' | 'text' | 'phone_number'
  payload?: string
  label_en?: string
  label_kh?: string
  url?: string
  text?: string
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



export type RenderableButtonOption = {
  id: string
  type: 'postback' | 'web_url' | 'phone_number'
  label_en?: string
  label_kh?: string
  payload?: string
  url?: string
}




export interface ConversationAgentNodeData extends BaseNodeData {
  topic: string
  // 🔧 Update this line:
  trigger_keywords: {
    keyword: string
    match: 'includes' | 'equals' | 'startsWith'
  }[]
  trigger_intents: string[]  // 🔹 Still used for Predict API routing
  welcome_message: string
  context_lock: boolean
  fallback_message: string
  sub_intents: SubIntentConfig[]
}


export interface SubIntentConfig {
  id: string
  reply_type: 'auto-reply' | 'trigger-flow' | 'both'
  confidence_threshold: number

  // Auto-reply content
  reply_message?: string
  reply_media?: {
    type: 'image' | 'video' | 'file'
    url: string
    caption?: string
  }

  // Flow trigger
  flow_payload?: string

  // Optional: Messenger-safe preview override
  preview_override?: string

  // 🔹 NEW: Keyword matching logic per sub-intent
  trigger_keyword_conditions?: {
    keyword: string
    match: 'includes' | 'equals' | 'startsWith'
  }[]
}


export type Template = {
  template_id: string;
  template_type: string;
  lang: string;
  is_active: boolean;
  text?: string;
  cards?: any[];
  delay_seconds?: number;
  emoji_style?: string;
  tone?: string;
  show_typing?: boolean;
};

export type SharedTemplate = {
  template_id: string;
  template_type: string;
  is_active: boolean;
  config: {
    delay_seconds: number;
    emoji_style: string;
    tone: string;
    show_typing: boolean;
  };
  locales: Record<string, { lang: string; text?: string; cards?: any[] }>;
};

export type Block = {
  block_id: string;
  block_name: string;
  block_type: string;
  templates?: Record<string, Template>;
  canvas: {
    layout: string;
    paths: Path[];
  };
};

export type Path = {
  template_id?: string;
  template_ref?: string;
  send_immediately?: boolean;
  trigger?: string;
  condition?: any;
  next?: Path;
};

export type BlockMap = Record<string, Record<string, Block>>;
export type SharedTemplateMap = Record<string, SharedTemplate>;
