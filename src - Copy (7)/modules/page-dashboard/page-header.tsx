import { useEffect, useState } from 'react'
import { getDatabase, ref, onValue } from 'firebase/database'

type Props = {
  pageId: string
}

export function PageHeader({ pageId }: Props) {
  const [name, setName] = useState('')

  useEffect(() => {
    const db = getDatabase()
    const configRef = ref(db, `khmer-ai-chat/pages/${pageId}/config`)
    const unsub = onValue(configRef, (snap) => {
      const data = snap.val()
      setName(data?.name || 'Unnamed Page')
    })
    return () => unsub()
  }, [pageId])

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-light-100">{name}</h1>
        <p className="text-sm text-light-400">Page ID: {pageId}</p>
      </div>
    </div>
  )
}
