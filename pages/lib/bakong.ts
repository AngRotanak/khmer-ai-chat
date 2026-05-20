export async function checkBakongTransaction(md5: string) {
  if (!md5) {
    throw new Error("Missing md5")
  }

  const response = await fetch("https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.BAKONG_TOKEN}`
    },
    // ⚠️ Adjust the key name if Bakong expects "hash" instead of "md5"
    body: JSON.stringify({ md5 })
  })

  if (!response.ok) {
    throw new Error(`Bakong API error: ${response.status}`)
  }

  return await response.json()
}
