import { useApplicationState } from "~/stores/application-state"
import { getUserLang, getTemplates, defaultMessages } 
  from "~/modules/agent-dashboard/utils/localized-messages"
import { ref, push, set, get } from "firebase/database"
import { db } from "~/lib/firebase"

// Helper: send message via Facebook Graph API
async function sendMessageViaFacebook(pageAccessToken: string, recipientId: string, text: string) {
  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text }
      })
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Facebook API error: ${res.status} ${errText}`)
    }
    console.log("✅ Delivered message via Facebook API")
  } catch (err) {
    console.error("⚠️ Failed to deliver message via Facebook API", err)
  }
}

export function useLocalizedMessage(currentPageId: string, activeConversation: any) {
  const { agentSettings } = useApplicationState(s => s)

  // Preview the localized text without sending
  const previewMessage = async (type: "takeover" | "return" | "close") => {
    if (!activeConversation) return ""

    const lang = await getUserLang(currentPageId, activeConversation.user_id)
    const templates = agentSettings?.templates || (await getTemplates(currentPageId)) || {}

    return lang === "kh"
      ? templates[type]?.kh || defaultMessages[type].kh
      : templates[type]?.en || defaultMessages[type].en
  }

  // Actually send the message
  const sendMessage = async (type: "takeover" | "return" | "close") => {
    const text = await previewMessage(type)
    if (!text) return

    // Save to Firebase
    const msgRef = push(ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${activeConversation.id}/messages`))
    await set(msgRef, {
      id: msgRef.key,
      sender: "agent",
      text,
      timestamp: Date.now() / 1000,
      type: "text",
    })

    // Deliver via Facebook API
    // You need to fetch the page access token from your DB (e.g. khmer-ai-chat/pages/${currentPageId}/meta/page_access_token)
    const tokenSnap = await get(ref(db, `khmer-ai-chat/pages/${currentPageId}/meta/page_access_token`))
    const pageAccessToken = tokenSnap.exists() ? tokenSnap.val() : null

    if (pageAccessToken) {
      await sendMessageViaFacebook(pageAccessToken, activeConversation.user_id, text)
    } else {
      console.warn("⚠️ No page access token found, cannot deliver via Facebook API")
    }

    console.log(`📤 Sent ${type} message:`, text)
  }

  return { previewMessage, sendMessage }
}
