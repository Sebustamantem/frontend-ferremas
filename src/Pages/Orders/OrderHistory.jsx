import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Package, ChevronRight } from "lucide-react"
import api from "../../api/axios"

const formatDate = (value) => {
    if (!value) return "Fecha no disponible"
    return new Date(value).toLocaleDateString("es-CL", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

const formatPrice = (value) => `$${Number(value || 0).toLocaleString("es-CL")}`

const statusLabels = {
    pending: "Pendiente",
    transfer_pending: "Transferencia pendiente",
    paid: "Pagado",
    processing: "En preparacion",
    shipped: "Despachado",
    delivered: "Entregado",
    cancelled: "Cancelado",
}

const OrderHistory = () => {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true)
            setError("")

            const endpoints = ["/orders/me", "/orders/my", "/orders"]

            for (const endpoint of endpoints) {
                try {
                    const res = await api.get(endpoint)
                    const data = Array.isArray(res.data) ? res.data : res.data?.orders
                    if (Array.isArray(data)) {
                        setOrders(data)
                        setLoading(false)
                        return
                    }
                } catch {
                    // Intenta el siguiente endpoint
                }
            }

            setError("No pudimos cargar tu historial de pedidos. Inténtalo nuevamente.")
            setLoading(false)
        }

        fetchOrders()
    }, [])

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-10">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Historial de pedidos</h1>
                <p className="text-gray-500 mt-1">Revisa todas tus órdenes realizadas.</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm py-3 px-4 rounded-xl mb-6">
                    {error}
                </div>
            )}

            {!error && orders.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                    <Package className="mx-auto text-gray-300 mb-3" size={40} />
                    <h2 className="text-xl font-semibold text-gray-800">Aún no tienes pedidos</h2>
                    <p className="text-gray-500 mt-2">Cuando compres, tus órdenes aparecerán aquí.</p>
                    <Link
                        to="/productos"
                        className="inline-flex items-center gap-2 mt-5 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-semibold transition"
                    >
                        Ir a productos
                        <ChevronRight size={16} />
                    </Link>
                </div>
            )}

            {orders.length > 0 && (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <p className="text-xs text-gray-400">Pedido #{order.id}</p>
                                    <p className="text-sm text-gray-500">{formatDate(order.created_at || order.createdAt)}</p>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div>
                                        <p className="text-xs text-gray-400">Estado</p>
                                        <p className="text-sm font-semibold text-gray-700">{statusLabels[order.status] || order.status || "Procesando"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Total</p>
                                        <p className="text-base font-bold text-orange-600">{formatPrice(order.total)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default OrderHistory
