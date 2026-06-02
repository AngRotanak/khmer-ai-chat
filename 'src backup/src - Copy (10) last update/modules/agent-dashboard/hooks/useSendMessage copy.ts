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
  }
) {
  const payload: any = { recipient: { id: recipientId } }

  if (msg.text) {
    payload.message = { text: msg.text }
  }
  if (msg.imageUrl) {
    payload.message = { attachment: { type: "image", payload: { url: msg.imageUrl } } }
  }
  if (msg.audioUrl) {
    payload.message = { attachment: { type: "audio", payload: { url: msg.audioUrl } } }
  }

  // ✅ Video handling
  if (msg.videoUrl) {
    // Step 1: Check file size
    const headRes = await fetch(msg.videoUrl, { method: "HEAD" })
    const contentLength = headRes.headers.get("content-length")
    const sizeBytes = contentLength ? parseInt(contentLength, 10) : 0
    const sizeMB = sizeBytes / (1024 * 1024)

    if (sizeMB > 25) {
      console.log(`⚠️ Video is ${sizeMB.toFixed(2)} MB, using chunked upload`)

      // Step 2: Start upload session
      const startRes = await fetch(
        `https://graph.facebook.com/v18.0/me/videos?access_token=${pageAccessToken}`,
        {
          method: "POST",
          body: new URLSearchParams({
            upload_phase: "start",
            file_size: String(sizeBytes),
          }),
        }
      )
      const startData = await startRes.json()
      const sessionId = startData.upload_session_id

      // Step 3: Upload chunks
      const chunkSize = 4 * 1024 * 1024 // 4 MB
      const videoRes = await fetch(msg.videoUrl)
      const buffer = await videoRes.arrayBuffer()
      const totalSize = buffer.byteLength

      let startOffset = 0
      while (startOffset < totalSize) {
        const endOffset = Math.min(startOffset + chunkSize, totalSize)
        const chunk = buffer.slice(startOffset, endOffset)

        const formData = new FormData()
        formData.append("upload_phase", "transfer")
        formData.append("upload_session_id", sessionId)
        formData.append("start_offset", String(startOffset))
        formData.append("video_file_chunk", new Blob([chunk]))

        const transferRes = await fetch(
          `https://graph.facebook.com/v18.0/me/videos?access_token=${pageAccessToken}`,
          { method: "POST", body: formData }
        )
        const transferData = await transferRes.json()
        startOffset = parseInt(transferData.start_offset, 10)
      }

      // Step 4: Finish upload
      const finishRes = await fetch(
        `https://graph.facebook.com/v18.0/me/videos?access_token=${pageAccessToken}`,
        {
          method: "POST",
          body: new URLSearchParams({
            upload_phase: "finish",
            upload_session_id: sessionId,
          }),
        }
      )
      const finishData = await finishRes.json()
      const videoId = finishData.video_id

      // Step 5: Send message with video_id
      payload.message = { attachment: { type: "video", payload: { video_id: videoId } } }
    } else {
      // Small video: direct URL
      payload.message = { attachment: { type: "video", payload: { url: msg.videoUrl } } }
    }
  }

  // ✅ Send message
  const res = await fetch(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Facebook API error: ${res.status} ${errText}`)
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

  const msgsRef = ref(db, `khmer-ai-chat/pages/${pageId}/conversations/${conversation.user_id}/messages`)

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
    await sendMessageViaFacebook(pageAccessToken, conversation.user_id, {
      text: newMsg.text,
      imageUrl: newMsg.imageUrl || undefined,
      videoUrl: newMsg.videoUrl || undefined,
      audioUrl: newMsg.audioUrl || undefined,
    })
    console.log("✅ Delivered message via Facebook API:", newMsg)
  } else {
    console.warn("⚠️ No page access token found, cannot deliver via Facebook API")
  }
}
