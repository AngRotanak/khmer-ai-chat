import { useState, useEffect } from 'react'
import { getDatabase, ref, onValue, set } from 'firebase/database'
import { toast } from "sonner"

type FeatureToggleProps = {
  label: string
  path: string // e.g. "pages/{pageId}/config/features/promo"
  tooltip: string
  variant?: 'main' | 'sub'
}

export function FeatureToggle({ label, path, tooltip, variant = 'sub' }: FeatureToggleProps) {
  const [enabled, setEnabled] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const db = getDatabase()
    const featureRef = ref(db, `khmer-ai-chat/${path}`)
    const unsubscribe = onValue(featureRef, (snapshot) => {
      const value = snapshot.val()
      // normalize to boolean
      const normalized = typeof value === 'object' && value !== null && 'enabled' in value
        ? !!value.enabled
        : !!value
      setEnabled(normalized)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [path])

  const toggleFeature = async () => {
    const db = getDatabase()
    const featureRef = ref(db, `khmer-ai-chat/${path}`)
    const newValue = !enabled

    const toastId = toast.loading("Updating feature...")

    try {
      await set(featureRef, { enabled: newValue })
      setEnabled(newValue)

      const pageId = path.split("/")[1]
      await fetch("https://asia-east2-khmer-catalog.cloudfunctions.net/khmer_aichatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refresh_config_handler: true,
          page_id: pageId
        })
      })

      toast.success(`Feature ${newValue ? "enabled" : "disabled"} successfully`, { id: toastId })
    } catch (err) {
      console.error("Failed to trigger refresh:", err)
      toast.error("Failed to update feature ❌", { id: toastId })
    }
  }
  // 🎨 Different styles for main vs sub toggles
  const baseClasses = "flex items-center justify-between px-2 py-2 rounded cursor-pointer transition"
  const mainClasses = "bg-teal-700 border border-teal-500 font-semibold text-light-100 shadow-md"
  const subClasses = "bg-dark-700 hover:bg-dark-600 text-light-300"
  return (
    <div className={`${baseClasses} ${variant === 'main' ? mainClasses : subClasses}`}>
      <div className="flex items-center space-x-2">
        <span className={`text-sm ${variant === 'main' ? 'text-light-100' : 'text-light-300'}`}>
          {label}
        </span>
        {tooltip && (
          <span className="text-gray-400 cursor-help" title={tooltip}>
            ⓘ
          </span>
        )}
      </div>
      <button
        onClick={toggleFeature}
        disabled={loading}
        className="w-10 h-6 rounded-full bg-dark-400 relative transition"
      >
        <div
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform ${enabled ? 'translate-x-4 bg-teal-400' : 'translate-x-0 bg-gray-400'
            }`}
        />
      </button>
    </div>
  )

}
