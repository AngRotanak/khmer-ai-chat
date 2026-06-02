import { useEffect, useRef, useState } from "react"
import type { Conversation } from '~/modules/nodes/types'
import { takeOverConversation, returnToBot, closeConversation } from "../hooks/conversationActions"

type ConversationViewProps = {
  conversation: Conversation | null
  currentPageId: string
  onSend: (msg: any) => void   // ✅ add onSend
}


export function ConversationView({
  conversation,
  currentPageId,
}: ConversationViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  // Lightbox state
  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxVideos, setLightboxVideos] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [lightboxType, setLightboxType] = useState<"image" | "video" | null>(null)


  // ✅ Always declare hooks unconditionally
  useEffect(() => {
    if (!conversation) return
    console.log("🔎 Raw conversation.messages:", conversation.messages)
    // any logic that depends on conversation
  }, [conversation])

  // ✅ Auto-scroll effect declared unconditionally
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


  // Normalize messages
  const messages = Array.isArray(conversation.messages) ? conversation.messages : []


  const normalizedMessages = (messages as any[]).map(m => ({
    id: m.id,
    type: "message" as const,
    sender: m.sender,
    text: m.text,
    imageUrl: m.imageUrl,
    videoUrl: m.videoUrl,
    audioUrl: m.audioUrl,
    images: m.images || [],   // safe defaults
    videos: m.videos || [],
    audios: m.audios || [],
    timestamp: m.timestamp ?? Date.now() / 1000,
  }))


  // // Collect all image messages for lightbox navigation
  // const imageMessages = normalizedMessages.filter(m => m.imageUrl)
  // const mediaMessages = normalizedMessages.filter(
  //   m =>
  //     m.imageUrl ||
  //     m.videoUrl ||
  //     m.audioUrl ||
  //     (m.images && m.images.length > 0) ||
  //     (m.videos && m.videos.length > 0) ||
  //     (m.audios && m.audios.length > 0)
  // )




  // Normalize flowLogs
  const flowLogs = Array.isArray(conversation?.flowLogs)
    ? conversation!.flowLogs
    : Object.values(conversation?.flowLogs || {})
  const normalizedLogs = (flowLogs as any[]).map(l => ({
    id: l.id ?? crypto.randomUUID(),
    type: "flow" as const,
    name: l.name,
    timestamp: l.timestamp ?? Date.now() / 1000,
  }))

  const timeline = [...normalizedMessages, ...normalizedLogs].sort(
    (a, b) => a.timestamp - b.timestamp
  )



  // 🔎 Debug logs
  console.log("💬 Normalized messages:", normalizedMessages.length, normalizedMessages)
  console.log("🧩 Normalized logs:", normalizedLogs.length, normalizedLogs)
  console.log("📜 Timeline items:", timeline.length, timeline)



  if (!conversation) {
    return (
      <div className="flex-grow flex items-center justify-center text-light-50">
        Select a conversation
      </div>
    )
  }

  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if (lightboxIndex !== null && lightboxImages.length > 0) {
  //       if (e.key === "Escape") setLightboxIndex(null)
  //       if (e.key === "ArrowRight") {
  //         setLightboxIndex(prev =>
  //           prev !== null ? (prev + 1) % lightboxImages.length : prev
  //         )
  //       }
  //       if (e.key === "ArrowLeft") {
  //         setLightboxIndex(prev =>
  //           prev !== null ? (prev - 1 + lightboxImages.length) % lightboxImages.length : prev
  //         )
  //       }
  //     }
  //   }

  //   window.addEventListener("keydown", handleKeyDown)
  //   return () => window.removeEventListener("keydown", handleKeyDown)
  // }, [lightboxIndex, lightboxImages])



  return (
    <main className="flex flex-col grow h-full bg-dark-900 text-light-100">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 p-2 flex justify-between items-center border-b border-dark-600 bg-dark-900">
        <div className="flex items-center gap-2">
          {conversation.avatar ? (
            <img src={conversation.avatar} alt="avatar" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-xs">?</div>
          )}
          <span className="font-bold">{conversation.customerName || conversation.user_id}</span>
        </div>

        <div className="flex gap-2">
          <button
            className="px-2 py-1 bg-teal-700 rounded"
            onClick={() => takeOverConversation(currentPageId, conversation)}
          >
            Take Over
          </button>
          <button
            className="px-2 py-1 bg-dark-600 rounded"
            onClick={() => returnToBot(currentPageId, conversation)}
          >
            Return to Bot
          </button>
          <button
            className="px-2 py-1 bg-red-700 rounded"
            onClick={() => closeConversation(currentPageId, conversation)}
          >
            Close Conversation
          </button>
        </div>
      </header>

      {/* Scrollable timeline */}
      <div
        className="flex-grow overflow-y-auto p-2 scrollbar-dark-teal space-y-2"
        ref={scrollRef}
      >
        {timeline.length === 0 ? (
          <div className="text-light-50 text-sm">No activity yet…</div>
        ) : (
          timeline.map(item => (
            item.type === "message" ? (
              <div
                key={item.id}
                className={`flex ${item.sender === "agent" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-3 py-2 rounded-lg max-w-[70%] break-words whitespace-pre-wrap ${item.sender === "agent" ? "bg-teal-700" : "bg-dark-700"
                    }`}
                >
                  {/* Text */}
                  {item.text && <p className="text-sm">{item.text}</p>}

                  {/* Single image */}
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt="uploaded"
                      className="rounded-lg mt-1 cursor-pointer max-w-xs max-h-60 object-cover"
                      onClick={() => {
                        setLightboxImages([item.imageUrl])
                        setLightboxIndex(0)
                      }}
                    />
                  )}

                  {/* Multiple images */}
                  {item.images && item.images.length > 0 && (
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

                  {/* Single video */}
                  {item.videoUrl && (
                    <video src={item.videoUrl} controls className="rounded-lg mt-1 max-w-full shadow-md" />
                  )}

                  {/* Multiple videos */}
                  {item.videos && item.videos.length > 0 && (
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
                          {/* Overlay play icon */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black bg-opacity-40 rounded-full p-3 transition duration-200 group-hover:bg-opacity-60">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-8 w-8 text-white transition duration-200 group-hover:text-teal-300"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Single audio */}
                  {item.audioUrl && <audio controls src={item.audioUrl} className="w-48 mt-1" />}

                  {/* Multiple audios */}
                  {item.audios && item.audios.length > 0 && (
                    <div className="audio-group mt-1 flex flex-col gap-2">
                      {item.audios.map((url: string, idx: number) => (
                        <audio key={idx} controls src={url} className="w-48" />
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <span className="text-xs text-light-400 block mt-1">
                    {item.timestamp
                      ? new Date(item.timestamp * 1000).toLocaleTimeString()
                      : ""}
                  </span>
                </div>
              </div>
            ) : (
              <div key={item.id} className="flex justify-end">
                <div className="px-3 py-1 text-xs bg-dark-600 rounded">
                  🧩 {new Date(item.timestamp * 1000).toLocaleTimeString()} – {item.name}
                </div>
              </div>
            )
          ))
        )}
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




    </main>
  )
}

