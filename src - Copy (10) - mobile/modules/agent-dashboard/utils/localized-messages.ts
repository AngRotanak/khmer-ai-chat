import { ref, get, push, set } from "firebase/database"
import { db } from "~/lib/firebase"
import { getAuth } from "firebase/auth"

// Fetch user language from user_profiles
export async function getUserLang(pageId: string, userId: string): Promise<"en" | "kh"> {
  try {
    const auth = getAuth()
    const currentUser = auth.currentUser
    console.log("🔎 getUserLang lookup:", { pageId, userId })
    console.log("👤 Auth UID:", currentUser?.uid || "no auth user")

    const userProfileRef = ref(db, `khmer-ai-chat/pages/${pageId}/user_sessions/${userId}`)
    
    console.log("📂 Firebase path:", userProfileRef.toString())

    const snap = await get(userProfileRef)
    const profile = snap.exists() ? snap.val() : {}

    console.log("📥 Retrieved profile:", profile)

    return profile.lang || "en"
  } catch (err) {
    console.error("⚠️ Failed to read user lang:", err, { pageId, userId })
    return "en" // fallback
  }
}

// Fetch templates from settings
export async function getTemplates(pageId: string) {
  const settingsRef = ref(db, `khmer-ai-chat/pages/${pageId}/settings`)
  const snap = await get(settingsRef)
  return snap.exists() ? snap.val().agentWelcomeTemplate || {} : {}
}

// Send localized message for takeover, return, or close
export async function sendLocalizedMessage(
  pageId: string,
  convId: string,
  userId: string,
  type: "takeover" | "return" | "close"
) {
  const lang = await getUserLang(pageId, userId)
  const templates = await getTemplates(pageId)

  const text =
    lang === "kh"
      ? templates[type]?.kh || defaultMessages[type].kh
      : templates[type]?.en || defaultMessages[type].en

  const msgRef = push(ref(db, `khmer-ai-chat/pages/${pageId}/conversations/${convId}/messages`))
  await set(msgRef, {
    id: msgRef.key,
    sender: "agent",
    text,
    timestamp: Date.now() / 1000,
    type: "text",
  })
}

// Default fallback messages
export const defaultMessages = {
  takeover: {
    en: "Hello, I’m your support agent. I’ve taken over this conversation to assist you further.",
    kh: "សួស្តី! ខ្ញុំជាអ្នកជំនួយការរបស់អ្នក។ ខ្ញុំបានចូលរួមក្នុងការសន្ទនានេះដើម្បីជួយអ្នក។",
  },
  return: {
    en: "I’ll hand you back to our bot now. It will continue assisting you.",
    kh: "ខ្ញុំនឹងប្រគល់អ្នកទៅឱ្យបុត។ វានឹងបន្តជួយអ្នក។",
  },
  close: {
    en: "This conversation has been closed. Thank you for reaching out!",
    kh: "ការសន្ទនានេះត្រូវបានបិទ។ អរគុណសម្រាប់ការទាក់ទង!",
  },
}
