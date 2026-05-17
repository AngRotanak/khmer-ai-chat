import type { Comment, PostData } from "~/modules/nodes/types"

export interface Cluster {
  id: string
  commentIds: string[]
  status?: 'unanswered' | 'answered'
}

interface RawComment {
  id?: string
  userName?: string
  text?: string
  timestamp?: number | string | Date
  permalink?: string
  replies?: Record<string, RawComment>
  priority?: "normal" | "high" | "urgent"
  status?: "unanswered" | "answered"
}

interface RawPost {
  post?: {
    id: string
    title: string
    image?: string
    permalink?: string
  }
  comments?: Record<string, RawComment>
  clusters?: Record<string, Cluster>
  priority?: "normal" | "high" | "urgent"
  meta?: {
    lastReadTimestamp?: number
  }
}


export function normalizeComments(
  rawComments: Record<string, RawComment> | RawComment[] | null = {},
  fallbackTimestamp: number = Date.now() / 1000
): Comment[] {
  if (!rawComments) return []

  // If Firebase gave us an array already
  if (Array.isArray(rawComments)) {
    return rawComments.map((c: any, idx) => ({
      id: String(c.id ?? idx),
      userName: c.userName ?? "",
      text: c.text ?? "",
      timestamp: c.timestamp ?? fallbackTimestamp,
      permalink: c.permalink ?? "",
      replies: normalizeReplies(c.replies),
      priority: c.priority ?? "normal",
      status: c.status ?? "unanswered",
    }))
  }

  // Otherwise treat it as an object map
  return Object.entries(rawComments).map(([id, c]) => ({
    id: String(id),
    userName: c.userName ?? "",
    text: c.text ?? "",
    timestamp: c.timestamp ?? fallbackTimestamp,
    permalink: c.permalink ?? "",
    replies: normalizeReplies(c.replies),
    priority: c.priority ?? "normal",
    status: c.status ?? "unanswered",
  }))
}





export function normalizeReplies(rawReplies: Record<string, RawComment> = {}): Comment[] {
  return Object.entries(rawReplies).map(([id, r]): Comment => ({
    id: String(id),
    userName: r.userName ?? "",
    text: r.text ?? "",
    timestamp: r.timestamp ?? Date.now() / 1000,
    permalink: r.permalink ?? "",
    replies: normalizeReplies(r.replies),
    priority: r.priority ?? "normal",
    status: r.status ?? "unanswered",
  }))
}

export function normalizePosts(postsData: Record<string, RawPost> = {}): PostData[] {
  return Object.entries(postsData).map(([postId, postData]): PostData => {
    const comments = normalizeComments(postData.comments ?? {})

    // ✅ If Firebase stored a meta.lastReadTimestamp, use it
    const lastReadTimestamp = postData.meta?.lastReadTimestamp ?? 0

    // ✅ Count unread comments
    const unreadCommentCount = comments.filter(
      c => Number(c.timestamp) > lastReadTimestamp
    ).length

    return {
      id: String(postId),
      post: postData.post ?? { id: String(postId), title: "Untitled" },
      comments,
      clusters: postData.clusters ? Object.values(postData.clusters) : [],
      priority: postData.priority ?? "normal",
      lastReadTimestamp,
      unreadCommentCount,
    }
  })
}
