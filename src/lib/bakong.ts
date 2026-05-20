import { db } from './firebase'
import { ref, push} from 'firebase/database'


export async function checkBakongTransaction(md5: string) {
  try {
    // Debug entry before request
    await push(ref(db, `logs/webapp/${md5}`), {
      type: "bakong_request",
      md5,
      timestamp: new Date().toISOString(),
    })

    const response = await fetch("https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.BAKONG_TOKEN}`
      },
      body: JSON.stringify({ md5 })
    })

    // Log HTTP status
    await push(ref(db, `logs/webapp/${md5}`), {
      type: "bakong_response_status",
      status: response.status,
      ok: response.ok,
      timestamp: new Date().toISOString(),
    })

    const text = await response.text()
    let raw: any
    try {
      raw = JSON.parse(text)
    } catch {
      await push(ref(db, `logs/webapp/${md5}`), {
        type: "bakong_parse_error",
        textPreview: text.substring(0, 200),
        timestamp: new Date().toISOString(),
      })
      throw new Error("Invalid JSON from Bakong")
    }

    // Log normalized result
    let status: "PAID" | "PENDING" | "FAILED" = "PENDING"
    if (raw?.status === "success" || raw?.transaction_status === "completed") {
      status = "PAID"
    } else if (raw?.transaction_status === "failed") {
      status = "FAILED"
    }

    const result = { status, license_id: raw?.license_id, download_url: raw?.download_url }

    await push(ref(db, `logs/webapp/${md5}`), {
      type: "bakong_result",
      result,
      timestamp: new Date().toISOString(),
    })

    return result
  } catch (err) {
    await push(ref(db, `logs/webapp/${md5}`), {
      type: "bakong_error",
      error: String(err),
      timestamp: new Date().toISOString(),
    })
    throw err
  }
}
