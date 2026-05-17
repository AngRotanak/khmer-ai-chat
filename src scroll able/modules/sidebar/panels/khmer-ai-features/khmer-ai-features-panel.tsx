import { useState } from 'react'
import { useApplicationState } from '~/stores/application-state'
import SidebarPanelWrapper from '~/modules/sidebar/components/sidebar-panel-wrapper'
import { useInsertNode } from '~/modules/flow-builder/hooks/use-insert-node'
import { Button } from '~/components/ui/button'
import { NodePreviewKhmer } from '~/modules/sidebar/panels/khmer-ai-nodes/components/node-preview-khmer'
import type { BuilderNodeType } from '~/modules/nodes/types'
import { UnifiedBlockManagerPanel } from './unified-block-manager-panel'
import { BlockManager } from './components/BlockManager'

const KHMER_AI_NODES: {
  type: BuilderNodeType
  icon: string
  title: string
  description: string
}[] = [
  {
    type: 'feature-block',
    icon: 'i-lucide:layout-template',
    title: 'Feature Block',
    description: 'បង្កើតប្លុកប្រតិបត្តិការច្រើនប្រភេទ',
  }
]

export function KhmerAIFeaturesPanel() {
  const { isMobileView, activePanel, setActivePanel } = useApplicationState(s => ({
    isMobileView: s.view.mobile,
    activePanel: s.sidebar.active,
    setActivePanel: s.actions.sidebar.setActivePanel,
  }))

  const insertNode = useInsertNode()
  const [showBlocks, setShowBlocks] = useState(false)

  return (
    <SidebarPanelWrapper>
      {activePanel === 'khmer-ai-features' && (
        <>
          <div className="mt-4 flex flex-col items-center p-4 text-center">
            <div className="size-12 flex items-center justify-center rounded-full bg-teal-800 dark:bg-teal-600">
              <div className="i-mynaui:sparkles size-6 text-white dark:text-light-100" />
            </div>

            <div className="mt-4 text-balance font-medium text-light-100 dark:text-light-100">
              Khmer AI Features
            </div>

            <div className="mt-1 w-2/3 text-xs font-medium leading-normal text-light-50/40 dark:text-light-100/40">
              {isMobileView
                ? ' Tap to insert Khmer AI Features'
                : 'Drag and drop nodes to build Khmer AI Features'}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-4 bg-dark-400 dark:bg-dark-900">
            {KHMER_AI_NODES.map(node => (
              <NodePreviewKhmer
                key={node.type}
                type={node.type}
                icon={node.icon}
                title={node.title}
                description={node.description}
                isMobileView={isMobileView}
                setActivePanel={setActivePanel}
                insertNode={insertNode}
              />
            ))}
          </div>

          <div className="mt-6 border-t border-light-50/10 dark:border-light-100/10 pt-4">
            <div className="text-sm font-semibold text-light-50 dark:text-light-100 mb-2">
              📦 Unified Block Manager
            </div>

            <Button
              onClick={() => setShowBlocks(prev => !prev)}
              variant="secondary"
              className="bg-dark-300 dark:bg-dark-700 text-light-100 dark:text-light-100 hover:bg-dark-400 dark:hover:bg-dark-600"
            >
              {showBlocks ? 'Hide Blocks' : 'Manage Blocks'}
            </Button>

            {showBlocks && (
              <div className="mt-4 bg-dark-400 dark:bg-dark-900 rounded-md p-2">
                <BlockManager />
              </div>
            )}
          </div>
        </>
      )}

      {activePanel === 'unified-block-manager' && (
        <UnifiedBlockManagerPanel />
      )}
    </SidebarPanelWrapper>
  )
}
