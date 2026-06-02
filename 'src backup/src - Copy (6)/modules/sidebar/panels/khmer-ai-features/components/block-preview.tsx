import type { BotBlock } from '~/modules/nodes/types'

export function BlockPreview({ block }: { block: BotBlock }) {
  const kh = block.content.kh
  const en = block.content.en

  return (
    <div className="p-4 space-y-4 border-t border-light-50/10 mt-4">
      <div className="text-xs font-bold text-teal-600">👁 Preview</div>

      <div className="text-sm text-light-50/80">
        <strong>Type:</strong> {block.type}
      </div>

      {block.key && (
        <div className="text-sm text-light-50/80">
          <strong>Key:</strong> {block.key}
        </div>
      )}

      {block.intent && (
        <div className="text-sm text-light-50/80">
          <strong>Intent:</strong> {block.intent}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div>
          <div className="text-xs font-bold text-light-50/60">🇰🇭 Khmer</div>
          {kh?.type === 'text-message' && <div>{kh.message_kh}</div>}
          {kh?.type === 'generic-template' && <div>{kh.cards?.[0]?.title}</div>}
          {kh?.type === 'image' && <div>🖼️ Image: {kh.image_url}</div>}
          {kh?.type === 'video' && <div>🎥 Video: {kh.video_url}</div>}
          {kh?.type === 'button' && <div>🔘 {kh.buttons?.length} buttons</div>}
          {kh?.type === 'voice' && <div>🎙️ Audio: {kh.audio_url}</div>}
        </div>

        <div>
          <div className="text-xs font-bold text-light-50/60">🇬🇧 English</div>
          {en?.type === 'text-message' && <div>{en.message_en}</div>}
          {en?.type === 'generic-template' && <div>{en.cards?.[0]?.title}</div>}
          {en?.type === 'image' && <div>🖼️ Image: {en.image_url}</div>}
          {en?.type === 'video' && <div>🎥 Video: {en.video_url}</div>}
          {en?.type === 'button' && <div>🔘 {en.buttons?.length} buttons</div>}
          {en?.type === 'voice' && <div>🎙️ Audio: {en.audio_url}</div>}
        </div>
      </div>
    </div>
  )
}
