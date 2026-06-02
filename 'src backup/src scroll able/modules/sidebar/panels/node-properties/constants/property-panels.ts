import type { ComponentType } from 'react'
import type { BuilderNodeType } from '~/modules/nodes/types'
import { NODES } from '~/modules/nodes'

// ✅ Auto-register property panels from each node's metadata
export const NODE_PROPERTY_PANEL_COMPONENTS: Partial<Record<BuilderNodeType, ComponentType<{
  id: string
  type: BuilderNodeType
  data: any
  updateData: (data: Partial<any>) => void
}>>> = {}

Object.assign(NODE_PROPERTY_PANEL_COMPONENTS, NODES.reduce((acc, node) => {
  if (node.propertyPanel) {
    acc[node.type] = node.propertyPanel
  }
  return acc
}, {} as typeof NODE_PROPERTY_PANEL_COMPONENTS))

// 📝 Manual fallback (commented out for future reference)
// import SmartWelcomePropertyPanel from '~/modules/sidebar/panels/node-properties/property-panels/smart-welcome-property-panel'
// import GenericTemplatePropertyPanel from '~/modules/sidebar/panels/node-properties/property-panels/generic-template-property-panel'
// import TextMessagePropertyPanel from '~/modules/sidebar/panels/node-properties/property-panels/text-message-property-panel'
// import IntroductionPropertyPanel from '~/modules/sidebar/panels/node-properties/property-panels/introduction-property-panel'
// import UnavailablePropertyPanel from '~/modules/sidebar/panels/node-properties/property-panels/unavailable-property-panel'

// export const NODE_PROPERTY_PANEL_COMPONENTS: Partial<Record<BuilderNodeType, ComponentType<{
//   id: string
//   type: BuilderNodeType
//   data: any
//   updateData: (data: Partial<any>) => void
// }>>> = {
//   'smart-welcome-node': SmartWelcomePropertyPanel,
//   'generic-node': GenericTemplatePropertyPanel,
//   'text-message-node': TextMessagePropertyPanel,
//   'introduction-node': IntroductionPropertyPanel,
//   'unavailable-node': UnavailablePropertyPanel,
// }
