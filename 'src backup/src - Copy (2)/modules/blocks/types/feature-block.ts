

export interface BaseNodeData extends Record<string, any> {
  deletable?: boolean
}


export type EntryTrigger = 'message' | 'ref_url' | 'qr_code' | 'comment' | 'shop_message' | 'ad_click'
export type WaitTrigger = 'immediate' | 'delay' | 'condition'
export type MatchType = 'includes' | 'equals' | 'starts_with'
export type DetectionMode = 'keyword' | 'intent'


export interface Condition {
  match: MatchType
  value: string
}


export type BlockType = 'info' | 'product' | 'intent' | 'smart-welcome' | 'menu' | 'carousel'


export type RawBlockType =
  | 'info'             // Informative block
  | 'product'          // Product-related block
  | 'intent'           // Intent-triggered block
  | 'smart-welcome'    // Welcome logic with special config
  | 'menu'             // Menu-style block
  | 'carousel'         // Carousel-style block


export type MessengerBlockType =
  | 'text-message'        // Plain text, emoji, typing
  | 'generic-template'    // Card with buttons
  | 'carousel'            // Horizontal scrollable cards
  | 'button-template'     // Text + buttons (no image)
  | 'media-template'      // Image or video + button
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

export interface FeatureBlock extends BaseNodeData {
  block_id: string
  block_name: string
  block_type: 'info' | 'product' | 'intent' | 'smart-welcome' | 'menu' | 'carousel'
  is_active: boolean
  tags: string[]
  linked_pages: string[]
  created_by: string
  last_updated: string
  version: number
  entry_trigger: EntryTrigger
  entry_condition?: Condition
  config: Record<string, any>
  canvas: Canvas
}
