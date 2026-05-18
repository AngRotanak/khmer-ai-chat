// src/utils/telegram.ts
export function getGroupId(): string {
  const params = new URLSearchParams(location.search)

  // ✅ Support both snake_case and camelCase
  const urlParam = params.get("group_id") || params.get("groupId")
  if (urlParam) return urlParam

  // ✅ Fallback to Telegram WebApp context
  const tg = (window as any).Telegram?.WebApp
  const rawParam = tg?.initDataUnsafe?.start_param || ""
  const parsed = new URLSearchParams(rawParam).get("group_id") || rawParam

  // ✅ Final fallback (safe default)
  return parsed || "-1002174749045xxx"
}
