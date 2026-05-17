import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useApplicationState } from '~/stores/application-state'

export function useAgentStats() {
  const { setConversations, setMetrics } = useApplicationState(s => ({
    setConversations: s.actions.agentData.setConversations,
    setMetrics: s.actions.agentData.setMetrics,
  }))

  useEffect(() => {
    // ✅ Connect to backend Socket.IO server
    const socket = io('http://localhost:3000')

    // ✅ Listen for agentStats events
    socket.on('agentStats', (data) => {
      console.log('Realtime data:', data)
      setConversations(data.conversations)
      setMetrics(data.metrics)
    })

    // ✅ Cleanup on unmount
    return () => {
      socket.disconnect()
    }
  }, [setConversations, setMetrics])
}
