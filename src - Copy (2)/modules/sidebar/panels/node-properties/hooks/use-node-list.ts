import type { Node } from '@xyflow/react'
import { useMemo } from 'react'

import { BuilderNode } from '~/modules/nodes/types'
import { getNodeDetail } from '~/modules/nodes/utils'
import { getChainStatus } from '~/utils/flowLogic' 

export function useNodeList(nodes: Node[]) {
  return useMemo(() => {
    return nodes
      .sort((a, b) => {
        if (a.type === BuilderNode.START) return -1
        if (b.type === BuilderNode.START) return 1
        if (a.type === BuilderNode.END) return 1
        if (b.type === BuilderNode.END) return -1
        return 0
      })
      .map(n => ({
        ...n,
        detail: getNodeDetail(n.type),
        chainStatus: getChainStatus(n), // ✅ new field
      }))
  }, [nodes])
}
