import { TextArea } from './TextArea'

interface LangToggleProps {
  label: string
  activeLang: 'EN' | 'KH'
  setActiveLang: (lang: 'EN' | 'KH') => void
  enValue: string
  khValue: string
  onChangeEN: (val: string) => void
  onChangeKH: (val: string) => void
  placeholderEN: string
  placeholderKH: string
}

export function LangToggle({
  label,
  activeLang,
  setActiveLang,
  enValue,
  khValue,
  onChangeEN,
  onChangeKH,
  placeholderEN,
  placeholderKH
}: LangToggleProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
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

      {activeLang === 'EN' ? (
        <TextArea
          label=""
          value={enValue}
          onChange={(val) => onChangeEN(val)}   // ✅ val is already a string
          placeholder={placeholderEN}
        />
      ) : (
        <TextArea
          label=""
          value={khValue}
          onChange={(val) => onChangeKH(val)}   // ✅ val is already a string
          placeholder={placeholderKH}
        />
      )}
    </div>
  )
}
