import {
  TextField,
  TextArea,
  TagListField,
  SwitchField,
  SelectField,
  NumberField,
  RepeaterField,
  FlowSelector
} from '~/modules/nodes/nodes/conversation-agent-node/components/fields'

import { useLang } from '~/helpers/use-lang'
import type { ConversationAgentNodeData, SubIntentConfig } from '~/modules/nodes/types'
import type { NodePropertyPanelProps } from '~/modules/sidebar/panels/node-properties/constants/property-panels'
import SidebarPanelWrapper from '~/modules/sidebar/components/sidebar-panel-wrapper'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { defaultOverlayScrollbarsOptions } from '~/utils/overlayscrollbars.ts'

const isValidIntentId = (id: string) =>
  typeof id === 'string' &&
  id.trim() !== '' &&
  !id.startsWith('_') &&
  !id.includes('#') &&
  !id.includes('/') &&
  !id.includes('[') &&
  !id.includes(']')

export default function ConversationAgentPropertyPanel({
  id,
  data,
  updateData,
  nodes,
}: NodePropertyPanelProps & { data: ConversationAgentNodeData }) {
  const t = useLang()
  const props = data

  const update = (patch: Partial<ConversationAgentNodeData>) => {
    updateData({ ...props, ...patch })
  }

  return (
    <SidebarPanelWrapper>
      <OverlayScrollbarsComponent className="grow" defer options={defaultOverlayScrollbarsOptions}>
        <div className="rounded bg-dark-700 p-3 space-y-4 relative">

          {/* Topic Name */}
          <div className="flex flex-col">
            <TextField
              label={t('TopicName')}
              value={props.topic}
              onChange={val => update({ topic: val })}
              placeholder={t('TopicNamePlaceholder')}
            />
          </div>

          {/* Trigger Keywords */}
          <div className="flex flex-col">
            <RepeaterField<{
              keyword: string
              match: 'includes' | 'equals' | 'startsWith'
            }>
              label={t('TriggerKeywords')}
              value={props.trigger_keywords ?? []}
              onChange={val => update({ trigger_keywords: val })}
              createDefault={() => ({ keyword: '', match: 'includes' })}
              fields={(kw, updateKw) => (
                <div className="flex gap-2 items-center">
                  <TextField
                    label={t('Keyword')}
                    value={kw.keyword}
                    onChange={val => updateKw({ keyword: val })}
                  />
                  <SelectField
                    label={t('Match')}
                    value={kw.match}
                    options={[
                      { label: t('Includes'), value: 'includes' },
                      { label: t('Equals'), value: 'equals' },
                      { label: t('Starts With'), value: 'startsWith' }
                    ]}
                    onChange={val =>
                      updateKw({ match: val as 'includes' | 'equals' | 'startsWith' })
                    }
                  />
                </div>
              )}
            />
          </div>

          {/* Trigger Intents */}
          <div className="flex flex-col">
            <TagListField
              label={t('TriggerIntents')}
              value={props.trigger_intents}
              onChange={val => update({ trigger_intents: val })}
              placeholder={t('TriggerIntentsPlaceholder')}
            />
          </div>

          {/* Welcome Message */}
          <div className="flex flex-col">
            <TextArea
              label={t('WelcomeMessage')}
              value={props.welcome_message}
              onChange={val => update({ welcome_message: val })}
              placeholder={t('WelcomeMessagePlaceholder')}
            />
          </div>

          {/* Context Lock */}
          <div className="flex flex-col">
            <SwitchField
              label={t('LockConversationContext')}
              value={props.context_lock}
              onChange={val => update({ context_lock: val })}
            />
          </div>

          {/* Fallback Message */}
          <div className="flex flex-col">
            <TextArea
              label={t('FallbackMessage')}
              value={props.fallback_message}
              onChange={val => update({ fallback_message: val })}
              placeholder={t('FallbackMessagePlaceholder')}
            />
          </div>

          {/* SubIntent Routing */}
          <div className="flex flex-col">
            <RepeaterField<SubIntentConfig>
              label={t('SubIntentRouting')}
              value={props.sub_intents}
              onChange={val => update({ sub_intents: val })}
              createDefault={() => ({
                id: '',
                reply_type: 'auto-reply',
                confidence_threshold: 0.7,
                reply_message: '',
                flow_payload: '',
                reply_media: undefined,
                preview_override: undefined,
                trigger_keyword_conditions: []
              })}
              fields={(intent, updateIntent) => {
                const isValid = isValidIntentId(intent.id)

                return (
                  <div className="rounded-lg border border-dark-300 dark:border-teal-700 bg-dark-100 dark:bg-dark-900 p-3 space-y-2">
                    <TextField
                      label={t('IntentID')}
                      value={intent.id ?? ''}
                      onChange={val => updateIntent({ id: val })}
                    />
                    {!isValid && (
                      <div className="text-xs text-red-500">
                        ⚠️ Invalid ID: avoid _, #, /, [, ]
                      </div>
                    )}

                    <SelectField
                      label={t('ReplyType')}
                      value={intent.reply_type ?? 'auto-reply'}
                      options={[
                        { label: '💬 Auto Reply', value: 'auto-reply' },
                        { label: '🔁 Trigger Flow', value: 'trigger-flow' },
                        { label: '💬+🔁 Both', value: 'both' }
                      ]}
                      onChange={val => updateIntent({ reply_type: val })}
                    />

                    <NumberField
                      label={t('ConfidenceThreshold')}
                      value={intent.confidence_threshold ?? 0.7}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={val => updateIntent({ confidence_threshold: val })}
                    />

                    <TextArea
                      label={t('ReplyMessage')}
                      value={intent.reply_message ?? ''}
                      onChange={val => updateIntent({ reply_message: val })}
                    />

                    <FlowSelector
                      label={t('FlowToTrigger')}
                      value={intent.flow_payload ?? ''}
                      onChange={val => updateIntent({ flow_payload: val })}
                    />

                    <RepeaterField<{
                      keyword: string
                      match: 'includes' | 'equals' | 'startsWith'
                    }>
                      label={t('TriggerKeywords')}
                      value={intent.trigger_keyword_conditions ?? []}
                      onChange={val => updateIntent({ trigger_keyword_conditions: val })}
                      createDefault={() => ({ keyword: '', match: 'includes' })}
                      fields={(kw, updateKw) => (
                        <div className="flex gap-2 items-center">
                          <TextField
                            label={t('Keyword')}
                            value={kw.keyword}
                            onChange={val => updateKw({ keyword: val })}
                          />
                          <SelectField
                            label={t('Match')}
                            value={kw.match}
                            options={[
                              { label: t('Includes'), value: 'includes' },
                              { label: t('Equals'), value: 'equals' },
                              { label: t('Starts With'), value: 'startsWith' }
                            ]}
                            onChange={val =>
                              updateKw({ match: val as 'includes' | 'equals' | 'startsWith' })
                            }
                          />
                        </div>
                      )}
                    />
                  </div>
                )
              }}
            />
          </div>
        </div>
      </OverlayScrollbarsComponent>
    </SidebarPanelWrapper>
  )
}
