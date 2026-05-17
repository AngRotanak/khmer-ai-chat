// tokenManager.ts
import { ref, get } from "firebase/database"
import { db } from "~/lib/firebase"

const tokenCache: Record<string, string> = {}

export async function getPageToken(pageId: string): Promise<string> {
  // If cached, return immediately
  if (tokenCache[pageId]) return tokenCache[pageId]

  // Fetch from Firebase
  const tokenRef = ref(db, `khmer-ai-chat/pages/${pageId}/meta/page_access_token`)
  const snapshot = await get(tokenRef)
  const token = snapshot.val()

  if (!token) throw new Error(`No page_access_token found for page ${pageId}`)

  tokenCache[pageId] = token
  return token
}
