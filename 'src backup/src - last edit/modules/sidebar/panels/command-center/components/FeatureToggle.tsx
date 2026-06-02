import { useState, useEffect } from 'react'
import { getDatabase, ref, onValue, set } from 'firebase/database'
// import { Switch } from '~@/components/generics/switch-case'

type FeatureToggleProps = {
  label: string
  path: string // e.g. "features/promo"
  tooltip: string
}

export function FeatureToggle({ label, path }: FeatureToggleProps) {
  const [enabled, setEnabled] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const db = getDatabase()
    const featureRef = ref(db, `khmer-ai-chat/config/${path}`)
    const unsubscribe = onValue(featureRef, (snapshot) => {
      const value = snapshot.val()
      setEnabled(!!value?.enabled)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [path])

  const toggleFeature = async () => {
    const db = getDatabase()
    const featureRef = ref(db, `khmer-ai-chat/config/${path}`)
    await set(featureRef, { enabled: !enabled })
    setEnabled(!enabled)
  }

  return (
    <div className="flex items-center justify-between px-2 py-2 rounded bg-dark-700 hover:bg-dark-600">
      <span className="text-sm text-light-100">{label}</span>
      <button
        onClick={toggleFeature}
        disabled={loading}
        className="w-10 h-6 rounded-full bg-dark-400 relative transition"
      >
        <div
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform ${
            enabled ? 'translate-x-4 bg-teal-400' : 'translate-x-0 bg-gray-400'
          }`}
        />
      </button>
    </div>
  )
}
