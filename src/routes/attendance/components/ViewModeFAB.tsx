import { useState, useEffect, useRef } from "react"

interface Props {
  currentMode: "report" | "calendar" | "summary"
  onChange: (mode: "report" | "calendar" | "summary") => void
}

export default function ViewModeFAB({ currentMode, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const fabRef = useRef<HTMLDivElement>(null)

  // Close FAB when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Map mode to label
  const modeLabel = currentMode === "report" ? "Report Mode Active"
                  : currentMode === "calendar" ? "Calendar Mode Active"
                  : "Summary Mode Active"

  return (
    <div ref={fabRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-center space-y-1">
      {/* Main FAB shows current mode icon */}
      <button
        onClick={() => setOpen(!open)}
        className={`rounded-full w-14 h-14 shadow-lg flex items-center justify-center text-2xl transition-transform duration-300 hover:scale-110
          ${currentMode === "summary" ? "bg-teal-500 text-white ring-4 ring-teal-400 animate-pulse" : "bg-teal-500 text-white"}
        `}
      >
        {currentMode === "report" && "📑"}
        {currentMode === "calendar" && "📅"}
        {currentMode === "summary" && "📊"}
      </button>

      {/* Tooltip/label under FAB */}
      <span className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded shadow-md">
        {modeLabel}
      </span>

      {/* Options with fade/slide animation */}
      <div
        className={`absolute bottom-20 right-0 flex flex-col space-y-2 transform transition-all duration-300 ${
          open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <FABOption icon="📑" label="Report" mode="report" currentMode={currentMode} onChange={onChange} />
        <FABOption icon="📅" label="Calendar" mode="calendar" currentMode={currentMode} onChange={onChange} />
        <FABOption icon="📊" label="Summary" mode="summary" currentMode={currentMode} onChange={onChange} />
      </div>
    </div>
  )
}

function FABOption({
  icon,
  label,
  mode,
  currentMode,
  onChange,
}: {
  icon: string
  label: string
  mode: "report" | "calendar" | "summary"
  currentMode: "report" | "calendar" | "summary"
  onChange: (mode: "report" | "calendar" | "summary") => void
}) {
  function handleClick() {
    // ✅ Haptic feedback
    if (navigator.vibrate) {
      if (mode === "summary") {
        navigator.vibrate([40, 60, 40]) // double buzz pattern
      } else {
        navigator.vibrate(30) // short single buzz
      }
    }
    onChange(mode)
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-md text-sm transition-colors duration-200 ${
        currentMode === mode ? "bg-teal-600 text-white" : "bg-gray-800 text-gray-200 hover:bg-gray-700"
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}
