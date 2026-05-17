import { useEffect, useState } from 'react'
import { getSnapshots, deleteSnapshot, saveCanvasSnapshot } from './snapshotHelpers'
import { useAuthStore } from '~/stores/auth-store'
import { useReactFlow } from '@xyflow/react'
import { useCanvasStore } from '~/stores/canvas-store'
import { sanitizeCanvas } from '~/utils/sanitizeCanvas'
import { validateEdges } from '~/utils/validateEdges'

export function SnapshotViewer() {
  const userId = useAuthStore(s => s.user?.id)
  const { setNodes, setEdges } = useReactFlow()
  const [snapshots, setSnapshots] = useState<any[]>([])

  const nodes = useCanvasStore(s => s.nodes)
  const edges = useCanvasStore(s => s.edges)

  useEffect(() => {
    const load = async () => {
      if (!userId) return
      const result = await getSnapshots(userId)
      setSnapshots(result)
    }
    load()
  }, [userId])
  

  const restoreSnapshot = (snapshot: any) => {
    if (!snapshot?.nodes || !snapshot?.edges) return

    const { nodes, edges } = sanitizeCanvas({
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      updatedAt: snapshot.updatedAt ?? Date.now(),
    })

    const validEdges = validateEdges(nodes, edges)

    setNodes(nodes)
    setEdges(validEdges)
    console.log('🧼 Restoring sanitized snapshot:', { nodes, edges })
  }

  const handleDelete = async (id: string) => {
    if (!userId) return
    await deleteSnapshot(userId, id)
    setSnapshots(prev => prev.filter(s => s.id !== id))
  }

  const onSnapshot = async () => {
    if (!userId) return

    const shouldAutosave = nodes.length > 0 || edges.length > 0
    if (!shouldAutosave) return

    await saveCanvasSnapshot({
      userId,
      nodes,
      edges,
      label: '',
    })

    const updated = await getSnapshots(userId)
    setSnapshots(updated)
  }

  const clearCanvas = () => {
    const confirmed = window.confirm('Are you sure you want to clear the canvas? This will remove all nodes and edges.')
    if (!confirmed) return

    setNodes([])
    setEdges([])
    console.log('🧹 Canvas cleared')
  }

  return (
    <div className="absolute top-4 left-4 z-40 flex flex-col gap-2 text-sm text-light-100/60 dark:text-light-100/40">
      {/* Snapshot + Clear Buttons */}
      <div className="flex gap-3">
        <button
          onClick={clearCanvas}
          className="text-[16px] text-red-400 hover:text-red-300 transition"
          title="Clear canvas"
        >
          🧹
        </button>

        <button
          onClick={onSnapshot}
          className="text-[16px] text-light-100/80 dark:text-light-100/70 hover:text-light-100 transition"
          title="Save snapshot"
        >
          📸
        </button>
      </div>

      {/* Snapshot List */}
      {snapshots.map(s => (
        <div key={s.id} className="flex flex-col items-start text-[13px] leading-snug text-light-100/80 dark:text-light-100/60">
          <span className="opacity-80">{new Date(s.updatedAt).toLocaleString()}</span>
          <span className="opacity-90">{s.label ?? 'Untitled'}</span>
          <div className="flex gap-3 mt-1">
            <button
              onClick={() => handleDelete(s.id)}
              className="text-[16px] text-red-700 hover:text-red-500 transition"
              title="Delete snapshot"
            >
              ×
            </button>

            <button
              onClick={() => restoreSnapshot(s)}
              className="text-green-500 hover:underline"
            >
              Restore
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
