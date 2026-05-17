import { ref, get } from "firebase/database"
import { db } from "~/lib/firebase"

// Try to resolve a human-readable name for a user
export async function resolveUserName(pageId: string, userId: string): Promise<string> {
  try {
    // 1️⃣ Check user profile (preferred)
    const profileRef = ref(db, `khmer-ai-chat/users/${userId}/profile`)
    const profileSnap = await get(profileRef)
    if (profileSnap.exists()) {
      const profile = profileSnap.val()
      if (profile?.name) {
        return profile.name
      }
      // If you also store extra info like first_name/last_name
      if (profile?.first_name || profile?.last_name) {
        return `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
      }
    }

    // 2️⃣ Fallback: check conversation metadata
    const convMetaRef = ref(db, `khmer-ai-chat/pages/${pageId}/conversations/${userId}/meta`)
    const convMetaSnap = await get(convMetaRef)
    if (convMetaSnap.exists()) {
      const convMeta = convMetaSnap.val()
      if (convMeta?.name) {
        return convMeta.name
      }
    }

    // 3️⃣ Fallback: check page meta (page name)
    const pageRef = ref(db, `khmer-ai-chat/pages/${pageId}/meta/page_name`)
    const pageSnap = await get(pageRef)
    if (pageSnap.exists()) {
      return pageSnap.val()
    }

    // 4️⃣ Default: return the ID itself
    return userId
  } catch (err) {
    console.error("❌ Name lookup failed:", err)
    return userId
  }
}
