import { useEffect, useRef, useState, } from "react"
import type { Conversation, ConversationMessage } from "~/modules/nodes/types"
import { takeOverConversation, returnToBot, closeConversation } from "../hooks/conversationActions"
import { ReplyBar } from "./ReplyBar"
import { useFlowSession } from '~/stores/flow-session'
import { sendReplyBarMessage } from "../hooks/useSendMessage"
import { ReplyHelpers } from "../components/ReplyHelpers"   // ✅ import helpers
import { ref, update, remove, get, push, set, onValue } from "firebase/database"
import { db } from "~/lib/firebase"

import { useLocalizedMessage } from "../hooks/useLocalizedMessage"


interface ConversationTimelineProps {
  conversation: Conversation | null
  currentPageId: string
}



export function ConversationTimeline({
  conversation,
  currentPageId,
}: ConversationTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showHelpers, setShowHelpers] = useState(false)
  const { previewMessage, sendMessage } = useLocalizedMessage(currentPageId, conversation)

  // Local state for previews
  const [preview, setPreview] = useState<{ type: string; text: string } | null>(null)

  const handlePreview = async (type: "takeover" | "return" | "close") => {
    const text = await previewMessage(type)
    setPreview({ type, text })
  }

  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxVideos, setLightboxVideos] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [lightboxType, setLightboxType] = useState<"image" | "video" | null>(null)
  const [draft, setDraft] = useState("")


  // ✅ Single scroll effect
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conversation?.messages, conversation?.flowLogs])

  if (!conversation) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-light-400">
        <span className="text-sm">Select a conversation</span>
      </div>
    )
  }

  console.log("🖼 Timeline rendering messages:", conversation.messages)

  // Normalize messages
  const messages = Array.isArray(conversation.messages) ? conversation.messages : []
  const normalizedMessages = (messages as any[]).map(m => ({
    id: m.id,
    type: "message" as const,
    sender: m.sender,
    text: m.text ?? "",
    imageUrl: m.imageUrl,
    videoUrl: m.videoUrl,
    audioUrl: m.audioUrl,
    images: m.images || [],
    videos: m.videos || [],
    audios: m.audios || [],
    timestamp: m.timestamp ?? Date.now() / 1000,
  }))



  // Normalize flowLogs
  const flowLogs = Array.isArray(conversation?.flowLogs)
    ? conversation!.flowLogs
    : Object.values(conversation?.flowLogs || {})

  const normalizedLogs = (flowLogs as any[]).map(l => ({
    id: l.id ?? crypto.randomUUID(),
    type: "flow" as const,
    name: l.name ?? "Unknown",
    timestamp: l.timestamp ?? Date.now() / 1000,
  }))



  // Unified timeline
  const timeline = [...normalizedMessages, ...normalizedLogs].sort(
    (a, b) => a.timestamp - b.timestamp
  )


  return (
    <div className="flex flex-col h-full bg-dark-900">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 p-2 flex justify-between items-center border-b border-dark-600 bg-dark-900">
        <div className="flex items-center gap-2">
          {conversation.avatar ? (
            <img
              src={conversation.avatar}
              alt={conversation.customerName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-xs">?</div>
          )}
          <span className="font-bold">{conversation.customerName || conversation.user_id}</span>

          {/* Status badge */}
          <span
            className={`ml-2 px-2 py-0.5 rounded text-xs ${conversation.status === "Waiting"
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

        {/* Action buttons with preview tooltips */}
        <div className="flex gap-4 items-start">
          <div className="relative">
            <button
              className="px-2 py-1 bg-teal-700 rounded"
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
              className="px-2 py-1 bg-dark-600 rounded"
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
              className="px-2 py-1 bg-red-700 rounded"
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

      {/* Scrollable timeline */}
      <div ref={scrollRef} className="flex-grow overflow-y-auto p-2 space-y-4 scrollbar-dark-teal">
        {timeline.length === 0 ? (
          <div className="text-light-50 text-sm">No activity yet…</div>
        ) : (
          timeline.map(item => {
            if (item.type === "message") {
              // Messenger messages
              return (
                <div
                  key={item.id}
                  className={`flex ${item.sender === "agent" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg max-w-[70%] break-words whitespace-pre-wrap ${item.sender === "agent" ? "bg-teal-700" : "bg-dark-700"
                      }`}
                  >
                    {item.text && <p className="text-sm">{item.text}</p>}

                    {/* Attachments */}
                    {typeof item.imageUrl === "string" && item.imageUrl.length > 0 && (
                      <img
                        src={item.imageUrl}
                        alt="uploaded"
                        className="rounded-lg mt-1 cursor-pointer max-w-xs max-h-60 object-cover"
                        onClick={() => {
                          setLightboxImages([item.imageUrl])
                          setLightboxIndex(0)
                          setLightboxType("image")
                        }}
                      />
                    )}

                    {Array.isArray(item.images) && item.images.length > 0 && (
                      <div className="image-group mt-1 flex flex-wrap gap-2">
                        {item.images.map((url: string, idx: number) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`attachment-${idx}`}
                            className="rounded-lg cursor-pointer max-w-xs max-h-60 object-cover"
                            onClick={() => {
                              setLightboxImages(item.images!)
                              setLightboxIndex(idx)
                              setLightboxType("image")
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {typeof item.videoUrl === "string" && item.videoUrl.length > 0 && (
                      <video
                        src={item.videoUrl}
                        controls
                        className="rounded-lg mt-1 max-w-full shadow-md"
                      />
                    )}

                    {Array.isArray(item.videos) && item.videos.length > 0 && (
                      <div className="video-group mt-1 flex flex-col gap-2">
                        {item.videos.map((url: string, idx: number) => (
                          <div
                            key={idx}
                            className="relative max-w-full group cursor-pointer"
                            onClick={() => {
                              setLightboxVideos(item.videos!)
                              setLightboxIndex(idx)
                              setLightboxType("video")
                            }}
                          >
                            <video
                              src={url}
                              className="rounded-lg max-w-full shadow-md"
                              style={{ maxHeight: "240px" }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-black bg-opacity-40 rounded-full p-3 transition duration-200 group-hover:bg-opacity-60">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {typeof item.audioUrl === "string" && item.audioUrl.length > 0 && (
                      <audio controls src={item.audioUrl} className="w-48 mt-1" />
                    )}

                    {Array.isArray(item.audios) && item.audios.length > 0 && (
                      <div className="audio-group mt-1 flex flex-col gap-2">
                        {item.audios.map((url: string, idx: number) => (
                          <audio key={idx} controls src={url} className="w-48" />
                        ))}
                      </div>
                    )}

                    <span className="text-xs text-light-400 block mt-1">
                      {item.timestamp ? new Date(item.timestamp * 1000).toLocaleTimeString() : ""}
                    </span>
                  </div>
                </div>
              )
            } else if (item.type === "flow") {
              // Flow logs
              return (
                <div key={item.id} className="flex justify-end">
                  <div className="px-3 py-1 text-xs bg-dark-600 rounded">
                    🧩 {new Date(item.timestamp * 1000).toLocaleTimeString()} – {item.name}
                  </div>
                </div>
              )
            }
            return null
          })
        )}
      </div>

      {/* ✅ Reply helpers toggle + bar */}
      <div className="sticky bottom-0 bg-dark-900 border-t border-dark-600">
        {/* Inline ReplyBar */}
        <ReplyBar
          draft={draft}
          setDraft={setDraft}
          pageId={currentPageId}
          activeConversation={conversation}
          onSendMessage={sendReplyBarMessage}
        />



        {showHelpers && (
          <ReplyHelpers
            setDraft={setDraft}
            activeConversation={conversation}
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



      {/* 🔎 Lightbox overlay with navigation */}
      {lightboxIndex !== null && lightboxType === "image" && lightboxImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
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
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
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



