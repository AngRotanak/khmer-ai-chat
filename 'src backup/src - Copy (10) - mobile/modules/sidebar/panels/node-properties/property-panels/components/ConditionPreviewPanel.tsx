import { useMemo } from 'react'

type Props = {
  condition: { id: string; condition: string } | null
  userContext: Record<string, boolean>
}

export function ConditionPreviewPanel({ condition, userContext }: Props) {
  const isDeliverable = useMemo(() => {
    if (!condition?.id) return true
    return Boolean(userContext?.[condition.id])
  }, [condition, userContext])

  return (
    <div className="mt-4 p-3 rounded bg-dark-700 text-sm text-light-100 border border-dark-500">
      <div className="font-semibold mb-1">Delivery Preview</div>
      {condition?.id ? (
        <div>
          <div className="text-xs text-light-900/60 mb-1">
            Condition: <span className="font-medium">{condition.condition}</span>
          </div>
          {isDeliverable ? (
            <div className="text-teal-400">✅ Block will deliver under current user context</div>
          ) : (
            <div className="text-red-400">🚫 Block will be skipped — condition not met</div>
          )}
        </div>
      ) : (
        <div className="text-light-100/60 italic">No condition set — block will always deliver</div>
      )}
    </div>
  )
}
