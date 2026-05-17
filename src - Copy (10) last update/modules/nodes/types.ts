import type { ComponentType } from 'react'
import type { MessageChannelType } from '~/modules/nodes/nodes/text-message-node/constants/channels'
import type { MessengerBlockType } from '~/modules/blocks/types/feature-block'

import type { Node, Edge } from '@xyflow/react';


export enum BuilderNode {
  START = 'start',
  END = 'end',
  TEXT_MESSAGE = 'text-message',
  CONDITIONAL_PATH = 'conditional-path',
  GENERIC_TEMPLATE = 'generic-template',
  QUICK_REPLIES = 'quick-replies',
  BUTTON_TEMPLATE = 'button-template',
  MEDIA_TEMPLATE = 'media-template',
  VOICE_TEMPLATE = 'voice-template', // ✅ new entry
  SMART_WELCOME = 'smart-welcome',
  CUSTOM_INTRO = 'custom-intro',
  QUICK_MENU = 'menu',
  FEATURE_BLOCK = 'feature-block',
  CONVERSATION_AGENT = 'conversation-agent',
  INTENT = 'intent',
  INFO = 'info',
  PRODUCT = 'product',
  CAROUSEL = 'carousel',
  CHAT_WITH_AGENT = 'chat-with-agent',
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
  | 'voice-template'
  | 'smart-welcome'
  | 'custom-intro'
  | 'menu'
  | 'feature-block'
  | 'conversation-agent'
  | 'intent'
  | 'info'
  | 'product'
  | 'carousel'
  | 'chat-with-agent'

export interface BaseNodeData extends Record<string, any> {
  deletable?: boolean
}

export interface ChatWithAgentNodeData extends BaseNodeData {
  type: 'chat-with-agent'
  is_active: boolean
  routing?: string // optional: assign to team (sales, support)
  priority?: 'normal' | 'high'
  welcome_message_kh?: string // ✅ Khmer welcome message
  welcome_message_en?: string // ✅ English welcome message
  waiting_message_kh?: string // ✅ Khmer welcome message
  waiting_message_en?: string // ✅ English welcome message
  payload?: { handoff: true }
  updatedAt?: number
}


export type ConversationStatus =
  | "Bot active"
  | "Agent active"
  | "Pending"
  | "Waiting"



// Messenger message
export interface Message {
  id: string
  senderId: string
  text: string
  timestamp: number
  fromAgent?: boolean // optional flag to distinguish agent vs customer
}



export interface FlowLog {
  id: string
  name: string
  timestamp: number
}

export interface ConversationMessage {
  id: string
  sender: string
  text?: string

  // Legacy single fields (always check typeof === "string" before using)
  imageUrl?: string
  videoUrl?: string
  audioUrl?: string

  // Preferred grouped arrays (always default to [])
  images: string[]
  videos: string[]
  audios: string[]

  timestamp: number
  time?: string
}


export interface CommentConversation {
  id: string
  user_id: string
  customerName: string
  avatar?: string | null
  lastMessage: string
  lastComment: string
  status: string
  timestamp: number
  posts: PostData[]   // each post with all comments
  lastReadCommentTimestamp?: number
  unreadCount?: number   // ✅ add this field
}



export interface Comment {
  id: string
  text?: string
  userName?: string
  timestamp?: number | string | Date
  permalink?: string
  replies?: Comment[]
}

export interface PostData {
  id: string
  post?: {
    id: string
    title: string
    image?: string
    permalink?: string
  }
  comments?: Comment[]
}


export type PostConversation = Conversation & {
  type: "post"
  posts?: Record<
    string,
    {
      post: {
        id: string
        title: string
        image?: string
        permalink?: string
      }
      comments?: Record<
        string,
        {
          id: string
          userName: string
          text: string
          timestamp: number
        }
      >
    }
  >
}

export interface Conversation {
  id: string
  user_id: string
  customerName: string
  avatar?: string | null
  lastComment: string
  lastMessage: string
  status: string
  timestamp: number
  routing: string
  priority: string
  type: "message" | "comment" | "post"   // ✅ add "post"
  messages: ConversationMessage[]
  flowLogs: FlowLog[]
  posts: PostData[]
  // updatedAt?: number
  lastReadTimestamp?: number   // 🔹 new field
  lastReadCommentTimestamp?: number   // ✅ new field
   userProfileUrl?: string   // 🔹 profile link
  avatarUrl?: string        // 🔹 avatar image

}

export interface ConversationReport {
  id: string
  customerName: string
  agentName: string
  startTime: number
  endTime: number
  status: string
  messages: {
    sender: string
    text?: string
    imageUrl?: string
    videoUrl?: string
    audioUrl?: string
    timestamp: number
  }[]
  userProfileUrl?: string   // 🔹 profile link
  avatarUrl?: string        // 🔹 avatar image
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

export interface VoiceTemplateNodeData extends BaseNodeData {
  channel: MessageChannelType
  type: 'voice-template'
  media_url: string
  is_active: boolean
  delay_seconds: number
  show_typing: boolean
  priority: 'low' | 'normal' | 'high'
  trigger_condition: string
  template_ref?: string
  updatedAt?: number
  tone?: 'neutral' | 'friendly' | 'urgent' // ✅ add tone here
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
  media_type: 'image' | 'video'
  media_url: string

