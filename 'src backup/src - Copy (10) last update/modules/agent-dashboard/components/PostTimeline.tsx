import type { PostConversation } from "~/modules/nodes/types"

interface PostTimelineProps {
  post: PostConversation | null
}

export function PostTimeline({ post }: PostTimelineProps) {
  if (!post) {
    return (
      <div className="flex items-center justify-center h-full text-light-400">
        Select a post
      </div>
    )
  }

  const postId = Object.keys(post.posts || {})[0]
  const postMeta = post.posts?.[postId]?.post
  const comments = post.posts?.[postId]?.comments || {}

  return (
    <div className="flex flex-col h-full bg-dark-900">
      {/* Post header */}
      {postMeta && (
        <div className="p-3 border-b border-khmer-primary flex items-center gap-2">
          {postMeta.image && (
            <img
              src={postMeta.image}
              alt={postMeta.title}
              className="h-10 w-10 rounded object-cover"
            />
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-white font-semibold truncate">{postMeta.title}</span>
            <a
              href={postMeta.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-khmer-primary hover:underline truncate"
            >
              View Post
            </a>
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3 scrollbar-dark-teal">
        {Object.values(comments).map(c => (
          <div key={c.id} className="card-dark">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-white">{c.userName}</span>
              <span className="text-xs text-light-400">
                {new Date(c.timestamp * 1000).toLocaleString()}
              </span>
            </div>
            <div className="text-sm">{c.text}</div>
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-khmer-primary flex items-center gap-2">
        <input
          type="text"
          placeholder="Reply to post comments..."
          className="flex-grow input"
        />
        <button className="btn-primary">Reply</button>
      </div>
    </div>
  )
}
