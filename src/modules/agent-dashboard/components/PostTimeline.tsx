import { Virtuoso } from "react-virtuoso"
import { useState, useMemo, useRef } from "react"
import type { Comment, PostData } from "~/modules/nodes/types"
import { useEffect, useCallback } from "react"
import { PostReplyBar } from "../components/PostReplyBar"
import { ReplyHelpers } from "../components/ReplyHelpers"
import { LinkIcon } from "@heroicons/react/24/outline"
import * as Dialog from '@radix-ui/react-dialog' // Radix
import { normalizeComments } from "~/utils/normalize"

export function PostTimeline({
  post,
  pageToken,
  onSendCommentReply,
  setViewMode,
  commentOrigins,   // 🔹 new prop
}: {
  post: PostData
  pageToken: string
  onSendCommentReply: (
    msg: string,
    targets: { commentId: string; postId: string; convId: string }[],
    pageToken: string
  ) => void

  setViewMode: (mode: "queue" | "timeline") => void
  commentOrigins: Record<string, { convId: string; convName?: string }>
}) {

  const virtuosoRef = useRef<any>(null)
  const helpersRef = useRef<HTMLDivElement>(null)
  const [selectedComments, setSelectedComments] = useState<string[]>([])
  const [draft, setDraft] = useState("")
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)
  const [replyingTo, setReplyingTo] = useState<{ comment: Comment; postId: string; postTitle?: string } | null>(null)
  const [showUnansweredOnly, setShowUnansweredOnly] = useState(false)
  const [showHelpers, setShowHelpers] = useState(false)
  const [expandedCommentIds, setExpandedCommentIds] = useState<Set<string>>(new Set())
  const [drawerOpen, setDrawerOpen] = useState(false)

  type TimelineItem =
    | { type: "post"; post: PostData }
    | { type: "comment"; comment: Comment; postId: string; postTitle?: string }
    | { type: "reply"; reply: Comment; parentId: string }



  function flattenPost(post: PostData | undefined): TimelineItem[] {
    if (!post) {
      console.log("⚠️ flattenPost called with undefined post")
      return []
    }
    console.log("🔹 flattenPost input:", post)


    const items: TimelineItem[] = []
    items.push({ type: "post", post })

    // ✅ Always normalize comments
    const commentsArray: Comment[] = Array.isArray(post.comments)
      ? post.comments
      : normalizeComments(post.comments ?? {}, Date.now() / 1000)

    console.log("🔹 flattenPost commentsArray length:", commentsArray.length)

    const sortedComments = commentsArray.sort(
      (a, b) => Number(b.timestamp ?? 0) - Number(a.timestamp ?? 0)
    )

    sortedComments.forEach(comment => {
      console.log("🔹 flattenPost comment:", comment)
      const normalizedComment: Comment = {
        ...comment,
        id: comment.id ?? "",
        status: comment.status ?? "unanswered",
        replies: comment.replies ?? [],
      }

      items.push({
        type: "comment",
        comment: normalizedComment,
        postId: post.id,
        postTitle: post.post?.title ?? "Untitled Post",
      })

      // ✅ Normalize replies too
      const repliesArray: Comment[] = Array.isArray(normalizedComment.replies)
        ? normalizedComment.replies
        : normalizeComments(normalizedComment.replies ?? {}, Date.now() / 1000)

      const sortedReplies = repliesArray.sort(
        (a, b) => Number(b.timestamp ?? 0) - Number(a.timestamp ?? 0)
      )

      sortedReplies.forEach(r => {
        items.push({
          type: "reply",
          reply: { ...r, id: r.id ?? "", status: r.status ?? "unanswered" },
          parentId: normalizedComment.id,
        })
      })
    })

    return items
  }


  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(() =>
    flattenPost(post)
  )

  useEffect(() => {
    console.log("🔹 PostTimeline useEffect triggered with post:", post)
    const flattened = flattenPost(post)
    console.log("🔹 Flattened timelineItems length:", flattened.length)
    setTimelineItems(flattened)
  }, [post])


  const prevLength = useRef(0)

  useEffect(() => {
    if (timelineItems.length > prevLength.current) {
      // only scroll when new items are added
      virtuosoRef.current?.scrollToIndex({ index: 0, align: "start" })
    }
    prevLength.current = timelineItems.length
  }, [timelineItems])

  // ✅ Hide helpers when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (helpersRef.current && !helpersRef.current.contains(event.target as Node)) {
        setShowHelpers(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [])



  useEffect(() => {
    setTimelineItems(prev => {
      const fresh = flattenPost(post)   // 🔹 flatten only the selected post
      return fresh.map(item => {
        if (item.type === "comment") {
          const existing = prev.find(
            p => p.type === "comment" && p.comment.id === item.comment.id
          ) as { type: "comment"; comment: Comment } | undefined

          if (existing) {
            return {
              ...item,
              comment: {
                ...item.comment,
                status: existing.comment.status ?? item.comment.status ?? "unanswered"
              }
            }
          }
        }
        return item
      })
    })
  }, [post])


  const toggleSelect = (
    id: string,
    comment: Comment,
    index: number,
    event?: React.MouseEvent,
    postId?: string,
    postTitle?: string
  ) => {
    if (event?.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      const rangeIds = timelineItems
        .slice(start, end + 1)
        .filter(i => i.type === "comment")
        .map(i => (i as { type: "comment"; comment: Comment }).comment.id!)

      setSelectedComments(prev => {
        const newSet = new Set(prev)
        rangeIds.forEach(rid => newSet.add(rid))
        return Array.from(newSet)
      })
    } else {
      setSelectedComments(prev =>
        prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
      )
      setLastSelectedIndex(index)
    }

    setReplyingTo({
      comment,
      postId: postId ?? "",
      postTitle,
    })
  }


  // const handleSendCommentReply_old = useCallback(
  //   (commentId: string, msg: string, pageToken: string) => {
  //     const postId = post.id

  //     const targets =
  //       selectedComments.length > 0
  //         ? selectedComments.map(id => ({
  //           commentId: id,
  //           postId,
  //           convId: commentOrigins[id]?.convId ?? "" // ✅ include convId
  //         }))
  //         : [{
  //           commentId,
  //           postId,
  //           convId: commentOrigins[commentId]?.convId ?? "" // ✅ include convId
  //         }]

  //     console.log("➡️ Sending reply with context:", { targets })

  //     onSendCommentReply(msg, targets, pageToken)

  //     setTimelineItems(prev =>
  //       prev.map(item =>
  //         item.type === "comment" &&
  //           targets.some(t => t.commentId === item.comment.id!)
  //           ? { ...item, comment: { ...item.comment, status: "answered" } }
  //           : item
  //       )
  //     )

  //     setReplyingTo(null)
  //     setDraft("")
  //     setSelectedComments([])
  //   },
  //   [post.id, selectedComments, onSendCommentReply, commentOrigins]
  // )

  const handleSendCommentReply = useCallback(
    (msg: string, targets: { commentId: string; postId: string }[], pageToken: string) => {
      const postId = post.id

      // 🔹 Build targets from selectedComments if any, otherwise use the passed-in targets
      const finalTargets =
        selectedComments.length > 0
          ? selectedComments.map(id => ({
            commentId: id,
            postId,
            convId: commentOrigins[id]?.convId ?? ""
          }))
          : targets.map(t => ({
            ...t,
            convId: commentOrigins[t.commentId]?.convId ?? ""
          }))

      console.log("➡️ Sending reply with context:", finalTargets)
      onSendCommentReply(msg, finalTargets, pageToken)

      setTimelineItems(prev =>
        prev.map(item =>
          item.type === "comment" &&
            finalTargets.some(t => t.commentId === item.comment.id!)
            ? { ...item, comment: { ...item.comment, status: "answered" } }
            : item
        )
      )

      setReplyingTo(null)
      setDraft("")
      setSelectedComments([])
    },
    [post.id, selectedComments, onSendCommentReply, commentOrigins]
  )




  const filteredItems = useMemo(() => {
    if (!showUnansweredOnly) return timelineItems
    const answeredIds = new Set<string>(
      timelineItems
        .filter(
          (i): i is { type: "comment"; comment: Comment; postId: string; postTitle?: string } =>
            i.type === "comment" && i.comment.status === "answered" && !!i.comment.id
        )
        .map(i => i.comment.id!)
    )
    return timelineItems.filter(item => {
      if (item.type === "comment") return item.comment.status !== "answered"
      if (item.type === "reply") return !answeredIds.has(item.parentId ?? "")
      return true
    })
  }, [timelineItems, showUnansweredOnly])

  const replyCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    timelineItems.forEach(item => {
      if (item.type === "reply") {
        const parentId = item.parentId ?? ""
        counts[parentId] = (counts[parentId] ?? 0) + 1
      }
    })
    return counts
  }, [timelineItems])


  return (
    <div className="flex flex-col flex-grow bg-dark-900 relative">
      {/* Header */}
      <div className="p-2 border-b border-teal-700 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-shrink">
          <button
            onClick={() => setViewMode("queue")}
            className="flex items-center text-light-300 hover:text-teal-400 sm:hidden"
            title="Back to queue"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {post.post?.image ? (
            <img
              src={post.post.image}
              alt={post.post.title ?? "Post"}
              className="w-8 h-8 rounded object-cover ml-2"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-dark-700 flex items-center justify-center text-xs ml-2">?</div>
          )}


          <span className="ml-2 text-light-100 text-sm font-semibold truncate max-w-[60vw]">
            {post.post?.title ?? "Untitled Post"}
          </span>

        </div>

        <label className="flex items-center gap-2 text-xs text-light-300">
          <input
            type="checkbox"
            checked={showUnansweredOnly}
            onChange={() => setShowUnansweredOnly(!showUnansweredOnly)}
          />
          Unanswered
        </label>
      </div>



      {/* Timeline body */}
      <div className="flex flex-col flex-grow h-0">
        {(() => {
          console.log("🔹 PostTimeline rendering, timelineItems:", timelineItems.length, timelineItems)
          console.log("🔹 filteredItems length:", filteredItems.length, filteredItems)
          return null
        })()}

        {timelineItems.length === 0 ? (
          <div className="text-light-50 text-sm px-3 py-2">No comments yet…</div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            style={{ height: "100%", width: "100%" }}
            data={filteredItems}
            initialTopMostItemIndex={0}
            itemContent={(index, item) => {
              if (item.type === "post") {
                const post = item.post
                return (
                  <div key={post.id} className="space-y-4 px-3 py-2">
                    {post.post && (
                      <div className="p-3 border-b border-khmer-primary flex items-center gap-3 rounded-md bg-dark-800">
                        {post.post.image && (
                          <img
                            src={post.post.image}
                            alt={post.post.title ?? "Post"}
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex flex-col">
                          <span className="text-white font-semibold text-base">
                            {post.post?.title ?? "Untitled Post"}
                          </span>
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
                  </div>
                )
              }

              if (item.type === "comment") {
                const c = item.comment
                const isSelected = selectedComments.includes(c.id ?? "")
                const isExpanded = expandedCommentIds.has(c.id ?? "")
                const replyCount = replyCounts[c.id ?? ""] ?? 0
                const isAnswered = c.status === "answered"

                return (
                  <div
                    key={c.id}
                    onClick={(e) =>
                      toggleSelect(c.id ?? "", c, index, e, item.postId, item.postTitle)
                    }
                    className={`flex items-start gap-2 px-3 py-2 border-b border-dark-800 cursor-pointer ${isSelected ? "bg-dark-700" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="mr-2 pointer-events-none"
                    />
                    <div className="flex flex-col flex-1">
                      <div className="text-light-400 text-xs mb-1">
                        {c.userName ?? "Unknown"} • {formatTimestamp(c.timestamp)}
                        {commentOrigins[c.id] && (
                          <span className="ml-2 text-khmer-primary">
                            ({commentOrigins[c.id].convName ?? commentOrigins[c.id].convId})
                          </span>
                        )}
                      </div>
                      <div className="text-white">{c.text ?? ""}</div>

                      {isAnswered && (
                        <span className="text-green-400 text-xs mt-1">✅ Answered</span>
                      )}

                      {replyCount > 0 &&
                        (!isExpanded ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedCommentIds((prev) => {
                                const newSet = new Set(prev)
                                newSet.add(c.id ?? "")
                                return newSet
                              })
                            }}
                            className="text-xs text-teal-400 hover:underline mt-1"
                          >
                            Show replies ({replyCount})
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedCommentIds((prev) => {
                                const newSet = new Set(prev)
                                newSet.delete(c.id ?? "")
                                return newSet
                              })
                            }}
                            className="text-xs text-teal-400 hover:underline mt-1"
                          >
                            Hide replies ({replyCount})
                          </button>
                        ))}
                    </div>
                  </div>
                )
              }

              if (item.type === "reply") {
                const r = item.reply
                const parentExpanded = expandedCommentIds.has(item.parentId ?? "")
                if (!parentExpanded) {
                  return <div style={{ height: 1 }} data-hidden-reply={r.id} />
                }

                return (
                  <div key={r.id} className="space-y-2 ml-6 px-3 py-1">
                    <div className="p-2 rounded-lg bg-dark-900 hover:bg-dark-800 transition flex justify-between items-center">
                      <div className="flex flex-col flex-1">
                        <div className="text-light-400 text-xs mb-1">
                          {r.userName ?? "Unknown"} • {formatTimestamp(r.timestamp)}
                        </div>
                        <div className="text-teal-400 whitespace-pre-line">{r.text ?? ""}</div>
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
                  </div>
                )
              }

              console.warn("⚠️ Unknown item type", item)
              return <div style={{ height: 1 }} data-unknown />
            }}
          />
        )}
      </div>


      {/* Mobile FAB + Drawer */}
      <div className="md:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="fixed bottom-10 right-4 bg-teal-600 text-white rounded-full shadow-lg px-4 py-3 text-sm font-semibold hover:bg-teal-500"
        >
          Reply
        </button>

        <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
          <Dialog.Overlay />
          <Dialog.Content>
            <div className="flex flex-col h-full bg-dark-900 border-t border-dark-600">

              {/* Drawer header with small exit button */}
              <div className="flex justify-end p-2 border-b border-dark-600">
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-full text-light-400 hover:text-white hover:bg-dark-700 transition"
                  aria-label="Close drawer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Helpers + toggle at top */}
              <div className="flex flex-col items-center">
                <div
                className={`transition-all duration-300 ease-in-out ${showHelpers
                  ? "opacity-100 translate-y-0 max-h-40"
                  : "opacity-0 translate-y-2 max-h-0 overflow-hidden"
                  }`}
              >
                <ReplyHelpers
                  setDraft={setDraft}
                  activeComment={replyingTo?.comment}
                />
              </div>

                {/* Toggle button spaced below helpers */}
                <div className="flex justify-center mt-9">
                  <button
                    onClick={() => setShowHelpers(!showHelpers)}
                    className="appearance-none bg-transparent border-none outline-none cursor-pointer text-light-400 hover:text-teal-400 transition-transform duration-300"
                    aria-label="Toggle reply helpers"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 transform transition-transform duration-300 ${showHelpers ? "rotate-180" : "rotate-0"
                        }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </div>
              </div>

             {/* Reply bar pinned at bottom */}
              <div className="mt-auto">
                <PostReplyBar
                  draft={draft}
                  setDraft={setDraft}
                  pageToken={pageToken}
                  postId={post.id}
                  postTitle={post.post?.title ?? "Untitled Post"}
                  commentId={replyingTo?.comment?.id ?? ""}
                  commentText={replyingTo?.comment?.userName ?? ""}
                  onCancelReply={() => {
                    setReplyingTo(null)
                    setDraft("")
                    setSelectedComments([])
                  }}
                  onSendCommentReply={(msg, targets, pageToken) => {
                    handleSendCommentReply(msg, targets, pageToken)
                    setDrawerOpen(false)

                  }}
                />
              </div>

            </div>
          </Dialog.Content>
        </Dialog.Root>

      </div>


      {/* Desktop helpers + reply bar */}
      <div className="hidden md:block">
        {replyingTo && (
          <>
            {/* Helpers + toggle inline */}
            <div className="bg-dark-900 border-t border-dark-600">
              <div
                className={`transition-all duration-300 ease-in-out ${showHelpers
                  ? "opacity-100 translate-y-0 max-h-40"
                  : "opacity-0 translate-y-2 max-h-0 overflow-hidden"
                  }`}
              >
                <ReplyHelpers
                  setDraft={setDraft}
                  activePost={post}   // ✅ post is PostData
                  activeComment={replyingTo?.comment}
                />
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setShowHelpers(!showHelpers)}
                  className="appearance-none bg-transparent border-none outline-none cursor-pointer text-light-400 hover:text-teal-400 transition-transform duration-300"
                  aria-label="Toggle reply helpers"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transform transition-transform duration-300 ${showHelpers ? "rotate-180" : "rotate-0"
                      }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <PostReplyBar
              draft={draft}
              setDraft={setDraft}
              pageToken={pageToken}
              postId={post.id}
              postTitle={post.post?.title ?? "Untitled Post"}
              commentId={replyingTo?.comment?.id ?? ""}
              commentText={replyingTo?.comment?.userName ?? ""}
              onCancelReply={() => {
                setReplyingTo(null)
                setDraft("")
                setSelectedComments([])
              }}
              onSendCommentReply={handleSendCommentReply}
            />
          </>
        )}
      </div>


    </div>
  )
}

function formatTimestamp(ts?: number | string | Date): string {
  if (!ts) return ""
  const date = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts)
  return date.toLocaleString()
}
