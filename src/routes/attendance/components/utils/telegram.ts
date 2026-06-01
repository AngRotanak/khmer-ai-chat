import { db } from "~/lib/firebase"
import { ref, push } from "firebase/database"

export function getGroupId(): string {
  const params = new URLSearchParams(location.search)
  let resolved = params.get("group_id") || params.get("startapp") // support both query keys
  let source = "url"

  if (!resolved) {
    const tg = (window as any).Telegram?.WebApp
    const rawParam = tg?.initDataUnsafe?.start_param || ""

    if (rawParam.includes("=")) {
      resolved = new URLSearchParams(rawParam).get("group_id") || ""
      source = "telegram_query"
    } else if (rawParam) {
      resolved = rawParam
      source = "telegram_raw"
    }
  }

  if (!resolved) {
    resolved = "-1002174749045xxx"
    source = "fallback"
  }

  // ✅ Normalize: strip quotes and whitespace
  resolved = resolved.replace(/^"+|"+$/g, "").trim()

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


// ✅ Get userId from Telegram initData
export function getUserId(): string | null {
  const tg = (window as any).Telegram?.WebApp
  return tg?.initDataUnsafe?.user?.id || null
}

// ✅ Optionally get username / fullName
export function getUserInfo() {
  const tg = (window as any).Telegram?.WebApp
  return tg?.initDataUnsafe?.user || null
}
