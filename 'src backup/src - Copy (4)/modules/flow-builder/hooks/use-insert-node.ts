import type { XYPosition } from '@xyflow/react'
import type { BuilderNodeType } from '~/modules/nodes/types'
import { useReactFlow } from '@xyflow/react'
import { useCallback } from 'react'
import { nanoid } from 'nanoid'
import { createNodeWithDefaultData } from '~/modules/nodes/utils'
import { trackFlowBuilderAddNode } from '~/utils/ga4'



export function useInsertNode() {
  const { addNodes, getNodes, updateNode } = useReactFlow()
 const { getViewport } = useReactFlow()
  return useCallback(
    (type: BuilderNodeType, pos?: XYPosition) => {
      let _pos: XYPosition
    
      if (pos) {
        _pos = pos
      } else {
        const { x, y, zoom } = getViewport()
        _pos = {
          x: -x + window.innerWidth / (2 * zoom),
          y: -y + window.innerHeight / (2 * zoom),
        }
        console.log('📐 Using viewport center as insert position:', _pos)
      }


      // Deselect nodes
      getNodes().forEach(node => {
        if (node.selected) updateNode(node.id, { selected: false })
      })

      const newNode = createNodeWithDefaultData(type, {
        position: _pos,
        selected: true,
      })

      console.log('🎯 Final node position:', newNode.position)
      console.log('🧪 Created node:', { id: newNode.id, type: newNode.type, data: newNode.data })


      if (newNode.type === 'text-message') {
        const msgEn = typeof newNode.data?.message_en === 'string' ? newNode.data.message_en.trim() : ''
        const msgKh = typeof newNode.data?.message_kh === 'string' ? newNode.data.message_kh.trim() : ''

        if (!msgEn || !msgKh) {
          console.warn('🟥 Text-message node missing content:', newNode.id)
        } else {
          console.log('✅ Text-message node has content')
        }
      }

      if (newNode.type === 'feature-block') {
        // Always initialize Messenger-safe defaults
        const safeCanvas = getSafeCanvas(newNode.data)
        newNode.data = {
          ...newNode.data,
          template_id: newNode.data?.template_id ?? nanoid(),
          // ❌ Removed overwrite of templates — keep what createNodeWithDefaultData set
          canvas: safeCanvas,
        }

        const templates = newNode.data.templates
        const { paths: pathList } = safeCanvas

        const missingTemplates: string[] = []

        for (const path of pathList) {
          const baseId = path?.template_ref ?? '[❌ missing template_ref]'
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
    [getNodes, addNodes, updateNode],
  )
}

function getSafeCanvas(data: Partial<{ canvas?: any }>): { layout: string; paths: any[] } {
  const layout = data.canvas?.layout === 'horizontal' ? 'horizontal' : 'vertical'
  const paths = Array.isArray(data.canvas?.paths) ? data.canvas.paths : []
  return { layout, paths }
}



