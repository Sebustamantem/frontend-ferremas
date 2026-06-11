const formatCurrency = (value) => `$${Number(value || 0).toLocaleString("es-CL")}`

const formatDate = (value) => {
    if (!value) return "Sin fecha"
    return new Date(value).toLocaleString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

const formatAddress = (address) => {
    if (!address) return "Sin direccion registrada"
    try {
        const parsed = typeof address === "string" ? JSON.parse(address) : address
        return [parsed.street, parsed.number, parsed.city, parsed.region].filter(Boolean).join(", ")
    } catch {
        return String(address)
    }
}

const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")

export const openOrderPdf = (order) => {
    if (!order) return

    const items = Array.isArray(order.items) ? order.items : []
    const productTotal = items.reduce(
        (acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 0),
        0
    )
    const services = Array.isArray(order.service_requests) ? order.service_requests : []
    const serviceTotal = services.reduce((acc, service) => acc + Number(service.price || service.amount || service.total || 0), 0)
    const total = Number(order.total || productTotal + serviceTotal)
    const clientName = [order.user_name, order.user_lastname].filter(Boolean).join(" ") || order.customer_name || "Cliente"

    const rows = items.map((item) => {
        const quantity = Number(item.quantity || 0)
        const price = Number(item.price || 0)
        return `
            <tr>
                <td>${escapeHtml(item.name || "Producto")}</td>
                <td class="center">${quantity}</td>
                <td class="right">${formatCurrency(price)}</td>
                <td class="right">${formatCurrency(quantity * price)}</td>
            </tr>
        `
    }).join("")

    const serviceRows = services.map((service) => `
        <tr>
            <td>${escapeHtml(service.title || service.description || "Servicio profesional")}</td>
            <td class="center">1</td>
            <td class="right">${formatCurrency(service.price || service.amount || service.total || 0)}</td>
            <td class="right">${formatCurrency(service.price || service.amount || service.total || 0)}</td>
        </tr>
    `).join("")

    const html = `
        <!doctype html>
        <html>
        <head>
            <meta charset="utf-8" />
            <title>Resumen pedido #${escapeHtml(order.id)}</title>
            <style>
                @page { size: A4; margin: 18mm; }
                body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; }
                .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 3px solid #ff5a1f; padding-bottom: 18px; }
                .brand { font-size: 26px; font-weight: 800; letter-spacing: .5px; color: #0f766e; }
                .muted { color: #64748b; font-size: 12px; }
                h1 { font-size: 22px; margin: 22px 0 6px; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 18px 0; }
                .box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
                .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
                .value { margin-top: 5px; font-size: 14px; font-weight: 700; }
                table { width: 100%; border-collapse: collapse; margin-top: 18px; }
                th { text-align: left; font-size: 11px; text-transform: uppercase; background: #f8fafc; color: #475569; padding: 11px; border-bottom: 1px solid #e2e8f0; }
                td { padding: 12px 11px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
                .right { text-align: right; }
                .center { text-align: center; }
                .summary { margin-top: 18px; margin-left: auto; width: 280px; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
                .summary-row { display: flex; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
                .summary-row:last-child { border-bottom: 0; background: #0f172a; color: white; font-size: 16px; font-weight: 800; }
                .footer { margin-top: 28px; color: #64748b; font-size: 11px; text-align: center; }
                @media print { button { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <div class="brand">FERREMAS</div>
                    <div class="muted">Resumen comercial de pedido</div>
                </div>
                <div class="right">
                    <div class="label">Pedido</div>
                    <div class="value">#${escapeHtml(order.id)}</div>
                    <div class="muted">${formatDate(order.created_at)}</div>
                </div>
            </div>

            <h1>Resumen de compra</h1>
            <div class="grid">
                <div class="box">
                    <div class="label">Cliente</div>
                    <div class="value">${escapeHtml(clientName)}</div>
                    <div class="muted">${escapeHtml(order.user_email || order.email || "")}</div>
                    <div class="muted">${escapeHtml(order.user_phone || "")}</div>
                </div>
                <div class="box">
                    <div class="label">Entrega</div>
                    <div class="value">${escapeHtml(order.delivery_method === "pickup" ? "Retiro en tienda" : "Despacho a domicilio")}</div>
                    <div class="muted">${escapeHtml(formatAddress(order.address))}</div>
                </div>
                <div class="box">
                    <div class="label">Estado</div>
                    <div class="value">${escapeHtml(order.status || "pendiente")}</div>
                </div>
                <div class="box">
                    <div class="label">Fecha de emision</div>
                    <div class="value">${formatDate(new Date())}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th class="center">Cant.</th>
                        <th class="right">Precio</th>
                        <th class="right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows || ""}
                    ${serviceRows || ""}
                    ${!rows && !serviceRows ? `<tr><td colspan="4" class="center muted">Sin items registrados</td></tr>` : ""}
                </tbody>
            </table>

            <div class="summary">
                <div class="summary-row"><span>Productos</span><strong>${formatCurrency(productTotal)}</strong></div>
                ${serviceTotal > 0 ? `<div class="summary-row"><span>Servicios</span><strong>${formatCurrency(serviceTotal)}</strong></div>` : ""}
                <div class="summary-row"><span>Total pedido</span><strong>${formatCurrency(total)}</strong></div>
            </div>

            <div class="footer">Documento generado desde el sistema Ferremas. Usa la opcion Guardar como PDF del navegador.</div>
            <script>window.onload = () => window.print()</script>
        </body>
        </html>
    `

    const blob = new Blob([html], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank", "noopener,noreferrer")
    setTimeout(() => URL.revokeObjectURL(url), 10000)
}
