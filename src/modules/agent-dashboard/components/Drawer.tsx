import { useEffect, useState } from "react"

interface DrawerProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Drawer({ open, onClose, children }: DrawerProps) {
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) setClosing(false)
  }, [open])

  if (!open && !closing) return null

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-teal-700 p-3 md:hidden ${
        closing ? "animate-slide-down" : "animate-slide-up"
      }`}
      onAnimationEnd={() => {
        if (closing) {
          setClosing(false)
          onClose()
        }
      }}
    >
      <div className="flex gap-2">
        {children}
        <button
          onClick={() => setClosing(true)}
          className="px-2 py-2 text-sm bg-dark-600 text-light-200 rounded hover:bg-dark-500"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
