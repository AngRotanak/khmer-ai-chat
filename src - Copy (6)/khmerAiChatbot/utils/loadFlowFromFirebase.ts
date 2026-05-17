import { db } from '~/lib/firebase'
import { ref, get } from 'firebase/database'

export async function loadFlowFromFirebase() {
  const snapshot = await get(ref(db, 'flows/welcome'))
  return snapshot.val()
}
