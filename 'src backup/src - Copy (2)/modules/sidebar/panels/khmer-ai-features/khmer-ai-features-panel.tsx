import { useApplicationState } from '~/stores/application-state'
import SidebarPanelWrapper from '~/modules/sidebar/components/sidebar-panel-wrapper'
import { useInsertNode } from '~/modules/flow-builder/hooks/use-insert-node'
import { NodePreviewKhmer } from '~/modules/sidebar/panels/khmer-ai-nodes/components/node-preview-khmer'
import type { BuilderNodeType } from '~/modules/nodes/types'
import { useLang } from '~/helpers/use-lang'
import { IntentManagerPanel } from './Intent-manager-panel' // adjust path as needed
import { useState } from 'react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { defaultOverlayScrollbarsOptions } from '~/utils/overlayscrollbars.ts'

export const IconTapBox = ({ icon }: { icon: string }) => (
  <div className="size-10 flex items-center justify-center rounded-xl  border border-dark-200 dark:border-dark-700 bg-dark-300 dark:bg-dark-800">
    <div className={`${icon} size-6 text-white dark:text-teal-300`} />
  </div>
)

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
    },
    {
      type: 'conversation-agent',
      icon: 'i-lucide:focus',
      title: 'Conversation Agent',
      description: 'បង្កើតប្រធានបទសន្ទនាដែលមាន sub-intents និង context lock សម្រាប់ Messenger'
    }
  ]


export function KhmerAIFeaturesPanel() {
  const { isMobileView, activePanel, setActivePanel } = useApplicationState(s => ({
    isMobileView: s.view.mobile,
    activePanel: s.sidebar.active,
    setActivePanel: s.actions.sidebar.setActivePanel,
  }))
  const [showIntentManager, setShowIntentManager] = useState(false)

  const t = useLang()
  const insertNode = useInsertNode()

  return (
    <SidebarPanelWrapper>
      {/* Close Button */}
      <div className="flex justify-end px-3 pt-3">
        <button
          onClick={() => setActivePanel('none')}
          className="text-xs text-light-100/50 hover:text-light-100 dark:text-light-100/40 dark:hover:text-white transition"
          title="Close"
        >
          <div className="i-mynaui:x size-4" />
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col items-center p-4 text-center">
        <div className="size-12 flex items-center justify-center rounded-full bg-teal-800 dark:bg-teal-600">
          <div className="i-mynaui:sparkles size-6 text-white dark:text-light-100" />
        </div>

        <div className="mt-4 text-balance font-medium text-light-100 dark:text-light-100">
          {t('KhmerAIFeatures')}
        </div>

        <div className="mt-1 w-2/3 text-xs font-medium leading-normal text-light-50/40 dark:text-light-100/40">
          {isMobileView
            ? t('Tap_to_insert_Khmer_AI_Features')
            : t('Drag_and_drop_nodes_to_build_Khmer_AI_Features')}
        </div>
      </div>

      <OverlayScrollbarsComponent className="grow" defer options={defaultOverlayScrollbarsOptions}>
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
      </OverlayScrollbarsComponent>

      {/* Scrollable Content */}
      <div className="grow overflow-y-auto scrollbar-thin scrollbar-thumb-teal-600 scrollbar-track-dark-800">
        <div className="flex justify-center">
          <div
            onClick={() => setShowIntentManager(!showIntentManager)}
            className="cursor-pointer flex items-center  gap-3 p-5 rounded-xl w-[275px] border border-dark-300 dark:border-dark-700 bg-dark-200 dark:bg-dark-900 hover:border-teal-500 transition"
          >
            <div className="i-lucide:bot size-6 text-white dark:text-teal-300" />
            <div className="text-sm font-medium text-light-100 dark:text-light-100">
              Manage Custom Intents
            </div>
          </div>
        </div>

        {/* KEEP THIS */}
        <div className="border-t border-dark-300 dark:border-dark-700 mt-4 pt-4 px-4">
          {showIntentManager && <IntentManagerPanel />}
        </div>
      </div>
    </SidebarPanelWrapper >
  )
}
