type PayloadCheckMode = 'flowId' | 'postback'

export function isMessengerSafePayload(payload: string, mode: PayloadCheckMode = 'postback'): boolean {
  if (typeof payload !== 'string' || payload.trim() === '') return false

  if (mode === 'flowId') {
    return (
      !payload.startsWith('_') &&
      !payload.includes('#') &&
      !payload.includes('/') &&
      !payload.includes('[') &&
      !payload.includes(']')
    )
  }

  // Default: postback mode
  return (
    payload.length <= 1000 &&
    !payload.includes('{{') &&
    !payload.includes('}}')
  )
}
