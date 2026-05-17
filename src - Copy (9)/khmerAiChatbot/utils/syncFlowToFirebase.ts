import { db } from '~/lib/firebase'
import { ref, set } from 'firebase/database'

export async function syncFlowToFirebase(data: any) {
  const flowRef = ref(db, 'flows/welcome')
  await set(flowRef, data.welcome)
}
