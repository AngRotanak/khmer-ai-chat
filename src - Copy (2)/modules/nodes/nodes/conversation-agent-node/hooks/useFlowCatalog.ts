import { useApplicationState } from '~/stores/application-state'

export function useFlowCatalog() {
  const flowList = useApplicationState(s => s.flowList)

  const flows = flowList
    .filter(payload => typeof payload === 'string' && payload.startsWith('FLOW::'))
    .map(payload => ({
      name: payload.replace('FLOW::', '').replace(/_/g, ' '),
      payload
    }))

  return { flows }
}
