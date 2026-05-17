// pages/delivery/components/CameraModal.tsx
import { useState } from 'react'

export default function CameraModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden" // trigger externally
      >
        Open Camera
      </button>

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-96">
            <h2 className="text-lg font-semibold mb-2">Live Camera</h2>
            <div className="h-64 bg-gray-200 flex items-center justify-center">
              {/* Replace with actual camera stream */}
              <span className="text-gray-500">Camera Stream Here</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
