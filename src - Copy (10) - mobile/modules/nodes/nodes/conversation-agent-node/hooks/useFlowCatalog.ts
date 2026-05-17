import { useApplicationState } from '~/stores/application-state'

export function useFlowCatalog() {
  const flowList = useApplicationState(s => s.flowList)

  const flows = flowList
    .filter(flow => flow.type === 'flow' && flow.id.startsWith('FLOW::'))
    .map(flow => ({
      name: flow.name.replace(/_/g, ' '),
      payload: flow.id, // use id as the payload string
    }))

  return { flows }
}
