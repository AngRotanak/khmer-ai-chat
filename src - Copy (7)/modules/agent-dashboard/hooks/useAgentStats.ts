import { useEffect } from 'react'
import { useApplicationState } from '~/stores/application-state'
import { db } from '~/lib/firebase'
import { useFlowSession } from '~/stores/flow-session'
import { ref, onValue, off } from 'firebase/database'



const defaultConversations = { active: 0, waiting: 0, resolved: 0 }
const defaultMetrics = { responseTime: 0, resolutionRate: 0, satisfaction: 0 }

export function useAgentStats() {
  const { conversations, metrics, setConversations, setMetrics } = useApplicationState(s => ({
    conversations: s.agentData.conversations,
    metrics: s.agentData.metrics,
    setConversations: s.actions.agentData.setConversations,
    setMetrics: s.actions.agentData.setMetrics,
  }))

  const { currentPageId } = useFlowSession()

  useEffect(() => {
    // If no page selected, reset to defaults and exit
    if (!currentPageId) {
      setConversations(defaultConversations)
      setMetrics(defaultMetrics)
      return
    }

    const statsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/agent_stats`)

    const unsubscribe = onValue(statsRef, snapshot => {
      const data = snapshot.val()
      if (data) {
        console.log('Realtime agent stats:', data)
        setConversations(data.conversations || defaultConversations)
        setMetrics(data.metrics || defaultMetrics)
      } else {
        console.warn('No agent stats found in DB')
        setConversations(defaultConversations)
        setMetrics(defaultMetrics)
      }
    })

    return () => {
      off(statsRef)
      unsubscribe()
    }
  }, [currentPageId, setConversations, setMetrics])

  // ✅ Always return safe defaults if store is empty
  return {
    conversations: conversations || defaultConversations,
    metrics: metrics || defaultMetrics,
  }
}
