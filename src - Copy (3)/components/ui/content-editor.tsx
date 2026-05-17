import { Input, Select, Textarea } from '~/components/ui'
import type {
  TextMessageNodeData,
  GenericTemplateNodeData,
  ImageBlockData,
  VideoBlockData,
  ButtonBlockData,
  VoiceBlockData,
} from '~/modules/nodes/types'

type ContentEditorProps = {
  value:
    | TextMessageNodeData
    | GenericTemplateNodeData
    | ImageBlockData
    | VideoBlockData
    | ButtonBlockData
    | VoiceBlockData
  onChange: (updated: any) => void
}

export function ContentEditor({ value, onChange }: ContentEditorProps) {
  const type = value?.type ?? 'text-message'

  const update = (patch: any) => onChange({ ...value, ...patch })

  return (
    <div className="space-y-4">
     <Select
        label="Content Type"
        value={type}
        onChange={val => update({ type: val })}
      >
        <option value="text-message">Text Message</option>
        <option value="generic-template">Generic Card</option>
        <option value="image">Image Block</option>
        <option value="video">Video Block</option>
        <option value="button">Button Block</option>
        <option value="voice">Voice Block</option>
      </Select>


      {type === 'text-message' && 'message_kh' in value && (
        <Textarea
          label="Message"
          value={value.message_kh ?? value.message_en ?? ''}
          onChange={e =>
            update({
              message_kh: e.target.value,
              message_en: e.target.value,
            })
          }
        />
      )}

      {type === 'generic-template' && 'cards' in value && (
        <Input
          label="Card Title"
          value={value.cards?.[0]?.title ?? ''}
          onChange={val =>
            update({
              cards: [{ ...value.cards?.[0], title: val }],
            })
          }
        />
      )}

      {type === 'image' && 'image_url' in value && (
        <>
          <Input
            label="Image URL"
            value={value.image_url ?? ''}
            onChange={val => update({ image_url: val })}
          />


       <Input
          label="Alt Text"
          value={value.alt_text_kh ?? value.alt_text_en ?? ''}
          onChange={val =>
            update({
              alt_text_kh: val,
              alt_text_en: val,
            })
          }
        />

        </>
      )}

      {type === 'video' && 'video_url' in value && (
        <>
          <Input
            label="Video URL"
            value={value.video_url ?? ''}
            onChange={val => update({ video_url: val })}
          />
          <Input
            label="Caption"
            value={value.caption_kh ?? value.caption_en ?? ''}
            onChange={val =>
              update({
                caption_kh: val,
                caption_en: val,
              })
            }
          />

        </>
      )}

      {type === 'button' && 'buttons' in value && (
        <Textarea
          label="Button JSON"
          value={JSON.stringify(value.buttons ?? [], null, 2)}
          onChange={e => {
            try {
              const parsed = JSON.parse(e.target.value)
              update({ buttons: parsed })
            } catch {
              // ignore invalid JSON
            }
          }}
        />
      )}

     {type === 'voice' && 'audio_url' in value && (
        <>
          <Input
            label="Audio URL"
            value={value.audio_url ?? ''}
            onChange={val => update({ audio_url: val })}
          />
          <Textarea
            label="Transcript"
            value={value.transcript_kh ?? value.transcript_en ?? ''}
            onChange={val =>
              update({
                transcript_kh: val,
                transcript_en: val,
              })
            }
          />
        </>
      )}

    </div>
  )
}
