import type { NextApiRequest, NextApiResponse } from "next"
import { checkBakongTransaction } from '../../src/lib/bakong'
import { db } from "../../src/lib/firebase" // adjust import if needed
import { push, ref } from "firebase/database"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { md5, mock, groupId, userId } = req.body
  if (!md5) {
    return res.status(400).json({ error: "Missing md5" })
  }

  try {
    let data
    if (mock) {
      // 🔹 Simulated response
      const fakeStatuses = ["PENDING", "PAID", "FAILED"]
      const randomStatus = fakeStatuses[Math.floor(Math.random() * fakeStatuses.length)]
      data = {
        status: randomStatus,
        license_id: `mock-${md5}`,
        download_url: randomStatus === "PAID" ? "/mock/download.zip" : ""
      }

      // 🔹 Log mock mode
      await push(ref(db, `logs/webapp/${groupId}`), {
        type: "bakong_mock",
        group_id: groupId,
        user_id: userId,
        md5,
        simulated: true,
        response: data,
        timestamp: new Date().toISOString(),
      })
    } else {
      // 🔹 Real Bakong call
      data = await checkBakongTransaction(md5)

      // 🔹 Log real mode
      await push(ref(db, `logs/webapp/${groupId}`), {
        type: "bakong_real",
        group_id: groupId,
        user_id: userId,
        md5,
        simulated: false,
        response: data,
        timestamp: new Date().toISOString(),
      })
    }

    return res.status(200).json(data)
  } catch (err) {
    await push(ref(db, `logs/webapp/${groupId}`), {
      type: "bakong_api_error",
      group_id: groupId,
      user_id: userId,
      md5,
      error: String(err),
      timestamp: new Date().toISOString(),
    })
    return res.status(500).json({ error: String(err) })
  }
}
