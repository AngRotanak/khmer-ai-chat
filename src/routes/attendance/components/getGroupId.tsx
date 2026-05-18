function getGroupId(): string {
  // Try URL query string first
  const urlParam = new URLSearchParams(location.search).get("group_id")
  if (urlParam) return urlParam

  // Fallback to Telegram WebApp context
  const tg = (window as any).Telegram?.WebApp
  const rawParam = tg?.initDataUnsafe?.start_param || ""
  const parsed = new URLSearchParams(rawParam).get("group_id")

  // Final fallback (default group)
  return parsed || "-1002174749045"
}
