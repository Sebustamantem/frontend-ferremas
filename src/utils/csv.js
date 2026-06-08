export const downloadCsv = (filename, rows) => {
    if (!rows?.length) return
    const headers = Object.keys(rows[0])
    const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`
    const separator = ";"
    const csv = [
        "sep=;",
        headers.map(escapeCell).join(separator),
        ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(separator)),
    ].join("\n")
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
