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

export function NodePropertiesPanel() {
  const {
    paneSizes,
    selectedNode,
    setPaneSizes,
    setSelectedNode,
    setActivePanel,
  } = useApplicationState(s => ({
    paneSizes: s.sidebar.panels.nodeProperties.paneSizes,
    setPaneSizes: s.actions.sidebar.panels.nodeProperties.setPaneSizes,
    selectedNode: s.sidebar.panels.nodeProperties.selectedNode,
    setSelectedNode: s.actions.sidebar.panels.nodeProperties.setSelectedNode,
    setActivePanel: s.actions.sidebar.setActivePanel,
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

  const selectedNodeData = useMemo(() => {
    return nodes.find(n => n.id === selectedNode?.id)?.data
  }, [nodes, selectedNode?.id])

  return (
    <SidebarPanelWrapper>
      <SplitPane
        sizes={paneSizes}
        onChange={setPaneSizes}
        split="horizontal"
        sashRender={() => (
          <div className="h-0.5 bg-dark-300 transition hover:h-1 hover:bg-teal-800/50" />
        )}
      >
        {/* Top Pane: Node List */}
        <Pane minSize={200}>
          <div className="h-full flex flex-col">
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

        {/* Bottom Pane: Node Properties */}
        <Pane minSize={300}>
          {/* <div  className="flex flex-col bg-dark-400 dark:bg-dark-900 overflow-hidden"
            style={{ maxHeight: 'calc(var(--vh, 1vh) * 100 - 64px)' }} // 64px = estimated top bar height
          > */}
          <div className="h-full flex flex-col bg-dark-400 dark:bg-dark-900">
            <SidebarPanelHeading className="shrink-0">
              <div className="i-mynaui:cog size-4.5" />
              Properties
            </SidebarPanelHeading>

            <OverlayScrollbarsComponent className="grow" defer options={defaultOverlayScrollbarsOptions}>
              {selectedNode
                ? <NodePropertyPanel id={selectedNode.id} type={selectedNode.type} data={selectedNodeData} nodes={nodes} />
                : <IntroductionPropertyPanel />}
            </OverlayScrollbarsComponent>

          </div>
        </Pane>
      </SplitPane>
    </SidebarPanelWrapper>
  )
}
