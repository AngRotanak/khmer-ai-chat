// ~/lib/upload.ts
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { nanoid } from 'nanoid'
import { storage } from '~/lib/firebase'

export async function uploadFile(file: File): Promise<{ url: string; type: string; filename: string }> {
  const ext = file.name.split('.').pop()
  const filename = `${nanoid()}.${ext}`
  const fileRef = ref(storage, `uploads/${filename}`)

  await uploadBytes(fileRef, file)
  const url = await getDownloadURL(fileRef)

  const type = file.type.startsWith('image/')
    ? 'image'
    : file.type.startsWith('video/')
    ? 'video'
    : 'audio'

  return { url, type, filename }
}
