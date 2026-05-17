import { useCanvasStore } from '~/stores/canvas-store'
import type { FeatureBlock } from '~/modules/blocks/types/feature-block'


export function updatePathPayloadByNodeId(
  nodeId: string,
  pathIndex: number,
  targetNodeId: string
) {
  const trimmed = targetNodeId.trim()
  const freshNode = useCanvasStore.getState().nodes.find(n => n.id === nodeId)

  if (
    !freshNode ||
    freshNode.type !== 'feature-block' ||
    typeof freshNode.data !== 'object'
  ) {
    console.warn(`⚠️ updatePathPayloadByNodeId failed: node ${nodeId} is invalid`)
    return
  }

  const canvas = (freshNode.data as FeatureBlock).canvas ?? { paths: [] }
  const currentPaths = Array.isArray(canvas.paths) ? [...canvas.paths] : []

  if (!currentPaths[pathIndex]) {
    console.warn(`⚠️ updatePathPayloadByNodeId failed: path[${pathIndex}] does not exist`)
    return
  }

  const currentPath = currentPaths[pathIndex]

  const updatedPayload =
    trimmed === ''
      ? undefined
      : {
          node_id: trimmed,
          template_type: currentPath?.blockType ?? 'text-message',
          lang: 'en',
        }

  currentPaths[pathIndex] = {
    ...currentPath,
    payload: updatedPayload,
  }

  const updatedNode = {
    ...freshNode,
    data: {
      ...freshNode.data,
      canvas: {
        ...canvas,
        paths: currentPaths,
      },
    },
  }

  const updatedNodes = useCanvasStore
    .getState()
    .nodes.map(n => (n.id === nodeId ? updatedNode : n))

  useCanvasStore.getState().setNodes(updatedNodes)

  console.log(`🧪 updatePathPayloadByNodeId(${nodeId}, ${pathIndex}) =`, updatedPayload)
}


export function isMessengerSafePayload(
  payload: unknown
): payload is { node_id: string; template_type: string; lang?: string } {
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) return false

  const { node_id, template_type } = payload as Record<string, unknown>

  return (
    typeof node_id === 'string' &&
    node_id.trim() !== '' &&
    typeof template_type === 'string' &&
    template_type.trim() !== ''
  )
}