  intro_text?: {
    en?: string
    kh?: string
  }

  options: {
    id: string
    label_en?: string
    label_kh?: string
    type: 'postback' | 'web_url' | 'phone_number'
    payload?: string
    url?: string
  }[]
}


export interface GenericTemplateNodeData extends BaseNodeData {
  cards: {
    title_en: string
    title_kh?: string
    subtitle_en: string
    subtitle_kh?: string
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
  title_en?: string
  title_kh?: string
  subtitle_en?: string
  subtitle_kh?: string
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
  | VoiceTemplateNodeData
  | ChatWithAgentNodeData



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
  type: BuilderNodeType;
  node: ComponentType<any>;
  detail: { icon: string; title: string; description: string };
  connection: { inputs: number; outputs: number };
  available?: boolean;
  defaultData: T;
  propertyPanel?: ComponentType<any>;
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

type QuickReplyOption = {
  id: string
  label_en?: string
  label_kh?: string
  payload: string
  type: 'text' | 'user_phone_number' | 'user_email' // matches Messenger spec
}

export interface QuickRepliesNodeData extends BaseNodeData {
  intro_text?: {
    en?: string
    kh?: string
  }
  replies: QuickReplyOption[] // ✅ must not be optional
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
    type: 'postback' | 'web_url' | 'phone_number'
    payload?: string
    url?: string
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


export type MatchMode = 'includes' | 'equals' | 'startsWith' | 'regex'


export interface TriggerKeyword {
  keyword: string
  match: MatchMode
  regex_pattern?: string   // 👈 new optional field
}


export interface ConversationAgentNodeData extends BaseNodeData {
  topic: string
  is_active: boolean
  trigger_keywords: { keyword: string; match: MatchMode }[]
  intent_id: string
  confidence_threshold: number
  flow_payload: string
  escape_keywords: string[]
  welcome_message_en: string
  welcome_message_kh: string
  context_lock: boolean
  fallback_message_en: string
  fallback_message_kh: string
  lock_on_entry: boolean
  release_on_complete: boolean
  sub_intents: SubIntentConfig[]
}


export interface SubIntentConfig {
  id: string
  confidence_threshold: number
  flow_payload: string
  release_on_complete: boolean
  escape_keywords: string[]

  // Auto-reply content (bilingual)
  reply_message_en: string
  reply_message_kh: string

  // Keyword matching logic per sub-intent
  trigger_keyword_conditions: { keyword: string; match: MatchMode }[]
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
    emoji_style?: string;
    tone: string;
    show_typing: boolean;
    priority?: string;
    routing?: string;   // ✅ add this
  };
  locales: Record<string, {
    lang: string;
    text?: string;
    cards?: any[];
    media_url?: string;
    options?: any[];
    replies?: any[];
  }>;
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



export function normalizeToTemplateType(type: any): string {
  if (typeof type !== "string") {
    console.warn("🟥 normalizeToTemplateType received non-string:", type);
    return "text-message"; // safe fallback
  }

  switch (type.trim()) {
    // ---------------- text ----------------
    case "text":
    case "text-message":
      return "text-message";

    // ---------------- generic ----------------
    case "generic":
    case "generic-template":
      return "generic-template";

    // ---------------- button ----------------
    case "button":
    case "button-template":
      return "button-template";

    // ---------------- quick replies ----------------
    case "quick-replies":
    case "quickReplies":
    case "quick_reply":
    case "quick-reply":
      return "quick-replies";

    // ---------------- media ----------------
    case "media":
    case "media-template":
    case "mediaTemplate":
      return "media-template";

    // ---------------- voice ----------------
    case "voice":
    case "voice-template":
    case "voiceTemplate":
      return "voice-template";

    // ---------------- feature-blocks ----------------
    case "feature-block":
      return "feature-block";

    case "carousel":
      return "carousel";

    case "info":                // ✅ add this
      return "info";   // or "carousel" if you want to treat info as carousel

    // ---------------- conversation agent ----------------
    case "conversation-agent":
      return "conversation-agent";

    case 'chat-with-agent':
      return 'chat-with-agent'


    // ---------------- default ----------------
    default:
      console.warn("🟥 Unknown template_type, defaulting to text-message:", type);
      return "text-message"; // safe fallback
  }
}




export interface FlowBlock {
  block_id: string;
  block_name: string;
  block_type: string;
  canvas?: {
    nodes?: Node[];
    edges?: Edge[];
  };
  [key: string]: any;
}

export interface FlowData {
  feature_blocks_by_type: Record<string, Record<string, FlowBlock>>;
  shared_templates?: Record<string, any>;
  is_draft?: boolean;
  last_saved_at?: string;
  saved_by?: string;
}



export function normalizeToMessengerBlockType(templateType?: string): MessengerBlockType {
  switch (templateType) {
    case 'text':
      return 'text-message';
    case 'generic-template':
      return 'generic-template';
    case 'carousel':
      return 'carousel';
    case 'button-template':
      return 'button-template';
    case 'media-template':
      return 'media-template';
    case "voice-template":
      return "voice-template";

    case 'quick-replies':
      return 'quick-replies';
    default:
      return 'text-message'; // fallback
  }
}
