import type { XYPosition } from '@xyflow/react'
import type { BuilderNodeType } from '~/modules/nodes/types'
import { useReactFlow } from '@xyflow/react'
import { useCallback } from 'react'

import { createNodeWithDefaultData } from '~/modules/nodes/utils'
import { trackFlowBuilderAddNode } from '~/utils/ga4'

export function useInsertNode() {
  const { addNodes, screenToFlowPosition, getNodes, updateNode } = useReactFlow()

  return useCallback(
    (type: BuilderNodeType, pos?: XYPosition) => {
      const _pos = pos || screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      })

      getNodes().forEach((node) => {
        if (node.selected) {
          updateNode(node.id, { selected: false })
        }
      })

      const newNode = createNodeWithDefaultData(type, { position: _pos, selected: true })

      // ✅ Debug: log the full node data
      console.log('🧪 Created node:', {
        id: newNode.id,
        type: newNode.type,
        data: newNode.data,
      })

      if (newNode.type === 'text-message') {
        const msgEn = typeof newNode.data?.message_en === 'string' ? newNode.data.message_en.trim() : ''
        const msgKh = typeof newNode.data?.message_kh === 'string' ? newNode.data.message_kh.trim() : ''


        if (!msgEn || !msgKh) {
          console.warn('🟥 Text-message node missing content:', newNode.id)
        } else {
          console.log('✅ Text-message node has content')
        }
      }


      // ✅ Messenger-safe template check for feature-block
      if (newNode.type === 'feature-block') {
        const data = newNode.data
        const templates = typeof data.templates === 'object' && data.templates !== null
          ? data.templates
          : {}

        const { paths: pathList } = getSafeCanvas(data)

        const missingTemplates: string[] = []

        for (const path of pathList) {
          const baseId = path?.template_id ?? '[❌ missing template_id]'
          const hasEn = Object.prototype.hasOwnProperty.call(templates, `${baseId}_en`)
          const hasKh = Object.prototype.hasOwnProperty.call(templates, `${baseId}_kh`)
          if (!hasEn || !hasKh) {
            missingTemplates.push(baseId)
          }
        }

        if (missingTemplates.length > 0) {
          console.warn('🟥 Feature block inserted without Messenger templates:', missingTemplates)
        } else {
          console.log('✅ Messenger templates found for all paths')
        }
      }

      addNodes(newNode)
      trackFlowBuilderAddNode(type)

      return newNode
    },
    [
      screenToFlowPosition,
      getNodes,
      addNodes,
      updateNode,
    ],
  )
}

function getSafeCanvas(data: Partial<{ canvas?: any }>): { layout: string; paths: any[] } {
  const layout = data.canvas?.layout === 'horizontal' ? 'horizontal' : 'vertical'
  const paths = Array.isArray(data.canvas?.paths) ? data.canvas.paths : []
  return { layout, paths }
}
