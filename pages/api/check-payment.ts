import type { NextApiRequest, NextApiResponse } from "next"
import { checkBakongTransaction } from '../../src/lib/bakong'


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { md5 } = req.body
  if (!md5) {
    return res.status(400).json({ error: "Missing md5" })
  }

  try {
    const data = await checkBakongTransaction(md5)
    return res.status(200).json(data)   // ✅ always return JSON
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
