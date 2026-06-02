import { LinkIcon } from "@heroicons/react/24/outline"
import { useState } from "react"
import type { Comment, PostData } from "~/modules/nodes/types"
import { CommentReplyBar } from "../components/CommentReplyBar"
import { ReplyHelpers } from "../components/ReplyHelpers"

// ✅ Fixed timestamp formatter with debug logs
function formatTimestamp(ts?: string | number | Date) {
  if (!ts) return ""
  let date: Date
  if (typeof ts === "number") {
    // Convert seconds → milliseconds if needed
    date = ts < 1e12 ? new Date(ts * 1000) : new Date(ts)
  } else {
    date = new Date(ts)
  }
  const formatted = date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
  console.log("🕒 Formatting timestamp:", ts, "->", formatted)
  return formatted
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
  const [draft, setDraft] = useState("")
  const [replyingTo, setReplyingTo] = useState<{ comment: Comment; postId: string; postTitle?: string } | null>(null)
  const [showHelpers, setShowHelpers] = useState(false)

  console.log("📜 Rendering CommentTimeline with posts:", posts)

  return (
    <div className="flex flex-col h-full bg-dark-900">
      <div className="flex-grow overflow-y-auto space-y-8">
        {posts.map(post => {
          console.log("🟢 Rendering post:", post.id, post)
          return (
            <div key={post.id} className="space-y-4">
              {post.post && (
                <div className="p-3 border-b border-khmer-primary flex items-center gap-3">
                  {post.post.image && (
                    <img
                      src={post.post.image}
                      alt={post.post.title}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="text-white font-semibold text-base">{post.post.title}</span>
                    {post.post.permalink && (
                      <a
                        href={post.post.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-khmer-primary hover:underline"
                      >
                        View Post
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Comments list */}
              {post.comments?.map((c, idx) => {
                console.log("🟢 Rendering comment:", c)
                return (
                  <div key={c.id ?? `comment-${idx}`} className="space-y-3">
                    <div className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition flex justify-between items-center">
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
                      <button
                        onClick={() => setReplyingTo({ comment: c, postId: post.id, postTitle: post.post?.title })}
                        className="ml-2 text-teal-400 text-sm"
                      >
                        Reply
                      </button>
                    </div>

                    {/* Replies */}
                    {c.replies && c.replies.length > 0 && (
                      <div className="space-y-2 ml-6">
                        {c.replies.map((r, ridx) => {
                          console.log("🟢 Rendering reply:", r)
                          return (
                            <div
                              key={r.id ?? `${c.id}-reply-${ridx}`}
                              className="p-1 rounded-lg bg-dark-900 hover:bg-dark-800 transition flex justify-between items-center"
                            >
                              <div className="flex flex-col flex-1">
                                <div className="text-light-400 text-xs mb-1">
                                  {r.userName ?? "Unknown"} • {formatTimestamp(r.timestamp)}
                                </div>
                                {/* Multi-line reply text */}
                                <div className="text-teal-400 whitespace-pre-line">
                                  {r.text ?? ""}
                                </div>
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
                          )
                        })}
                      </div>
                    )}

                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* ✅ Reply bar when replying */}
      {replyingTo && (
        <CommentReplyBar
          draft={draft}
          setDraft={setDraft}
          pageToken={pageToken}
          postId={replyingTo.postId}
          postTitle={replyingTo.postTitle}
          commentId={replyingTo.comment.id}
          commentText={replyingTo.comment.text}
          onCancelReply={() => {
            setReplyingTo(null)
            setDraft("")
          }}
          onSendCommentReply={onSendCommentReply}
        />
      )}

      {/* ✅ Reply helpers toggle + bar */}
      <div className="sticky bottom-0 bg-dark-900 border-t border-dark-600">
        {showHelpers && replyingTo && (
          <ReplyHelpers
            setDraft={setDraft}
            activeComment={replyingTo.comment}
          />
        )}





        <div className="flex justify-center">
          <button
            onClick={() => setShowHelpers(!showHelpers)}
            className="appearance-none bg-transparent border-none outline-none cursor-pointer text-light-400 hover:text-teal-400 transition-transform duration-300"
            aria-label="Toggle reply helpers"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transform transition-transform duration-300 ${showHelpers ? "rotate-180" : "rotate-0"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
