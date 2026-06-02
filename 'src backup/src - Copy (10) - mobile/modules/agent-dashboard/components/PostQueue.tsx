import type { Conversation } from "~/modules/nodes/types"

interface PostQueueProps {
  posts: Conversation[]
  onSelect: (conv: Conversation) => void
  activePostId: string | null
}

export function PostQueue({ posts, onSelect, activePostId }: PostQueueProps) {
  const postConvs = posts.filter(c => c.type === "post")

  return (
    <div className="flex-grow overflow-y-auto p-2 scrollbar-dark-teal space-y-4">
      {postConvs.map(conv => {
        const postId = Object.keys(conv.posts || {})[0]
        const postMeta = conv.posts?.[postId]?.post
        const isActive = conv.id === activePostId

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`card-dark w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
              isActive ? "bg-teal-800" : "bg-dark-700 hover:bg-dark-600"
            }`}
          >
            {/* Post header */}
            {postMeta?.image && (
              <img
                src={postMeta.image}
                alt={postMeta.title}
                className="h-8 w-8 rounded object-cover"
              />
            )}
            <div className="flex flex-col overflow-hidden flex-grow">
              <span className="text-white font-semibold truncate">{postMeta?.title}</span>
              <a
                href={postMeta?.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-khmer-primary hover:underline truncate"
              >
                View Post
              </a>
            </div>
            <span className="ml-auto text-xs bg-khmer-primary text-white px-2 py-1 rounded">
              {conv.status}
            </span>
          </button>
        )
      })}
    </div>
  )
}
