// // File: /pages/api/flows/sync-firebase.ts (Next.js)
// // or /api/flows/sync-firebase.ts if using Vercel Functions

// import { buildFlowExport  } from '~/utils/exportFlow'
// // import { getFirebaseApp } from '~/lib/firebase'
// import { getDatabase, ref, set } from 'firebase/database' // or use Firestore

// export async function handler(req: Request): Promise<Response> {
//   if (req.method !== 'POST') {
//     return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
//   }

//   try {
//     const body = await req.json()
//     const { nodes, edges } = body

//     console.log('📥 Received nodes:', nodes.length)
//     console.log('📥 Received edges:', edges.length)

//     const exported = buildFlowExport(nodes, edges)
//     console.log('📦 Exported flow keys:', Object.keys(exported))

//     const app = getFirebaseApp()
//     const db = getDatabase(app)

//     const flowKeys = Object.keys(exported)
//     for (const key of flowKeys) {
//       const flowRef = ref(db, `flows/${key}`)
//       await set(flowRef, exported[key])
//       console.log(`✅ Synced flow "${key}" to Firebase`)
//     }

//     return new Response(JSON.stringify({ success: true }), { status: 200 })
//   } catch (err: any) {
//     console.error('❌ Firebase sync error:', err.message || err)
//     return new Response(JSON.stringify({ error: err.message || 'Failed to sync flow to Firebase' }), { status: 500 })
//   }
// }
