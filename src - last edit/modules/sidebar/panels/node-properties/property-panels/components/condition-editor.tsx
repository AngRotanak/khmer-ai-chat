import React from 'react'
import { ConditionPreviewPanel } from './ConditionPreviewPanel'
import { UserContextSimulator } from './UserContextSimulator'

type ConditionEditorProps = {
  condition: { id: string; condition: string } | null
  onChange: (value: { id: string; condition: string } | null) => void
  userContext: Record<string, boolean>
  setUserContext: (ctx: Record<string, boolean>) => void
  DropdownComponent: React.FC<{
    value: { id: string; condition: string } | null
    onChange: (value: { id: string; condition: string } | null) => void
  }>
  conditionList: { id: string; condition: string }[] // ✅ Add this line
}


export function ConditionEditor({
  condition,
  onChange,
  userContext,
  setUserContext,
  DropdownComponent,
  conditionList,
}: ConditionEditorProps) {
  return (
    <div className="flex flex-col p-4">
      <div className="text-xs text-light-900/50 font-medium">Trigger Condition</div>
      <div className="mt-2 flex">
        <DropdownComponent value={condition} onChange={onChange} />
      </div>

      <ConditionPreviewPanel condition={condition} userContext={userContext} />
      <UserContextSimulator
        value={userContext}
        onChange={setUserContext}
        conditionList={conditionList}
      />

    </div>
  )
}
