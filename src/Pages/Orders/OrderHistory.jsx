import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, ChevronRight, Clock, Download, Package, Truck, XCircle } from "lucide-react"
import api from "../../api/axios"
import { openOrderPdf } from "../../utils/orderPdf"

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

const trackerSteps = [
    { key: "preparation", label: "En preparacion", icon: Package },
    { key: "shipped", label: "Enviado", icon: Truck },
    { key: "delivered", label: "Entregado", icon: CheckCircle2 },
]

const getStepIndex = (status) => {
    if (["pending", "transfer_pending"].includes(status)) return -1
    if (["paid", "processing"].includes(status)) return 0
    if (status === "shipped") return 1
    if (status === "delivered") return 2
    return -1
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

                                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                    <div>
                                        <p className="text-xs text-gray-400">Estado</p>
                                        <p className="text-sm font-semibold text-gray-700">{statusLabels[order.status] || order.status || "Procesando"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Total</p>
                                        <p className="text-base font-bold text-orange-600">{formatPrice(order.total)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openOrderPdf(order)}
                                        className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition"
                                    >
                                        <Download size={16} />
                                        PDF
                                    </button>
                                </div>
                            </div>
                            <OrderTracker status={order.status} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const OrderTracker = ({ status }) => {
    if (status === "cancelled") {
        return (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                <XCircle size={18} />
                Pedido cancelado
            </div>
        )
    }

    if (["pending", "transfer_pending"].includes(status)) {
        return (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                <Clock size={18} />
                {status === "transfer_pending" ? "Esperando confirmacion de transferencia" : "Esperando confirmacion de pago"}
            </div>
        )
    }

    const currentStep = getStepIndex(status)

    return (
        <div className="mt-5">
            <div className="grid grid-cols-3 gap-2">
                {trackerSteps.map((step, index) => {
                    const Icon = step.icon
                    const isDone = index < currentStep
                    const isCurrent = index === currentStep
                    const isActive = index <= currentStep

                    return (
                        <div key={step.key} className="flex flex-col items-center text-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isActive
                                ? "bg-orange-500 border-orange-500 text-white"
                                : "bg-gray-50 border-gray-200 text-gray-300"
                                }`}>
                                <Icon size={18} />
                            </div>
                            <p className={`mt-2 text-xs font-semibold ${isActive ? "text-gray-800" : "text-gray-400"}`}>
                                {step.label}
                            </p>
                            <p className={`text-[11px] ${isCurrent ? "text-orange-600" : isDone ? "text-green-600" : "text-gray-300"}`}>
                                {isCurrent ? "Actual" : isDone ? "Completado" : "Pendiente"}
                            </p>
                        </div>
                    )
                })}
            </div>
            <div className="mt-4 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                    className="h-full bg-orange-500 transition-all"
                    style={{ width: `${currentStep <= 0 ? 33 : currentStep === 1 ? 66 : 100}%` }}
                />
            </div>
        </div>
    )
}

export default OrderHistory
