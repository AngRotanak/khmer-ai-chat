// pages/delivery/components/DriverInfoDrawer.tsx
import { useState } from 'react'

export default function DriverInfoDrawer() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden" // trigger externally
      >
        Open Driver Info
      </button>

      {open && (
        <div className="fixed bottom-0 left-0 w-full bg-white shadow-lg p-4 rounded-t-lg z-40">
          <h3 className="font-semibold text-teal-600 mb-2">Driver Information</h3>
          <p>Name: John Doe</p>
          <p>Status: On the way</p>
          <p>Vehicle: Toyota Prius</p>
          <button
            onClick={() => setOpen(false)}
            className="mt-3 px-3 py-1 bg-red-500 text-white text-xs rounded"
          >
            Close
          </button>
        </div>
      )}
    </>
  )
}
