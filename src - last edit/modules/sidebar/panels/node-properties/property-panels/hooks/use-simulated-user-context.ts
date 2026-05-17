import { useState } from 'react'

export function useSimulatedUserContext(conditionList: { id: string }[]) {
  const [userContext, setUserContext] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(conditionList.map(c => [c.id, false]))
  )

  return { userContext, setUserContext }
}
