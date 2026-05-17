import { useEffect, useState } from 'react'
import { db } from '~/lib/firebase'
import { useFlowSession } from '~/stores/flow-session'
import { ref, onValue, off } from 'firebase/database'

// Define the shape of history entries
type HistoryEntry = {
  satisfaction: number
  resolutionRate: number
}

export function useAgentStatsHistory() {
  const { currentPageId } = useFlowSession()
  const [history, setHistory] = useState<Record<string, HistoryEntry>>({})

  useEffect(() => {
    if (!currentPageId) {
      console.warn('⚠️ No currentPageId available for history')
      // Reset to empty history if no page selected
      setHistory({})
      return
    }

    const historyRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/agent_stats_history`)

    const listener = onValue(historyRef, (snapshot) => {
      const data = snapshot.val()

      if (data) {
        console.log('Realtime agent stats history:', data)
        setHistory(data)
      } else {
        console.warn('No agent stats history found in DB')
        setHistory({})
      }
    })

    return () => {
      off(historyRef)
    }
  }, [currentPageId])

  // ✅ Always return safe defaults
  return history || {}
}
