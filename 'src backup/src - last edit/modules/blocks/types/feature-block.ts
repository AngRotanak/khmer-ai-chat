


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

export type WaitTrigger = 'immediate' | 'delay' | 'condition'

export type MatchType = 'includes' | 'equals' | 'starts_with'

export type DetectionMode = 'keyword' | 'intent'

export interface Condition {
  match: MatchType
  value: string
}

export interface PathItem {
  template_id: string
  label: string
  blockType: string
  targetBlockId: string | null
  send_immediately: boolean
  trigger?: WaitTrigger
  condition?: Condition
  detection_mode?: DetectionMode // optional, defaults to 'keyword'
  expected_intent?: string
  delay?: {
    seconds: number
    target?: string
  }
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
  entry_condition: Condition
  config: Record<string, any>
  canvas: Canvas
}