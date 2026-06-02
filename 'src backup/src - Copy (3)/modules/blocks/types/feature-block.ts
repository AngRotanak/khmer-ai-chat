
export interface BaseNodeData extends Record<string, any> {
  deletable?: boolean
}

export type EntryTrigger =
  | 'message'
  | 'ref_url'
  | 'qr_code'
  | 'comment'
  | 'shop_message'
  | 'ad_click'

export type WaitTrigger = 'immediate' | 'delay' | 'condition' | 'on_reply'
export type MatchType = 'includes' | 'equals' | 'starts_with'
export type DetectionMode = 'keyword' | 'intent'

export interface Condition {
  match: MatchType
  value: string | string[]   // ✅ allow single or multiple keywords
}

export type BlockType =
  | 'info'
  | 'product'
  | 'intent'
  | 'smart-welcome'
  | 'quick-menu'
  | 'carousel'

export type RawBlockType =
  | 'info'             // Informative block
  | 'product'          // Product-related block
  | 'intent'           // Intent-triggered block
  | 'smart-welcome'    // Welcome logic with special config
  | 'quick-menu'       // Menu-style block
  | 'carousel'         // Carousel-style block

export type MessengerBlockType =
  | 'text-message'        // Plain text, emoji, typing
  | 'generic-template'    // Card with buttons
  | 'carousel'            // Horizontal scrollable cards
  | 'button-template'     // Text + buttons (no image)
  | 'media-template'      // Image or video + button
  | 'voice-template'
  | 'quick-replies'       // Text + reply chips

export type MessengerPayload =
  | string
  | {
      node_id: string
      template_type: string
      lang: string
    }

export interface PathItem {
  id: string
  template_ref: string
  label: string
  blockType: MessengerBlockType
  targetBlockId: string | null
  send_immediately: boolean
  trigger?: WaitTrigger
  condition?: Condition
  detection_mode?: DetectionMode
  expected_intent?: string
  intent_confidence?: number
  delay?: {
    seconds: number
    target?: string
  }
  payload?: MessengerPayload
}

export interface Canvas {
  layout: 'vertical' | 'horizontal'
  paths: PathItem[]
}

export interface SmartWelcomeConfig {
  inactivityHours: number
  defaultLang: string
  personalizeName: boolean
  campaignTag: string
}

export interface CommentTriggerConfig {
  scope: 'all' | 'post'
  post_id?: string
}

/* ✅ New QuickMenuConfig */
export interface QuickMenuConfig {
  defaultLang: 'en' | 'kh'        // language to use by default
  inactivityHours: number         // show quick menu after inactivity
  alwaysShow: boolean             // if true, always show on every new message
  menu_tag: string                // tag to distinguish flows (default, new_year, special_event)
}

/* ✅ New CarouselConfig */
export interface CarouselConfig {
  /** Tag to distinguish flows (default, new_year, special_event) */
  tag?: string

  /** Layout style for the carousel */
  layout: 'carousel' | 'horizontal-scroll' | 'fade'

  /** Whether the carousel should autoplay */
  autoplay: boolean

  /** Interval in milliseconds between slides (used if autoplay = true) */
  interval: number

  /** Whether to show navigation indicators (dots/arrows) */
  showIndicators: boolean
}

export interface FeatureBlock extends BaseNodeData {
  block_id: string
  block_name: string
  block_type: BlockType
  is_active: boolean
  tags: string[]
  linked_pages: string[]
  created_by: string
  last_updated: string
  version: number
  entry_trigger: EntryTrigger
  entry_condition?: Condition
  config?: SmartWelcomeConfig | CommentTriggerConfig | QuickMenuConfig | Record<string, any>
  canvas: Canvas
}
