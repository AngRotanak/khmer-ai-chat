"use client"
import { useState, useRef } from "react"

interface CameraModalProps {
  onCapture?: (photo: string) => void
  useFrontCamera?: boolean
  disabled?: boolean
}

// ✅ Utility: compress and force JPEG
async function forceJPEG(
  base64: string,
  quality = 0.7,
  maxWidth = 800,
  maxHeight = 800
) {
  return new Promise<string>((resolve) => {
    const img = new Image()
    img.src = base64
    img.onload = () => {
      let { width, height } = img

      // Scale down if larger than maxWidth or maxHeight
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, width, height)

      // ✅ Force JPEG output
      const jpegBase64 = canvas.toDataURL("image/jpeg", quality)

      // ✅ Strip header before returning (raw body only)
      resolve(jpegBase64.split(",")[1])
    }
    img.onerror = () => resolve(base64.split(",")[1]) // fallback
  })
}

export default function CameraModal({
  onCapture,
  useFrontCamera = false,
  disabled = false,
}: CameraModalProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const photoData = reader.result as string

      // ✅ Compress before sending
      forceJPEG(photoData, 0.7, 800, 800).then((compressedBase64) => {
        // ✅ Preview needs header
        setPreview("data:image/jpeg;base64," + compressedBase64)

        // ✅ Send raw body only
        if (onCapture) onCapture(compressedBase64)
      })
    }
    reader.readAsDataURL(file)
  }

  const triggerCapture = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      {preview && (
        <img
          src={preview}
          alt="preview"
          className="w-48 rounded-lg border-2 border-teal-500 shadow-lg"
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture={useFrontCamera ? "user" : "environment"}
        onChange={handlePhoto}
        style={{ display: "none" }}
      />

      <button
        type="button"
        onClick={triggerCapture}
        disabled={disabled}
        className={`w-full py-3 font-semibold rounded-lg shadow transition ${
          disabled
            ? "bg-gray-500 text-gray-300 cursor-not-allowed"
            : "bg-teal-500 text-white hover:bg-teal-400"
        }`}
      >
        📸 {useFrontCamera ? "Capture Selfie" : "Capture Photo"}
      </button>
    </div>
  )
}
