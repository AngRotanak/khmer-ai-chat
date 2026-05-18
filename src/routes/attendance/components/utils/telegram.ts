export function getGroupId(): string {
  const params = new URLSearchParams(location.search)
  const urlParam = params.get("group_id")
  if (urlParam) return urlParam

  const tg = (window as any).Telegram?.WebApp
  const rawParam = tg?.initDataUnsafe?.start_param || ""

  // Handle both "group_id=..." and plain "-1002174749045"
  if (rawParam.includes("=")) {
    const parsed = new URLSearchParams(rawParam).get("group_id")
    if (parsed) return parsed
  } else if (rawParam) {
    return rawParam
  }

  return "-1002174749045xxx" // safe default
}
