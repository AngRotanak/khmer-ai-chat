import { useState } from "react"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "~/lib/firebase"

interface ReplyBarProps {
  draft: string
  setDraft: (text: string) => void
  onSend: (msg: { type: "text" | "voice"; text?: string; audioUrl?: string }) => void
}

export function ReplyBar({ draft, setDraft, onSend }: ReplyBarProps) {
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
  const [chunks, setChunks] = useState<Blob[]>([])
  const [sending, setSending] = useState(false)

  const handleSendText = () => {
    if (!draft.trim()) return
    setSending(true)
    onSend({ type: "text", text: draft.trim() })
    setDraft("")
    const textarea = document.getElementById("replyBox") as HTMLTextAreaElement
    if (textarea) textarea.style.height = "auto"
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "auto"
    e.target.style.height = `${e.target.scrollHeight}px`
    setDraft(e.target.value)
  }

  // 🎙 Voice recording
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mediaRecorder = new MediaRecorder(stream)
    setRecorder(mediaRecorder)
    setChunks([])

    mediaRecorder.ondataavailable = e => setChunks(prev => [...prev, e.data])
    mediaRecorder.start()
  }

  const stopRecording = async () => {
    if (!recorder) return
    recorder.stop()
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" })
      const file = new File([blob], `voice-${Date.now()}.webm`)
      const storageRef = ref(storage, `voice/${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      onSend({ type: "voice", audioUrl: url })
      setChunks([])
      setRecorder(null)
    }
  }

  return (
    <div className="flex items-end gap-2 p-2 border-t border-dark-600 bg-dark-800">
           
      {/* 🎤 Voice record */}
      {recorder ? (
        <button onClick={stopRecording} className="px-2 py-1 bg-red-600 text-white rounded">
          ⏹ Stop
        </button>
      ) : (
        <button onClick={startRecording} className="px-2 py-1 bg-dark-600 text-light-200 rounded">
          🎤
        </button>
      )}

      {/* ✏️ Text input */}
      <textarea
        id="replyBox"
        value={draft}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Type your reply... (Shift+Enter for new line)"
        rows={1}
        className="flex-grow resize-none px-3 py-2 rounded bg-dark-700 text-light-100 focus:outline-none"
      />

      {/* Send button */}
      <button
        onClick={handleSendText}
        disabled={sending}
        className={`px-4 py-2 rounded ${sending ? "bg-dark-600 text-light-300" : "bg-teal-700 text-white"}`}
      >
        {sending ? "Sending…" : "Send"}
      </button>
    </div>
  )
}
