import { LinkIcon } from "@heroicons/react/24/outline"
import type { Comment, PostData } from "~/modules/nodes/types"

function formatTimestamp(ts?: string | number | Date) {
  if (!ts) return ""
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function CommentTimeline({
  posts = [],
  pageToken,
  onSendCommentReply,
}: {
  posts?: PostData[]
  pageToken: string
  onSendCommentReply: (
    commentId: string,
    msg: string,
    pageToken: string,
    postId: string
  ) => void
}) {
  return (
     <div className="w-full md:flex-grow flex flex-col h-full bg-dark-900">
      {posts.map(post => (
        <div key={post.id} className="space-y-5">
          {/* Post card */}
          {post.post && (
            <a
              href={post.post.permalink ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-lg bg-dark-900 shadow-sm hover:bg-dark-800 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-light-400 text-xs uppercase tracking-wide mb-1">Post</div>
                  <div className="text-white font-semibold">{post.post.title}</div>
                  {post.post.image && (
                    <img
                      src={post.post.image}
                      alt="Post"
                      className="mt-1 rounded-lg object-cover w-full max-w-45"
                    />
                  )}
                </div>
                <LinkIcon className="h-5 w-5 text-light-400 hover:text-teal-400 shrink-0" />
              </div>
            </a>
          )}

          {/* Comments list */}
          {post.comments?.map((c, idx) => (
            <div key={c.id ?? `comment-${idx}`} className="space-y-3">
              <div
                className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition flex justify-between items-center"
                onClick={() =>
                  c.id && post.id && onSendCommentReply(c.id, "reply text here", pageToken, post.id)
                }
              >
                <div className="flex flex-col flex-1 cursor-pointer">
                  <div className="text-light-400 text-xs mb-1">
                    {c.userName ?? "Unknown"} • {formatTimestamp(c.timestamp)}
                  </div>
                  <div className="text-white">{c.text ?? ""}</div>
                </div>

                {c.permalink ? (
                  <a
                    href={c.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-light-400 hover:text-teal-400 shrink-0"
                    title="Open comment on Facebook"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="ml-2 text-red-500">no permalink</span>
                )}
              </div>

{/* Replies */}
{c.replies && c.replies.length > 0 && (
  <div className="space-y-2 ml-6">
    {c.replies.map((r, ridx) => (
      <div
        key={r.id ?? `${c.id}-reply-${ridx}`}
        className="p-1 rounded-lg bg-dark-900 hover:bg-dark-800 transition flex justify-between items-center"
      >
        <div className="flex flex-col flex-1">
          <div className="text-light-400 text-xs mb-1">
            {r.userName ?? "Unknown"} • {formatTimestamp(r.timestamp)}
          </div>
          <div className="text-teal-400">{r.text ?? ""}</div>
        </div>
        {r.permalink && (
          <a
            href={r.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-light-400 hover:text-teal-400"
            title="Open reply on Facebook"
            onClick={(e) => e.stopPropagation()}
          >
            <LinkIcon className="h-4 w-4" />
          </a>
        )}
      </div>
    ))}
  </div>
)}

            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
