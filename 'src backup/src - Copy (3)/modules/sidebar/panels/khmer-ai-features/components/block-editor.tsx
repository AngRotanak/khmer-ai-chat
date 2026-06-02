import { useState } from 'react'
import type { BotBlock } from '~/modules/nodes/types'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { TabGroup } from '~/components/ui/tab-group'
import { TagEditor } from '~/components/ui/tag-editor'
import { ContentEditor } from '~/components/ui/content-editor'
import { BlockPreview } from './block-preview'

export function BlockEditor({
  block,
  onSave,
  onDelete,
}: {
  block: BotBlock
  onSave: (updated: BotBlock) => void
  onDelete: (id: string) => void
}) {
  const [lang, setLang] = useState<'kh' | 'en'>('kh')
  const [draft, setDraft] = useState<BotBlock>(block)

  const update = (patch: Partial<BotBlock>) =>
    setDraft(prev => ({ ...prev, ...patch }))

  const updateConfig = (patch: any) =>
    setDraft(prev => ({ ...prev, config: { ...prev.config, ...patch } }))

  const updateContent = (lang: 'kh' | 'en', patch: any) =>
    setDraft(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [lang]: { ...prev.content?.[lang], ...patch },
      },
    }))

//   const blockTypeOptions = [
//   { label: 'Smart Welcome', value: 'smart_welcome' },
//   { label: 'Info Block', value: 'info' },
//   { label: 'Product Block', value: 'product' },
//   { label: 'Quick Menu', value: 'quick_menu' },
//   { label: 'Intent Block', value: 'intent' },
// ] as const



  return (
    <div className="p-4 space-y-4">
      



      {draft.type === 'info' && (
        <Input
          label="Info Key"
          value={draft.key ?? ''}
          onChange={val => update({ key: val })}
        />
      )}

      {draft.type === 'intent' && (
        <Input
          label="Intent Keyword"
          value={draft.intent ?? ''}
          onChange={val => update({ intent: val })}
        />
      )}

     




      {draft.type === 'product' && (
        <TagEditor
          label="Promo Tags"
          value={draft.config?.promoTags ?? []}
          onChange={val => updateConfig({ promoTags: val })}
        />
      )}

      <TabGroup
        tabs={['kh', 'en']}
        selected={lang}
        onChange={val => setLang(val as 'kh' | 'en')}
      />


      <ContentEditor
        value={draft.content?.[lang]}
        onChange={val => updateContent(lang, val)}
      />

      <div className="flex gap-2 pt-2">
        <Button onClick={() => onSave(draft)}>💾 Save</Button>
        <Button onClick={() => onDelete(draft.id)}>🗑 Delete</Button>
      </div>

      <BlockPreview block={draft} />
    </div>
  )
}
