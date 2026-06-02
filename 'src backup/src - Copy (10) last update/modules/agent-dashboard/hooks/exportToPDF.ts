import type { Conversation } from "~/modules/nodes/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

    // Expose jsPDF globally so the font file can register
    ; (window as any).jsPDF = jsPDF

// Import the generated Khmer font file (self‑executing)
import "~/fonts/KhmerOS_sys-normal.js"

export async function exportToPDF(conversations: Conversation[]) {
    const doc = new jsPDF({ orientation: "portrait" })


    // Debug: list available fonts
    console.log("Available fonts:", doc.getFontList())

    // ⚠️ Adjust this string to match the exact font name in your font file
    doc.setFont("KhmerOS_sys", "normal")
    console.log("Current font after setFont:", doc.getFont())


    // 🔹 Cover Page
    doc.setFontSize(24)
    doc.text("របាយការណ៍សន្ទនាអ្នកប្រើប្រាស់", 105, 60, { align: "center" })
    doc.setFontSize(16)
    doc.text("Conversation Report", 105, 70, { align: "center" })

    const now = new Date().toLocaleString()
    doc.setFontSize(14)
    doc.text(`បង្កើតនៅ: ${now}`, 105, 85, { align: "center" })
    doc.text(`Generated: ${now}`, 105, 92, { align: "center" })

    doc.setFontSize(12)
    doc.text("សម្រាប់ការពិនិត្យរបស់អ្នកគ្រប់គ្រង", 105, 105, { align: "center" })
    doc.text("For Admin Review", 105, 112, { align: "center" })
    doc.addPage()

    // 🔹 Summary
    const totalConversations = conversations.length
    const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0)
    const avgMessages = totalConversations > 0 ? (totalMessages / totalConversations).toFixed(1) : "0"

    doc.setFontSize(18)
    doc.text("សង្ខេប", 14, 20)
    doc.text("Summary", 14, 28)

    doc.setFontSize(12)
    doc.text(`ចំនួនសន្ទនាសរុប: ${totalConversations}`, 14, 40)
    doc.text(`Total Conversations: ${totalConversations}`, 14, 46)

    doc.text(`ចំនួនសារសរុប: ${totalMessages}`, 14, 54)
    doc.text(`Total Messages: ${totalMessages}`, 14, 60)

    doc.text(`មធ្យមសារក្នុងមួយសន្ទនា: ${avgMessages}`, 14, 68)
    doc.text(`Average Messages per Conversation: ${avgMessages}`, 14, 74)

    // 🔹 Detailed tables
    let startY = 90
    for (const [idx, c] of conversations.entries()) {
        doc.setFontSize(12)
        doc.text(`សន្ទនា ${idx + 1} – ${c.customerName ?? "មិនមាន"}`, 14, startY)
        doc.text(`Conversation ${idx + 1} – ${c.customerName ?? "N/A"}`, 14, startY + 6)

        // No agentName in Conversation → fallback
        doc.text(`ភ្នាក់ងារ: មិនមាន`, 14, startY + 14)
        doc.text(`Agent: N/A`, 14, startY + 20)

        const startTime = c.messages[0]?.timestamp
        const endTime = c.messages.length > 0 ? c.messages[c.messages.length - 1]?.timestamp : null

        doc.text(
            `ចាប់ផ្តើម: ${startTime ? new Date(startTime * 1000).toLocaleString() : "មិនមាន"} | បញ្ចប់: ${endTime ? new Date(endTime * 1000).toLocaleString() : "មិនមាន"}`,
            14,
            startY + 28
        )

        doc.text(
            `Start: ${startTime ? new Date(startTime * 1000).toLocaleString() : "N/A"} | End: ${endTime ? new Date(endTime * 1000).toLocaleString() : "N/A"}`,
            14,
            startY + 34
        )

        const rows = c.messages.map(m => {
            let messageText = m.text?.trim() || "(ឯកសារ​ភ្ជាប់ / Attachment)"
            if (m.imageUrl) messageText = "📷 រូបភាព / Image"
            if (m.videoUrl) messageText = "🎥 វីដេអូ / Video"
            if (m.audioUrl) messageText = "🔊 អូឌីយ៉ូ / Audio"

            console.log("Message raw:", m.text)
            console.log("Message final:", messageText)

            return [m.sender ?? "Unknown", messageText, new Date(m.timestamp * 1000).toLocaleTimeString()]
        })

        autoTable(doc, {
            head: [["អ្នកផ្ញើ / Sender", "សារ / Message", "ពេលវេលា / Time"]],
            body: rows,
            startY: startY + 45,
            theme: "grid",
            styles: { font: "NotoSansKhmer-VariableFont_wdth,wght" } // force Khmer font
        })

        startY = (doc as any).lastAutoTable.finalY + 25
    }

    // 🔹 Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(10)
        doc.text(`ទំព័រ ${i} / ${pageCount}`, 200, 290)
        doc.text(`Page ${i} / ${pageCount}`, 200, 296)
        doc.text("សម្ងាត់ – ប្រើប្រាស់ក្នុងផ្ទៃ", 14, 290)
        doc.text("Confidential – Internal Use Only", 14, 296)
    }

    doc.save("conversation_report.pdf")
}
