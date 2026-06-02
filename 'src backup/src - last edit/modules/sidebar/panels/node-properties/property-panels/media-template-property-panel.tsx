
import type { NodePropertyPanelProps } from '~/modules/sidebar/panels/node-properties/constants/property-panels'
import type { MediaTemplateNodeData } from '~/modules/nodes/types'
import Picker from '@emoji-mart/react'
import emojiData from '@emoji-mart/data'
import { useApplicationState } from '~/stores/application-state'
import { ConditionDropdownSelector } from '~/modules/nodes/nodes/conditional-path-node/components/condition-dropdown-selector'
import { storage, db } from '~/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { nanoid } from 'nanoid' // optional for unique filenames
// import { setDoc, doc, serverTimestamp } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
// import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import {  useState } from 'react'

function isMessengerSafePayload(id: string): boolean {
  return (
    typeof id === 'string' &&
    id.trim() !== '' &&
    !id.startsWith('_') &&
    !id.includes('#') &&
    !id.includes('/') &&
    !id.includes('[') &&
    !id.includes(']')
  )
}

export default function MediaTemplatePropertyPanel({
  id,
  data,
  updateData,
}: NodePropertyPanelProps & { data: MediaTemplateNodeData }) {
  const flowList = useApplicationState(s => s.flowList)
  const [language, setLanguage] = useState<'en' | 'kh'>('kh')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const auth = getAuth()
  const adminId = auth.currentUser?.uid

  const introText = language === 'kh' ? data.intro_text?.kh ?? '' : data.intro_text?.en ?? ''
  const option = data.options?.[0] ?? {
    label_en: '',
    label_kh: '',
    type: 'postback',
    payload: '',
    url: '',
  }

  const setLanguageAndSave = (lang: 'en' | 'kh') => {
    setLanguage(lang)
    localStorage.setItem('builder-language', lang)
  }

  const updateIntroText = (text: string) => {
    updateData({
      intro_text: {
        ...data.intro_text,
        [language]: text.slice(0, 320),
      },
    })
  }

  const updateOption = (patch: Partial<typeof option>) => {
    updateData({ options: [{ ...option, ...patch }] })
  }

  const handleUpload = async (file: File) => {
    const ext = file.name.split('.').pop()
    const filename = `${nanoid()}.${ext}`
    const fileRef = ref(storage, `uploads/${filename}`)

    await uploadBytes(fileRef, file)
    const url = await getDownloadURL(fileRef)

    updateData({
      media_url: url,
      media_type: file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
          ? 'video'
          : 'audio',
    })

    if (!adminId) {
      console.error('Admin ID is missing — cannot log upload.')
      return
    }

    // const safeFilename = file.name.replace(/[^\w.-]/g, '_')

    // await setDoc(doc(db, 'admin_uploads', `${adminId}_${safeFilename}`), {
    //   admin_id: adminId,
    //   filename: file.name,
    //   media_url: url,
    //   media_type: file.type.startsWith('image/')
    //     ? 'image'
    //     : file.type.startsWith('video/')
    //       ? 'video'
    //       : 'audio',
    //   size: file.size,
    //   uploaded_at: serverTimestamp(),
    // })
  }



  // const [mediaList, setMediaList] = useState<any[]>([])


  // useEffect(() => {
  //   const fetchMedia = async () => {
  //     if (!adminId) return

  //     try {
  //       const q = query(
  //         collection(db, 'admin_uploads'),
  //         where('admin_id', '==', adminId),
  //         orderBy('uploaded_at', 'desc'),
  //         limit(50)
  //       )
  //       const snapshot = await getDocs(q)
  //       const mediaItems = snapshot.docs
  //         .map(doc => doc.data())
  //         .filter(item => item.media_url && item.media_type && item.filename)

  //       setMediaList(mediaItems)
  //     } catch (err) {
  //       console.error('Error fetching media:', err)
  //     }
  //   }

  //   fetchMedia()
  // }, [adminId])




  return (
    <div className="flex flex-col gap-4.5 p-4 bg-dark-400 dark:bg-dark-900 text-light-100 dark:text-light-100">
      {/* Language Toggle */}
      <div className="flex gap-x-2">
        <button
          type="button"
          onClick={() => setLanguageAndSave('kh')}
          className={`px-2 py-1 text-xs rounded border ${language === 'kh'
            ? 'bg-teal-600 text-white border-teal-600'
            : 'bg-dark-400 dark:bg-dark-700 text-light-100 border-dark-100 dark:border-dark-600'
            }`}
        >
          ភាសាខ្មែរ
        </button>
        <button
          type="button"
          onClick={() => setLanguageAndSave('en')}
          className={`px-2 py-1 text-xs rounded border ${language === 'en'
            ? 'bg-teal-600 text-white border-teal-600'
            : 'bg-dark-400 dark:bg-dark-700 text-light-100 border-dark-100 dark:border-dark-600'
            }`}
        >
          English
        </button>
      </div>

      {/* Unique ID */}
      <div className="flex flex-col">
        <div className="text-xs font-semibold text-light-900/60">Unique Identifier</div>
        <input
          type="text"
          value={id}
          readOnly
          className="mt-2 h-8 w-full border border-dark-200 rounded-md bg-dark-400 px-2.5 text-sm font-medium shadow-sm outline-none read-only:(text-light-900/80 opacity-80 hover:bg-dark-300/30)"
        />
      </div>

      {/* Media Type */}
      <div className="flex flex-col">
        <div className="text-xs font-semibold text-light-900/60">Media Type</div>
        <select
          value={data.media_type}
          onChange={e => updateData({ media_type: e.target.value as MediaTemplateNodeData['media_type'] })}
          className="mt-2 h-8 w-full rounded bg-dark-600 dark:bg-dark-800 px-2.5 text-sm border border-dark-300 dark:border-dark-700 outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
        </select>
      </div>

      {/* Media URL */}
      <div className="flex flex-col">
        <div className="text-xs font-semibold text-light-900/60">Media URL</div>
        <input
          value={data.media_url}
          onChange={e => updateData({ media_url: e.target.value })}
          className="h-8 w-full border border-dark-200 dark:border-dark-600 rounded-md bg-dark-400 dark:bg-dark-800 px-2.5 text-sm font-medium shadow-sm outline-none transition hover:bg-dark-300/60 dark:hover:bg-dark-700 focus:(border-teal-800 bg-dark-500 dark:bg-dark-700 ring-2 ring-teal-500/50)"
        />
        {data.media_url && data.media_type === 'image' && (
          <img
            src={data.media_url}
            alt="Preview"
            className="mt-3 w-full rounded-md border border-dark-100 dark:border-dark-600 shadow-sm"
          />
        )}

        {data.media_url && data.media_type === 'video' && (
          <video src={data.media_url} controls className="w-full rounded" />
        )}

        {data.media_url && data.media_type === 'audio' && (
          <audio src={data.media_url} controls className="w-full" />
        )}

      </div>

      <input
        type="file"
        accept="image/*,video/*,audio/*"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
        }}
        className="mt-2 text-sm text-light-100"
      />

