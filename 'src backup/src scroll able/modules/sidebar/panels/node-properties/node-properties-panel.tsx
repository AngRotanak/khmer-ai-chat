import { useNodes, useReactFlow } from '@xyflow/react'
import { produce } from 'immer'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { useMemo } from 'react'
import SplitPane, { Pane } from 'split-pane-react'

import { BuilderNode } from '~/modules/nodes/types'
import SidebarPanelHeading from '~/modules/sidebar/components/sidebar-panel-heading'
import SidebarPanelWrapper from '~/modules/sidebar/components/sidebar-panel-wrapper'
import { NodeListItem } from '~/modules/sidebar/panels/node-properties/components/node-list-item'
import { NodePropertyPanel } from '~/modules/sidebar/panels/node-properties/components/node-propery-panel'
import IntroductionPropertyPanel from '~/modules/sidebar/panels/node-properties/property-panels/introduction-property-panel'
import { useNodeList } from '~/modules/sidebar/panels/node-properties/hooks/use-node-list'
import { useApplicationState } from '~/stores/application-state'
import { trackSomethingInNodeProperties } from '~/utils/ga4'
import { defaultOverlayScrollbarsOptions } from '~/utils/overlayscrollbars'
import { SmartWelcomeConfig } from '~/modules/nodes/configs/SmartWelcomeConfig'
import type { BuilderNodeType } from '~/modules/nodes/types'

export function NodePropertiesPanel() {
  const {
    paneSizes,
    selectedNode,
    setPaneSizes,
    setSelectedNode,
  } = useApplicationState(s => ({
    paneSizes: s.sidebar.panels.nodeProperties.paneSizes,
    setPaneSizes: s.actions.sidebar.panels.nodeProperties.setPaneSizes,
    selectedNode: s.sidebar.panels.nodeProperties.selectedNode,
    setSelectedNode: s.actions.sidebar.panels.nodeProperties.setSelectedNode,
  }))

  const nodes = useNodes()
  const nodeList = useNodeList(nodes)
  const { setNodes } = useReactFlow()

  const onNodeClick = (id: string) => {
    setNodes(nds =>
      produce(nds, draft => {
        draft.forEach(node => {
          node.selected = node.id === id
        })
      })
    )

    const clickedNode = nodeList.find(n => n.id === id)
    if (clickedNode) {
      setSelectedNode({ id, type: clickedNode.type as BuilderNode })
    }
  }

  const fullNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNode?.id)
  }, [nodes, selectedNode?.id])

  return (
    <SidebarPanelWrapper>
      <SplitPane
        sizes={paneSizes}
        sashRender={() => (
          <div className="bg-dark-300 dark:bg-dark-600 <md:hover(scale-y-100 h-0.5 transition hover:(scale-y-200 bg-teal-800/50))" />
        )}
        onChange={setPaneSizes}
        split="horizontal"
      >
        <Pane minSize={200}>
          <div className="h-full flex flex-col bg-dark-400 dark:bg-dark-900">
            <SidebarPanelHeading className="shrink-0">
              <div className="i-mynaui:layers-three size-4.5" />
              Nodes in Flow
            </SidebarPanelHeading>

            <OverlayScrollbarsComponent className="grow" defer options={defaultOverlayScrollbarsOptions}>
              <div className="flex flex-col gap-1 p-1.5">
                {nodeList.map(node => (
                  <NodeListItem
                    key={node.id}
                    id={node.type === BuilderNode.START || node.type === BuilderNode.END ? undefined : node.id}
                    title={node.detail.title}
                    icon={`${node.detail.icon} ${node.type === BuilderNode.START || node.type === BuilderNode.END ? 'scale-135' : ''}`}
                    selected={selectedNode?.id === node.id}
                    pseudoSelected={node.selected}
                    chainStatus={node.chainStatus}
                    onClick={() => {
                      trackSomethingInNodeProperties('view-node-properties')
                      onNodeClick(node.id)
                    }}
                  />
                ))}
              </div>
            </OverlayScrollbarsComponent>
          </div>
        </Pane>

        <Pane minSize={300}>
          <div className="h-full flex flex-col bg-dark-400 dark:bg-dark-900">
            <SidebarPanelHeading className="shrink-0">
              <div className="i-mynaui:cog size-4.5" />
              Properties
            </SidebarPanelHeading>

            <OverlayScrollbarsComponent className="grow" defer options={defaultOverlayScrollbarsOptions}>
              {selectedNode ? (
                selectedNode.type === BuilderNode.SMART_WELCOME ? (
                  <SmartWelcomeConfig
                    node={fullNode!}
                    updateNode={(updated) => {
                      setNodes(nds =>
                        produce(nds, draft => {
                          const node = draft.find(n => n.id === updated.id)
                          if (node) node.data = updated.data
                        })
                      )
                    }}
                    setBlocks={(fn) => {
                      setNodes(nds =>
                        produce(nds, draft => {
                          const newBlocks = fn([])
                          draft.push(...newBlocks)
                        })
                      )
                    }}
                    addEdge={(edge) => {
                      const rf = useReactFlow()
                      rf.addEdges([edge])
                    }}
                  />
                ) : fullNode ? (
                  <NodePropertyPanel
                    id={fullNode.id}
                    type={fullNode.type as BuilderNodeType}
                    data={fullNode.data}
                  />
                ) : (
                  <div className="text-red-500 dark:text-red-400">⚠️ Node not found</div>
                )
              ) : (
                <IntroductionPropertyPanel />
              )}
            </OverlayScrollbarsComponent>
          </div>
        </Pane>
      </SplitPane>
    </SidebarPanelWrapper>
  )
}
