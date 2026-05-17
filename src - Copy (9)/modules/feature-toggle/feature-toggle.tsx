import { useEffect, useState } from 'react'
import { getDatabase, ref, onValue, set } from 'firebase/database'

type Props = {
  label: string
  path: string
}

export function FeatureToggle({ label, path }: Props) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const db = getDatabase()
    const toggleRef = ref(db, `khmer-ai-chat/${path}`)
    const unsub = onValue(toggleRef, (snap) => {
      setEnabled(!!snap.val())
    })
    return () => unsub()
  }, [path])

  const handleToggle = async () => {
    const db = getDatabase()
    const toggleRef = ref(db, `khmer-ai-chat/${path}`)
    await set(toggleRef, !enabled)
  }

  return (
    <div className="flex items-center justify-between bg-dark-800 p-3 rounded border border-dark-600">
      <span className="text-light-100">{label}</span>
      <button
        onClick={handleToggle}
        className={`w-10 h-5 rounded-full transition ${
          enabled ? 'bg-teal-500' : 'bg-dark-500'
        }`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full transform transition ${
            enabled ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
