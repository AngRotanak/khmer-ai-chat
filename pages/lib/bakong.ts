export async function checkBakongTransaction(md5: string) {
  if (!md5) throw new Error("Missing md5")

  const response = await fetch("https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.BAKONG_TOKEN}`
    },
    body: JSON.stringify({ md5 }) // ⚠️ confirm if Bakong expects "hash" instead
  })

  if (!response.ok) {
    throw new Error(`Bakong API error: ${response.status}`)
  }

  const raw = await response.json()

  // ✅ Normalize response
  let status: "PAID" | "PENDING" | "FAILED" = "PENDING"
  if (raw?.status === "success" || raw?.transaction_status === "completed") {
    status = "PAID"
  } else if (raw?.transaction_status === "failed") {
    status = "FAILED"
  }

  return { status, license_id: raw?.license_id, download_url: raw?.download_url }
}
