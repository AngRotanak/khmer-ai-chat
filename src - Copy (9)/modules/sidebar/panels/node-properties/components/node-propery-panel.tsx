import type { BuilderNodeType } from '~/modules/nodes/types'
import { NODE_PROPERTY_PANEL_COMPONENTS } from '~/modules/sidebar/panels/node-properties/constants/property-panels'
import UnavailableNodePropertyPanel from '~/modules/sidebar/panels/node-properties/property-panels/unavailable-property-panel'

type NodePropertyPanelProps = Readonly<{
  id: string
  type: BuilderNodeType
  selectedPathId?: string
}>

export function NodePropertyPanel({ id, type, selectedPathId }: NodePropertyPanelProps) {
  const PanelComponent = NODE_PROPERTY_PANEL_COMPONENTS[type]

return PanelComponent
  ? <PanelComponent id={id} type={type} selectedPathId={selectedPathId} />
  : <UnavailableNodePropertyPanel />

}
