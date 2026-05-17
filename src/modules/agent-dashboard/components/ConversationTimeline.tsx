import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { Conversation } from "~/modules/nodes/types"
import { takeOverConversation, returnToBot, closeConversation } from "../hooks/conversationActions"
import { ReplyBar } from "./ReplyBar"
import { sendReplyBarMessage } from "../hooks/useSendMessage"
import { ReplyHelpers } from "../components/ReplyHelpers"   // ✅ import helpers
import { useLocalizedMessage } from "../hooks/useLocalizedMessage"
import { Virtuoso } from "react-virtuoso"
import type { VirtuosoHandle } from "react-virtuoso"


interface ConversationTimelineProps {
  conversation: Conversation | null
  currentPageId: string
  setViewMode: (mode: "queue" | "timeline") => void
}

export function ConversationTimeline({
  conversation,
  currentPageId,
  setViewMode,
}: ConversationTimelineProps) {
  const helpersRef = useRef<HTMLDivElement>(null)
  const [showHelpers, setShowHelpers] = useState(false)
  const { previewMessage, sendMessage } = useLocalizedMessage(currentPageId, conversation)

  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const [preview, setPreview] = useState<{ type: string; text: string } | null>(null)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])

  const [lightboxVideos] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [lightboxType, setLightboxType] = useState<"image" | "video" | null>(null)
  const [draft, setDraft] = useState("")


  const handlePreview = async (type: "takeover" | "return" | "close") => {
    const text = await previewMessage(type)
    setPreview({ type, text })
  }

  // Hide helpers when clicking outside
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

  if (!conversation) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-light-400">
        <span className="text-sm">Select a conversation</span>
      </div>
    )
  }

  // Normalize messages
  const messages = Array.isArray(conversation.messages) ? conversation.messages : []
  const normalizedMessages = (messages as any[]).map((m, idx) => ({
    id: m.id ?? `msg-${idx}-${Date.now()}`,
    type: "message" as const,
    sender: m.sender,
    text: m.text ?? "",
    imageUrl: m.imageUrl ?? null,
    videoUrl: m.videoUrl ?? null,
    audioUrl: m.audioUrl ?? null,
    images: m.images || [],
    videos: m.videos || [],
    audios: m.audios || [],
    timestamp: Number(m.timestamp) || Math.floor(Date.now() / 1000),
  }))

  // Normalize flowLogs
  const flowLogs = Array.isArray(conversation?.flowLogs)
    ? conversation.flowLogs
    : Object.values(conversation?.flowLogs || {})

  const normalizedLogs = (flowLogs as any[]).map((l, idx) => ({
    id: l.id ?? `flow-${idx}-${Date.now()}`,
    type: "flow" as const,
    name: l.name ?? "Unknown",
    timestamp: Number(l.timestamp) || Math.floor(Date.now() / 1000),
  }))

  const timeline = [...normalizedMessages, ...normalizedLogs].sort((a, b) => {
    const timeDiff = a.timestamp - b.timestamp
    if (timeDiff !== 0) return timeDiff
    return (a.id ?? "").localeCompare(b.id ?? "")
  })

  // Esc shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setViewMode("queue")
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [setViewMode])

  useLayoutEffect(() => {
    if (timeline.length > 0) {
      setTimeout(() => {
        if (virtuosoRef.current) {
          virtuosoRef.current.scrollToIndex({
            index: timeline.length - 1,
            align: "end",
            behavior: "smooth",
          })
        }
      }, 0)
    }
  }, [conversation?.id, timeline.length])

  const handleSend = (
    pageId: string,
    conv: Conversation,
    msg: string,
    extra?: any
  ) => {
    // ✅ unify with ReplyBar
    sendReplyBarMessage(pageId, conv, msg, extra)
    setDraft("")
  }

  return (
    <div className="flex flex-col h-full bg-dark-900">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 px-3 py-2 border-b border-dark-600 bg-dark-900 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        {/* Row 1: back (mobile only) + avatar + name + status */}
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

          {conversation.avatar ? (
            <img
              src={conversation.avatar}
              alt={conversation.customerName || "User"}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-xs">?</div>
          )}

          <span className="font-bold truncate max-w-[120px] sm:max-w-[200px]">
            {conversation.customerName || conversation.user_id}
          </span>

          <span
            className={`ml-2 px-2 py-0.5 rounded text-xs whitespace-nowrap ${conversation.status === "Waiting"
              ? "bg-yellow-700 text-yellow-200"
              : conversation.status === "Agent active"
                ? "bg-teal-700 text-teal-200"
                : conversation.status === "Bot active"
                  ? "bg-blue-700 text-blue-200"
                  : conversation.status === "Pending"
                    ? "bg-purple-700 text-purple-200"
                    : "bg-gray-700 text-gray-200"
              }`}
          >
            {conversation.status}
          </span>
        </div>

        {/* Row 2 on mobile, inline on desktop */}
        <div className="mt-2 sm:mt-0 flex gap-2 sm:ml-auto">
          {/* Action buttons */}
          <div className="relative">
            <button
              className="px-2 py-1 bg-teal-700 rounded text-xs sm:text-sm"
              onClick={() => {
                takeOverConversation(currentPageId, conversation)
                sendMessage("takeover")
              }}
              onMouseEnter={() => handlePreview("takeover")}
              onMouseLeave={() => setPreview(null)}
            >
              Take Over
            </button>
            {preview?.type === "takeover" && (
              <div className="absolute mt-1 p-2 bg-dark-700 text-light-100 text-xs rounded shadow-lg w-64">
                {preview.text}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              className="px-2 py-1 bg-dark-600 rounded text-xs sm:text-sm"
              onClick={() => {
                returnToBot(currentPageId, conversation)
                sendMessage("return")
              }}
              onMouseEnter={() => handlePreview("return")}
              onMouseLeave={() => setPreview(null)}
            >
              Return to Bot
            </button>
            {preview?.type === "return" && (
              <div className="absolute mt-1 p-2 bg-dark-700 text-light-100 text-xs rounded shadow-lg w-64">
                {preview.text}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              className="px-2 py-1 bg-red-700 rounded text-xs sm:text-sm"
              onClick={() => {
                closeConversation(currentPageId, conversation)
                sendMessage("close")
              }}
              onMouseEnter={() => handlePreview("close")}
              onMouseLeave={() => setPreview(null)}
            >
              Close Conversation
            </button>
            {preview?.type === "close" && (
              <div className="absolute mt-1 p-2 bg-dark-700 text-light-100 text-xs rounded shadow-lg w-64">
                {preview.text}
              </div>
            )}
          </div>
        </div>

      </header>


      {/* Main content area: timeline + reply bar */}
      <div className="flex flex-col flex-grow h-0">
        {timeline.length === 0 ? (
          <div className="text-light-50 text-sm px-3 py-2">No activity yet…</div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            style={{ height: "100%", width: "100%" }}
            data={timeline}
            initialTopMostItemIndex={timeline.length - 1}
            followOutput="auto"
            itemContent={(index, item) => {
              if (item.type === "message") {
                let bubbleColor = "bg-dark-700"
                let alignment = "justify-start"
                let label = "User"

                if (item.sender === "agent") {
                  bubbleColor = "bg-teal-700"
                  alignment = "justify-end"
                  label = "Agent"
                } else if (item.sender === "system") {
                  bubbleColor = "bg-indigo-700"
                  alignment = "justify-start"
                  label = "Bot"
                } else if (item.sender === "user") {
                  bubbleColor = "bg-dark-700"
                  alignment = "justify-start"
                  label = "User"
                }

                return (
                  <div
                    key={item.id ?? `msg-fallback-${index}`}
                    className={`flex ${alignment} px-3 py-2`}
                  >
                    <div
                      className={`px-3 py-2 rounded-lg max-w-[70%] break-words whitespace-pre-wrap ${bubbleColor}`}
                    >
                      {/* Sender label */}
                      <span className="text-xs text-light-300 block mb-1">{label}</span>

                      {item.text && <p className="text-sm">{item.text}</p>}

                      {/* Single image */}
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt="uploaded"
                          className="rounded-lg mt-1 cursor-pointer w-40 h-40 object-cover"
                          onClick={() => {
                            setLightboxImages([item.imageUrl!])
                            setLightboxIndex(0)
                            setLightboxType("image")
                          }}
                        />
                      )}

                      {/* Multiple images */}
                      {item.images?.length > 0 && (
                        <div className="image-group mt-1 flex flex-wrap gap-2">
                          {item.images.map((url: string, imgIdx: number) => (
                            <img
                              key={`img-${item.id}-${imgIdx}`}
                              src={url}
                              alt={`attachment-${imgIdx}`}
                              className="rounded-lg cursor-pointer w-32 h-32 object-cover"
                              onClick={() => {
                                setLightboxImages(item.images!)
                                setLightboxIndex(imgIdx)
                                setLightboxType("image")
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Single video */}
                      {item.videoUrl && (
                        <div className="mt-1">
                          <video
                            src={item.videoUrl}
                            controls
                            className="rounded-lg w-64 h-40 object-contain shadow-md"
                          />
                          <a
                            href={item.videoUrl}
                            download
                            className="text-xs text-light-300 underline mt-1 block"
                          >
                            ⬇️ Download video
                          </a>
                        </div>
                      )}

                      {/* Multiple videos */}
                      {item.videos?.length > 0 && (
                        <div className="video-group mt-1 flex flex-col gap-2">
                          {item.videos.map((url: string, idx: number) => (
                            <div key={`vid-${item.id}-${idx}`}>
                              <video
                                src={url}
                                controls
                                className="rounded-lg max-w-full shadow-md"
                                style={{ maxHeight: "240px" }}
                              />
                              <a
                                href={url}
                                download
                                className="text-xs text-light-300 underline mt-1 block"
                              >
                                ⬇️ Download video {idx + 1}
                              </a>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Single audio */}
                      {item.audioUrl && (
                        <div className="mt-1">
                          <audio controls src={item.audioUrl} className="w-48" />
                          <a
                            href={item.audioUrl}
                            download
                            className="text-xs text-light-300 underline mt-1 block"
                          >
                            ⬇️ Download audio
                          </a>
                        </div>
                      )}

                      {/* Multiple audios */}
                      {item.audios?.length > 0 && (
                        <div className="audio-group mt-1 flex flex-col gap-2">
                          {item.audios.map((url: string, idx: number) => (
                            <div key={`aud-${item.id}-${idx}`}>
                              <audio controls src={url} className="w-48" />
                              <a
                                href={url}
                                download
                                className="text-xs text-light-300 underline mt-1 block"
                              >
                                ⬇️ Download audio {idx + 1}
                              </a>
                            </div>
                          ))}
                        </div>
                      )}

                      <span className="text-xs text-light-400 block mt-1">
                        {item.timestamp ? new Date(item.timestamp * 1000).toLocaleTimeString() : ""}
                      </span>
                    </div>
                  </div>
                )
              }

              // Flow logs
              return (
                <div key={item.id ?? `flow-fallback-${index}`} className="flex justify-end px-3 py-1">
                  <div className="px-3 py-1 text-xs bg-dark-600 rounded">
                    🧩 {new Date(item.timestamp * 1000).toLocaleTimeString()} – {item.name}
                  </div>
                </div>
              )
            }}
          />
        )}
      </div>



      {/* Reply helpers bar pinned at bottom */}
      <div
        ref={helpersRef}
        className="sticky bottom-0 bg-dark-900 border-t border-dark-600 w-full"
      >

        {/* Helpers + toggle inline */}
        <div className="bg-dark-900 border-t border-dark-600">
          <div
            className={`transition-all duration-300 ease-in-out ${showHelpers
              ? "opacity-100 translate-y-0 max-h-40"
              : "opacity-0 translate-y-2 max-h-0 overflow-hidden"
              }`}
          >
            <ReplyHelpers setDraft={setDraft} activeConversation={conversation} />
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



        {/* ✅ wrap ReplyBar in a full-width container */}
        <div className="w-full">
          <ReplyBar
            draft={draft}
            setDraft={setDraft}
            pageId={currentPageId}
            activeConversation={conversation}
            onSendMessage={handleSend}
          />
        </div>
      </div>


      {/* 🔎 Lightbox overlay with navigation */}
      {lightboxIndex !== null && lightboxType === "image" && lightboxImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 overflow-y-auto p-[env(safe-area-inset-bottom)]"
          onClick={() => setLightboxIndex(null)}
        >
          <img
            src={lightboxImages[lightboxIndex]}
            alt="preview"
            className="max-h-[90%] max-w-[90%] rounded-lg shadow-lg"
          />

          {/* Navigation */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex((lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length)
            }}
            className="absolute left-6 text-white text-3xl"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex((lightboxIndex + 1) % lightboxImages.length)
            }}
            className="absolute right-6 text-white text-3xl"
          >
            ›
          </button>
        </div>
      )}

      {lightboxIndex !== null && lightboxType === "video" && lightboxVideos.length > 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 overflow-y-auto p-[env(safe-area-inset-bottom)]"
          onClick={() => setLightboxIndex(null)}
        >
          <video
            controls
            src={lightboxVideos[lightboxIndex]}
            className="max-h-[90%] max-w-[90%] rounded-lg shadow-lg"
            autoPlay
          />

          {/* Navigation */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex((lightboxIndex - 1 + lightboxVideos.length) % lightboxVideos.length)
            }}
            className="absolute left-6 text-white text-3xl"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex((lightboxIndex + 1) % lightboxVideos.length)
            }}
            className="absolute right-6 text-white text-3xl"
          >
            ›
          </button>
        </div>
      )}

    </div>
  )
}

