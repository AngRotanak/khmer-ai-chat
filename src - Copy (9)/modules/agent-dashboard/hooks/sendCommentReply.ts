import { ref, set } from "firebase/database"
import { db } from "~/lib/firebase"

/**
 * Send a reply to a Facebook comment and store it in Firebase.
 */
export async function sendCommentReply(
  commentId: string,
  message: string,
  pageToken: string,
  pageId: string,
  userId: string,
  postId: string
) {
  if (!message.trim()) return

  try {
    // 1. Post reply to Facebook
    const url = `https://graph.facebook.com/v19.0/${commentId}/comments`
    const body = new URLSearchParams({ message: message.trim(), access_token: pageToken })
    const res = await fetch(url, { method: "POST", body })
    const result = await res.json()

    if (!res.ok) {
      console.error("❌ Failed to send comment reply:", result.error || result)
      return
    }

    console.log("✅ Reply sent to Facebook:", result)
    const replyId = result.id

    // 2. Fetch enriched reply with permalink_url
    const replyRes = await fetch(
      `https://graph.facebook.com/v19.0/${replyId}?fields=id,from,message,created_time,permalink_url&access_token=${pageToken}`
    )
    const replyMeta = await replyRes.json()

    if (!replyRes.ok) {
      console.error("❌ Failed to fetch reply metadata:", replyMeta.error || replyMeta)
      return
    }

    // 3. Store enriched reply in Firebase
    const repliesRef = ref(
      db,
      `khmer-ai-chat/pages/${pageId}/conversations/${userId}/posts/${postId}/comments/${commentId}/replies/${replyId}`
    )

    const enrichedReply = {
      id: replyMeta.id,
      userName: replyMeta.from?.name || "Agent",
      text: replyMeta.message,
      timestamp: new Date(replyMeta.created_time).getTime() / 1000,
      sender: "agent",
      permalink: replyMeta.permalink_url,
      replies: [],
    }

    await set(repliesRef, enrichedReply)
    console.log("✅ Reply stored in Firebase:", enrichedReply)
  } catch (err) {
    console.error("❌ Unexpected error sending reply:", err)
  }
}
