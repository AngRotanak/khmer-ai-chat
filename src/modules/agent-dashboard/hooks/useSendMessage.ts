import { ref, push, update, serverTimestamp, get } from "firebase/database"
import { db } from "~/lib/firebase"
import type { Conversation } from '~/modules/nodes/types'

// 🔹 Helper: send message via Facebook Graph API
async function sendMessageViaFacebook(
  pageAccessToken: string,
  recipientId: string,
  msg: {
    text?: string
    imageUrl?: string
    videoUrl?: string
    audioUrl?: string
  },
  lastInteraction?: number
) {
  const payload: any = { recipient: { id: recipientId } }

  if (msg.text) {
    payload.message = { text: msg.text }
  }
  if (msg.imageUrl) {
    payload.message = { attachment: { type: "image", payload: { url: msg.imageUrl } } }
  }
  if (msg.videoUrl) {
    payload.message = { attachment: { type: "video", payload: { url: msg.videoUrl } } }
  }
  if (msg.audioUrl) {
    payload.message = { attachment: { type: "audio", payload: { url: msg.audioUrl } } }
  }

  // ✅ Debug logs
  console.log("🔎 Sending to Facebook API")
  console.log("Recipient ID:", recipientId)
  console.log("Payload:", JSON.stringify(payload, null, 2))

  // ✅ Check 24h window
  const now = Date.now() / 1000
  if (lastInteraction && now - lastInteraction > 86400) {
    alert("⚠️ Cannot send message outside 24h window")
    return
  }

  const res = await fetch(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  )

  const resText = await res.text()
  console.log("🔎 Facebook API response:", res.status, resText)

  if (!res.ok) {
    throw new Error(`Facebook API error: ${res.status} ${resText}`)
  }
}


// 🔹 Main function: send message from ReplyBar
export async function sendReplyBarMessage(
  pageId: string,
  conversation: Conversation,
  text: string,
  msg?: {
    sender?: string
    text?: string
    imageUrl?: string
    videoUrl?: string
    audioUrl?: string
  }
) {
  if (!conversation || !pageId) return
  if (!text.trim() && !msg?.imageUrl && !msg?.videoUrl && !msg?.audioUrl) return

  const msgsRef = ref(
    db,
    `khmer-ai-chat/pages/${pageId}/conversations/${conversation.user_id}/messages`
  )

  const newMsg = {
    sender: msg?.sender || "agent",
    text: msg?.text || text || "",
    imageUrl: msg?.imageUrl || null,
    videoUrl: msg?.videoUrl || null,
    audioUrl: msg?.audioUrl || null,
    timestamp: Date.now() / 1000,
    uploaded_at: serverTimestamp(),
  }

  await push(msgsRef, newMsg)

  const convRef = ref(db, `khmer-ai-chat/pages/${pageId}/conversations/${conversation.user_id}`)
  await update(convRef, {
    state: "AGENT_HANDLING",
    updatedAt: Date.now() / 1000,
  })

  const tokenSnap = await get(ref(db, `khmer-ai-chat/pages/${pageId}/meta/page_access_token`))
  const pageAccessToken = tokenSnap.exists() ? tokenSnap.val() : null

  if (pageAccessToken) {
    try {
      const lastInteraction =
        conversation.lastReadTimestamp ||
        conversation.lastReadCommentTimestamp ||
        conversation.timestamp ||
        0

      await sendMessageViaFacebook(
        pageAccessToken,
        conversation.user_id,
        {
          text: newMsg.text,
          imageUrl: newMsg.imageUrl || undefined,
          videoUrl: newMsg.videoUrl || undefined,
          audioUrl: newMsg.audioUrl || undefined,
        },
        lastInteraction
      )
      console.log("✅ Delivered message via Facebook API:", newMsg)
    } catch (err) {
      console.error("❌ Failed to deliver via Facebook API:", err)
    }
  } else {
    console.warn("⚠️ No page access token found, cannot deliver via Facebook API")
  }
}
