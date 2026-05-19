// src/utils/telegram.ts
import { db } from "~/lib/firebase"
import { ref, push } from "firebase/database"

export function getGroupId(): string {
  const params = new URLSearchParams(location.search)
  const urlParam = params.get("group_id")

  let resolved: string | null = null
  let source = "unknown"

  if (urlParam) {
    resolved = urlParam
    source = "url"
  } else {
    const tg = (window as any).Telegram?.WebApp
    const rawParam = tg?.initDataUnsafe?.start_param || ""

    if (rawParam.includes("=")) {
      const parsed = new URLSearchParams(rawParam).get("group_id")
      if (parsed) {
        resolved = parsed
        source = "telegram_query"
      }
    } else if (rawParam) {
      resolved = rawParam
      source = "telegram_raw"
    }
  }

  if (!resolved) {
    resolved = "-1002174749045xxx"
    source = "fallback"
  }

  // ✅ Save log to Firebase
  try {
    push(ref(db, `logs/webapp/groupId`), {
      type: "groupId_resolve",
      source,
      value: resolved,
      locationSearch: location.search,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error("Failed to log groupId:", err)
  }

  return resolved
}
