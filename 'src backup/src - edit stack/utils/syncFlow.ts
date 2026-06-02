import { ref, set } from 'firebase/database'
import { db } from '~/lib/firebase'

// 🔧 Recursively remove undefined values
function clean(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(clean) // 🔁 Clean each item in array
  } else if (obj && typeof obj === 'object') {
    const result: any = {}
    for (const key in obj) {
      const value = obj[key]
      if (value !== undefined) {
        result[key] = clean(value) // 🔁 Clean nested objects
      }
    }
    return result
  }
  return obj // ✅ Return primitive values as-is
}


export async function syncFlowToFirebase(flowData: Record<string, any>) {
  const flowKeys = Object.keys(flowData)
  const results: Record<string, 'success' | 'error'> = {}

  for (const key of flowKeys) {
    try {
      const cleaned = clean(flowData[key])
      const flowRef = ref(db, key)
      await set(flowRef, cleaned)
      console.log(`✅ Synced flow "${key}" to Firebase`)
      results[key] = 'success'
    } catch (err) {
      console.error(`❌ Failed to sync flow "${key}":`, err)
      results[key] = 'error'
    }
  }

  return results
}
