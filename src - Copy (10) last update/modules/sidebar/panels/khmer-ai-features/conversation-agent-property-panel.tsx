import type { Node } from '@xyflow/react'
import { useCanvasStore } from '~/stores/canvas-store'
import { useFlowSession } from '~/stores/flow-session'
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
import type { ConversationAgentNodeData, SubIntentConfig, MatchMode, TriggerKeyword } from '~/modules/nodes/types'
import SidebarPanelWrapper from '~/modules/sidebar/components/sidebar-panel-wrapper'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { defaultOverlayScrollbarsOptions } from '~/utils/overlayscrollbars.ts'
import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '~/lib/firebase'
import { useApplicationState } from '~/stores/application-state'



export interface NodePropertyPanelProps {
  id: string
  nodes: Node[]
}


export default function ConversationAgentPropertyPanel({
  id,
}: NodePropertyPanelProps) {
  const node = useCanvasStore(s => s.nodes.find(n => n.id === id))
  const data = node?.data as ConversationAgentNodeData | undefined
  const [availableIntents, setAvailableIntents] = useState<{ id: string; name: string }[]>([])
  const flowList = useApplicationState(s => s.flowList)
  const t = useLang()

  const { currentPageId } = useFlowSession()
  if (!currentPageId) {
    return <div>Please select a page first</div>
  }


  useEffect(() => {
    const intentRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/agents/intents`)
    onValue(intentRef, snapshot => {
      const data = snapshot.val()
      const result = Object.entries(data ?? {}).map(([key, value]: [string, any]) => ({
        id: key,
        name: value.display_name?.kh || value.display_name?.en || key,
      }))
      setAvailableIntents(result)
    })
  }, [currentPageId])



  // 👇 Add this line 
  const [activeLang, setActiveLang] = useState<'EN' | 'KH'>('KH')
  const [activeFallbackLang, setActiveFallbackLang] = useState<'EN' | 'KH'>('KH')
  const [activeResponseLang, setActiveResponseLang] = useState<'EN' | 'KH'>('KH')
  if (!data) {
    return <div className="text-red-500">⚠️ Invalid node</div>
  }

  const props = data

  const update = (patch: Partial<ConversationAgentNodeData>) => {
    console.log('Updating node data with patch:', patch)
    useCanvasStore.getState().updateNodeData(id, patch)
  }

  return (
    <SidebarPanelWrapper>
      <OverlayScrollbarsComponent
        className="grow"
        defer
        options={defaultOverlayScrollbarsOptions}
      >
        <div className="rounded bg-dark-700 p-3 space-y-4 relative">

          {/* Topic Name */}
          <TextField
            label={t('TopicName')}
            value={props.topic}
            onChange={val => update({ topic: val })}
            placeholder={t('TopicNamePlaceholder')}
          />

          {/* Activation Toggle */}
          <SwitchField
            label={t('AgentActive')}
            value={props.is_active}
            onChange={val => update({ is_active: val })}
          />



          {/* Trigger Keywords with Match Mode */}
          <RepeaterField<TriggerKeyword>
            label={t('TriggerKeywords')}
            value={props.trigger_keywords ?? []} // ✅ fallback to []
            onChange={val => update({ trigger_keywords: val })}
            createDefault={() => ({ keyword: '', match: 'includes' })}
            fields={(kw, updateKw) => (
              <div className="flex gap-2 items-center">
                {/* Always show keyword unless regex is selected */}
                {kw.match !== 'regex' && (
                  <TextField
                    label={t('Keyword')}
                    value={kw.keyword}
                    onChange={val => updateKw({ keyword: val })}
                  />
                )}

                <SelectField
                  label={t('Match')}
                  value={kw.match}
                  options={[
                    { label: t('Includes'), value: 'includes' },
                    { label: t('Equals'), value: 'equals' },
                    { label: t('Starts With'), value: 'startsWith' },
                    { label: t('Regex'), value: 'regex' }
                  ]}
                  onChange={val => updateKw({ match: val as MatchMode })}
                />

                {kw.match === 'regex' && (
                  <TextField
                    label={t('RegexPattern')}
                    value={kw.regex_pattern ?? ''}
                    onChange={val => updateKw({ regex_pattern: val })}
                    placeholder="/^pattern$/"
                  />
                )}
              </div>
            )}
          />


          {/* Trigger Intents */}
          <SelectField
            label={t('MainIntent')}
            value={props.intent_id}
            options={availableIntents.map(i => ({ label: i.name, value: i.id }))}
            onChange={val => update({ intent_id: val })}
          />


          <NumberField
            label={t('ConfidenceThreshold')}
            value={props.confidence_threshold ?? 0.6}
            min={0}
            max={1}
            step={0.01}
            onChange={val => update({ confidence_threshold: val })}
          />


          <FlowSelector
            label={t('PayloadReference')}
            value={props.flow_payload}
            onChange={val => update({ flow_payload: val })}
            flows={flowList}
          />



          {/* Escape Keywords */}
          <TagListField
            label={t('EscapeKeywords')}
            value={props.escape_keywords ?? []} // ✅ fallback
            onChange={val => update({ escape_keywords: val })}
            placeholder={t('EscapeKeywordsPlaceholder')}
          />

          {/* Wellcome Message EN/KH */}
          <div className="mb-3">
            {/* Label row with inline toggle */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{t('WelcomeMessage')}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  className={activeLang === 'EN'
                    ? 'px-2 py-0.5 rounded bg-teal-600 text-white text-xs'
                    : 'px-2 py-0.5 rounded bg-dark-200 text-muted text-xs'}
                  onClick={() => setActiveLang('EN')}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={activeLang === 'KH'
                    ? 'px-2 py-0.5 rounded bg-teal-600 text-white text-xs'
                    : 'px-2 py-0.5 rounded bg-dark-200 text-muted text-xs'}
                  onClick={() => setActiveLang('KH')}
                >
                  KH
                </button>
              </div>
            </div>

            {/* Conditional TextArea */}
            {activeLang === 'EN' ? (
              <TextArea
                label="" // 👈 leave label empty, since we already render it above
                value={props.welcome_message_en}
                onChange={val => update({ welcome_message_en: val })}
                placeholder={t('WelcomeMessagePlaceholderEN')}
              />
            ) : (
              <TextArea
                label=""
                value={props.welcome_message_kh}
                onChange={val => update({ welcome_message_kh: val })}
                placeholder={t('WelcomeMessagePlaceholderKH')}
              />
            )}
          </div>

          {/* Context Lock */}
          <SwitchField
            label={t('LockConversationContext')}
            value={props.context_lock}
            onChange={val => update({ context_lock: val })}
          />

          {/* Fallback Message EN/KH */}
          <div className="mb-3">
            {/* Label row with inline toggle */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{t('FallbackMessage')}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  className={activeFallbackLang === 'EN'
                    ? 'px-2 py-0.5 rounded bg-teal-600 text-white text-xs'
                    : 'px-2 py-0.5 rounded bg-dark-200 text-muted text-xs'}
                  onClick={() => setActiveFallbackLang('EN')}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={activeFallbackLang === 'KH'
                    ? 'px-2 py-0.5 rounded bg-teal-600 text-white text-xs'
                    : 'px-2 py-0.5 rounded bg-dark-200 text-muted text-xs'}
                  onClick={() => setActiveFallbackLang('KH')}
                >
                  KH
                </button>
              </div>
            </div>

            {/* Conditional TextArea */}
            {activeFallbackLang === 'EN' ? (
              <TextArea
                label="" // label handled above
                value={props.fallback_message_en}
                onChange={val => update({ fallback_message_en: val })}
                placeholder={t('FallbackMessagePlaceholderEN')}
              />
            ) : (
              <TextArea
                label=""
                value={props.fallback_message_kh}
                onChange={val => update({ fallback_message_kh: val })}
                placeholder={t('FallbackMessagePlaceholderKH')}
              />
            )}
          </div>


          {/* Lock/Release Flags */}
          <SwitchField
            label={t('LockOnEntry')}
            value={props.lock_on_entry}
            onChange={val => update({ lock_on_entry: val })}
          />
          <SwitchField
            label={t('ReleaseOnComplete')}
            value={props.release_on_complete}
            onChange={val => update({ release_on_complete: val })}
          />

          {/* SubIntent Routing */}

          <RepeaterField<SubIntentConfig>
            label={t('SubIntentRouting')}
            value={props.sub_intents ?? []} // ✅ fallback to []
            onChange={val => update({ sub_intents: val })}
            createDefault={() => ({
              id: '',
              confidence_threshold: 0.7,
              reply_message_en: '',
              reply_message_kh: '',
              flow_payload: '',
              release_on_complete: false,
              escape_keywords: [],
              trigger_keyword_conditions: []
            })}
            fields={(intent, updateIntent) => (
              <div className="rounded-lg border border-dark-300 dark:border-teal-700 bg-dark-100 dark:bg-dark-900 p-3 space-y-2">
                {/* Intent Dropdown */}
                <SelectField
                  label={t('SubIntent')}
                  value={intent.id}
                  options={availableIntents.map(i => ({ label: i.name, value: i.id }))}
                  onChange={val => updateIntent({ id: val })}
                />

                {/* Payload Reference */}
                <FlowSelector
                  label={t('PayloadReference')}
                  value={intent.flow_payload}
                  onChange={val => updateIntent({ flow_payload: val })}
                  flows={flowList}
                />

                {/* Trigger Keywords */}
                <RepeaterField<{ keyword: string; match: MatchMode }>
                  label={t('SubIntentKeywords')}
                  value={intent.trigger_keyword_conditions}
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
                          { label: t('Starts With'), value: 'startsWith' },
                          { label: t('Regex'), value: 'regex' }
                        ]}
                        onChange={val => updateKw({ match: val as MatchMode })}
                      />
                    </div>
                  )}
                />

                {/* Confidence Threshold */}
                <NumberField
                  label={t('ConfidenceThreshold')}
                  value={intent.confidence_threshold}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={val => updateIntent({ confidence_threshold: val })}
                />

                {/* Release on Complete */}
                <SwitchField
                  label={t('ReleaseOnComplete')}
                  value={intent.release_on_complete}
                  onChange={val => updateIntent({ release_on_complete: val })}
                />

                {/* Escape Keywords */}
                <TagListField
                  label={t('EscapeKeywords')}
                  value={intent.escape_keywords}
                  onChange={val => updateIntent({ escape_keywords: val })}
                  placeholder={t('EscapeKeywordsPlaceholder')}
                />

                {/* Responses EN/KH */}
                <div className="mb-3">
                  {/* Label row with inline toggle */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{t('Responses')}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className={activeResponseLang === 'EN'
                          ? 'px-2 py-0.5 rounded bg-teal-600 text-white text-xs'
                          : 'px-2 py-0.5 rounded bg-dark-200 text-muted text-xs'}
                        onClick={() => setActiveResponseLang('EN')}
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        className={activeResponseLang === 'KH'
                          ? 'px-2 py-0.5 rounded bg-teal-600 text-white text-xs'
                          : 'px-2 py-0.5 rounded bg-dark-200 text-muted text-xs'}
                        onClick={() => setActiveResponseLang('KH')}
                      >
                        KH
                      </button>
                    </div>
                  </div>

                  {/* Conditional TextArea */}
                  {activeResponseLang === 'EN' ? (
                    <TextArea
                      label=""
                      value={intent.reply_message_en}
                      onChange={val => updateIntent({ reply_message_en: val })}
                      placeholder={t('ReplyMessagePlaceholderEN')}
                    />
                  ) : (
                    <TextArea
                      label=""
                      value={intent.reply_message_kh}
                      onChange={val => updateIntent({ reply_message_kh: val })}
                      placeholder={t('ReplyMessagePlaceholderKH')}
                    />
                  )}
                </div>
              </div>
            )}
          />


          {/* Metadata Footer */}
          <div className="text-xs text-muted">
            {t('LastUpdated')}: {props.last_updated ?? '—'}
          </div>
        </div>
      </OverlayScrollbarsComponent>
    </SidebarPanelWrapper>
  )

}