{/* 
      {Array.isArray(mediaList) && mediaList.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-light-100">📁 Reuse Uploaded Media</h3>
          {mediaList.map(media => (
            <button
              key={media.media_url}
              onClick={() => updateData({ media_url: media.media_url, media_type: media.media_type })}
              className="flex items-center gap-2 p-2 rounded hover:bg-light-200"
            >
              {media.media_type === 'image' && (
                <img src={media.media_url} className="w-10 h-10 rounded object-cover" />
              )}
              {media.media_type === 'video' && (
                <video src={media.media_url} className="w-10 h-10 rounded object-cover" />
              )}
              {media.media_type === 'audio' && (
                <span className="text-xs text-light-300">🎵 Audio</span>
              )}
              <span className="text-xs truncate text-light-100">{media.filename}</span>
            </button>
          ))}
        </div>
      )}
 */}


      {/* Intro Text */}
      <div className="flex flex-col relative">
        <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">
          {language === 'kh' ? 'សារណែនាំ' : 'Intro Message'}
        </div>
        <textarea
          value={introText}
          onChange={e => updateIntroText(e.target.value)}
          placeholder={language === 'kh' ? 'សរសេរប្រសាសន៍បង្ហាញមេឌៀនៅទីនេះ...' : 'Type your intro message here...'}
          className="mt-2 w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 outline-none focus:ring-2 focus:ring-teal-500"
        />
        <div className="mt-2 flex items-center gap-x-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(prev => !prev)}
            className="text-xs px-2 py-1 rounded bg-dark-600 hover:bg-dark-500 text-light-100 outline-none focus:ring-2 focus:ring-teal-500"
          >
            😊 Add Emoji
          </button>
        </div>
        {showEmojiPicker && (
          <div className="absolute left-0 right-0 bottom-0 z-50 max-h-[320px] max-w-full overflow-y-auto bg-dark-900 rounded shadow-lg p-2 scrollbar-dark-teal">
            <div className="w-full max-w-[360px] mx-auto">
              <Picker
                data={emojiData}
                theme="dark"
                onEmojiSelect={(emoji: any) => {
                  if (emoji?.native) {
                    updateIntroText(introText + emoji.native)
                    setShowEmojiPicker(false)
                  }
                }}
              />
            </div>
          </div>
        )}
        <div className="text-xs mt-1 text-light-900/40 dark:text-light-100/40">
          {introText.length}/320
        </div>
      </div>

      {/* Button Option */}
      <div className="flex flex-col gap-y-2">
        <div className="text-xs font-semibold text-light-900/60">Button Label ({language === 'kh' ? 'Khmer' : 'English'})</div>
        <input
          type="text"
          value={language === 'kh' ? option.label_kh ?? '' : option.label_en ?? ''}
          onChange={e =>
            updateOption(language === 'kh' ? { label_kh: e.target.value } : { label_en: e.target.value })
          }
          className="h-8 w-full rounded-md border border-dark-300 bg-dark-600 px-2.5 text-sm text-light-900 outline-none focus:ring-2 focus:ring-teal-500"
        />

        <div className="text-xs font-semibold text-light-900/60">Type</div>
        <select
          value={option.type}
          onChange={e => updateOption({ type: e.target.value as any })}
          className="h-8 w-full rounded-md border border-dark-300 bg-dark-600 px-2.5 text-sm text-light-900 outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="postback">Postback</option>
          <option value="web_url">Web URL</option>
          <option value="phone_number">Phone Number</option>
        </select>

        {/* Payload / URL input based on type */}
        {option.type === 'postback' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-light-900/60 dark:text-light-100/60">Payload</label>
            <select
              value={option.payload ?? ''}
              onChange={e => updateOption({ payload: e.target.value })}
              className="h-8 w-full border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm outline-none transition hover:bg-dark-400 dark:hover:bg-dark-700 focus:(border-teal-500 ring-2 ring-teal-500/50)"
            >
              <option value="">ជ្រើសរើស flow…</option>
              {flowList.length > 0 ? (
                flowList.map(flowId => (
                  <option key={flowId} value={flowId}>
                    🧩 {flowId}
                  </option>
                ))
              ) : (
                <option disabled value="">⚠️ No flows available</option>
              )}
            </select>

            <input
              value={option.payload ?? ''}
              onChange={e => updateOption({ payload: e.target.value })}
              placeholder="ឬវាយដោយដៃ (ឧ. skin_care_intro)"
              className="h-8 w-full border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm mt-1 outline-none transition hover:bg-dark-400 dark:hover:bg-dark-700 focus:(border-teal-500 ring-2 ring-teal-500/50)"
            />

            <div className="text-xs mt-1">
              {option.payload && flowList.includes(option.payload) ? (
                <span className="text-teal-400 dark:text-teal-300">✅ Linked to flow: {option.payload}</span>
              ) : option.payload && isMessengerSafePayload(option.payload) ? (
                <span className="text-yellow-400">✍️ Manual payload — not auto-linked</span>
              ) : option.payload ? (
                <span className="text-red-500">⚠️ Invalid or unknown payload</span>
              ) : (
                <span className="text-light-100/40 italic">No payload set</span>
              )}
            </div>
          </div>
        )}

        {option.type === 'web_url' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-light-900/60 dark:text-light-100/60">URL</label>
            <input
              value={option.url ?? ''}
              onChange={e => updateOption({ url: e.target.value })}
              placeholder="https://example.com"
              className="h-8 w-full border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm outline-none transition hover:bg-dark-400 dark:hover:bg-dark-700 focus:(border-teal-500 ring-2 ring-teal-500/50)"
            />
          </div>
        )}

        {option.type === 'phone_number' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-light-900/60 dark:text-light-100/60">Phone Number</label>
            <input
              value={option.payload ?? ''}
              onChange={e => updateOption({ payload: e.target.value })}
              placeholder="+85512345678"
              className="h-8 w-full border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm outline-none transition hover:bg-dark-400 dark:hover:bg-dark-700 focus:(border-teal-500 ring-2 ring-teal-500/50)"
            />
            <div className="text-xs mt-1 text-light-900/40 dark:text-light-100/40">
              Must be a valid international number
            </div>
          </div>
        )}
      </div>

      {/* Condition Selector */}
      <div className="flex flex-col gap-y-1 pt-4">
        <label className="text-sm font-medium text-light-900">Condition</label>
        <ConditionDropdownSelector
          value={data.condition ?? null}
          onChange={value => updateData({ condition: value })}
        />
      </div>
    </div>
  )
}
