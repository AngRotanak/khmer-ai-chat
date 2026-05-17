import type { Comment, PostData } from "~/modules/nodes/types"

export function normalizeReplies(rawReplies: any): Comment[] {
  if (!rawReplies) return []
  return Object.entries(rawReplies).map(([id, r]: any) => ({
    id,
    userName: r.userName,
    text: r.text,
    timestamp: r.timestamp ?? Date.now() / 1000,
    permalink: r.permalink,
    replies: normalizeReplies(r.replies), // recursive
  }))
}

export function normalizeComments(rawComments: any): Comment[] {
  if (!rawComments) return []
  return Object.entries(rawComments).map(([id, c]: any) => ({
    id,
    userName: c.userName,
    text: c.text,
    timestamp: c.timestamp ?? Date.now() / 1000,
    permalink: c.permalink,
    parent_id: c.parent_id,
    post_id: c.post_id,
    replies: normalizeReplies(c.replies),
  }))
}

export function normalizePosts(postsData: any): PostData[] {
  return Object.entries(postsData || {}).map(([postId, postData]: any) => ({
    id: postId,
    post: postData.post || { id: postId, title: "Untitled" },
    comments: normalizeComments(postData.comments),
  }))
}
