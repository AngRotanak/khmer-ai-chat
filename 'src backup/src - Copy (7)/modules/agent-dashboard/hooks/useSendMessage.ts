import { ref, push, update, serverTimestamp } from "firebase/database"
import { db } from "~/lib/firebase"
import type { Conversation } from '~/modules/nodes/types'

export async function sendMessage(
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
  // If no text and no media, do nothing
  if (!text.trim() && !msg?.imageUrl && !msg?.videoUrl && !msg?.audioUrl) return

  const msgsRef = ref(
    db,
    `khmer-ai-chat/pages/${pageId}/conversations/${conversation.user_id}/messages`
  )

  // Build message payload
  const newMsg = {
    sender: msg?.sender || "agent",
    text: msg?.text || text || "",
    imageUrl: msg?.imageUrl || null,
    videoUrl: msg?.videoUrl || null,
    audioUrl: msg?.audioUrl || null,
    timestamp: Date.now() / 1000,
    uploaded_at: serverTimestamp(),
  }

  // 1️⃣ Store agent message in Firebase
  await push(msgsRef, newMsg)

  // 2️⃣ Auto-transition state to AGENT_HANDLING
  const convRef = ref(db, `khmer-ai-chat/pages/${pageId}/conversations/${conversation.user_id}`)
  await update(convRef, {
    state: "AGENT_HANDLING",
    updatedAt: Date.now() / 1000,
  })

  // 3️⃣ Deliver to Messenger via backend webhook
  const webhookUrl = "https://cb05-136-228-130-3.ngrok-free.app"

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      send_message_handler: true,
      page_id: pageId,
      user_id: conversation.user_id,
      text: newMsg.text,
      imageUrl: newMsg.imageUrl,
      videoUrl: newMsg.videoUrl,
      audioUrl: newMsg.audioUrl,
    }),
  })
}
