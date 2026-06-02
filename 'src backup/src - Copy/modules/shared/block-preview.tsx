import { useEffect, useState } from 'react'
import { getDatabase, ref, onValue } from 'firebase/database'

type Props = {
  pageId: string
  blockName: string
}

export function BlockPreview({ pageId, blockName }: Props) {
  const [stepCount, setStepCount] = useState<number | null>(null)

  useEffect(() => {
    const db = getDatabase()
    const blockRef = ref(db, `khmer-ai-chat/pages/${pageId}/blocks/${blockName}/steps`)
    const unsub = onValue(blockRef, (snap) => {
      const steps = snap.val()
      setStepCount(steps ? Object.keys(steps).length : 0)
    })
    return () => unsub()
  }, [pageId, blockName])

  if (stepCount === null) {
    return <span className="text-xs text-light-400">⏳ Loading…</span>
  }

  if (stepCount === 0) {
    return <span className="text-xs text-yellow-400">⚠️ ប្លុកទទេ</span>
  }

  return (
    <span className="text-xs text-light-400">
      {blockName} • {stepCount} ជំហាន
    </span>
  )
}
