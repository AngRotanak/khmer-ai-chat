// ✅ Text message path
export type TextPath = {
  type: 'text'
  message: string
}

// ✅ Generic template path
export type GenericPath = {
  type: 'generic'
  buttons: {
    label: string
    payload: string
  }[]
}

// ✅ Message condition path
export type MessageCondition = {
  type: 'message_condition'
  condition: {
    type: 'message_contains' | 'intent_match'
    keywords?: string[]
    intents?: string[]
    label: string
  }
  target: string
}

// ✅ Delay path (optional)
export type DelayPath = {
  type: 'delay'
  seconds: number
  target: string
}

// ✅ Unified path type
export type Path = TextPath | GenericPath | MessageCondition | DelayPath
