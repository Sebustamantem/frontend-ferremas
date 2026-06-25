import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, RefreshCw, ReceiptText, Truck, XCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import api from "../../api/axios"
import { useAuth } from "../../context/AuthContext"

const statusLabels = {
    transfer_pending: "Transferencia pendiente",
    paid: "Pagado",
    processing: "En preparacion",
    shipped: "Despachado",
    delivered: "Entregado",
    cancelled: "Cancelado",
}

const statusColors = {
    transfer_pending: "bg-yellow-100 text-yellow-700",
    paid: "bg-blue-100 text-blue-700",
    processing: "bg-purple-100 text-purple-700",
    shipped: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
}

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString("es-CL")}`

const ContadorPanel = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState(null)
    const [error, setError] = useState("")
    const [notice, setNotice] = useState(null)
    const [actionDraft, setActionDraft] = useState(null)

    useEffect(() => {
        if (!user) return
        if (!["admin", "contador"].includes(user.role)) {
            navigate("/")
            return
        }
        fetchOrders()
    }, [user, navigate])

    const fetchOrders = async () => {
        setLoading(true)
        setError("")
        try {
            const res = await api.get("/staff/accounting/orders")
            setOrders(res.data.orders || res.data)
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo cargar el panel contable")
        } finally {
            setLoading(false)
        }
    }

    const updateOrder = async (orderId, action, confirmText) => {
        setActionDraft({ orderId, action, confirmText })
    }

    const confirmUpdateOrder = async () => {
        if (!actionDraft) return
        const { orderId, action } = actionDraft
        setUpdatingId(orderId)
        try {
            await api.put(`/staff/accounting/orders/${orderId}/${action}`)
            setNotice({ type: "success", message: "Pedido actualizado correctamente." })
            setActionDraft(null)
            await fetchOrders()
        } catch (err) {
            setNotice({ type: "error", message: err.response?.data?.message || "No se pudo actualizar el pedido" })
        } finally {
            setUpdatingId(null)
        }
    }

    const transferOrders = orders.filter((order) => order.status === "transfer_pending")
    const shippedOrders = orders.filter((order) => order.status === "shipped")
    const stats = useMemo(() => {
        const confirmedAmount = orders
            .filter((order) => ["paid", "processing", "shipped", "delivered"].includes(order.status))
            .reduce((acc, order) => acc + Number(order.total || 0), 0)

        return {
            pendingTransfers: transferOrders.length,
            pendingDeliveries: shippedOrders.length,
            confirmedAmount,
        }
    }, [orders, transferOrders.length, shippedOrders.length])

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <p className="text-sm font-semibold text-orange-600">FERREMAS</p>
                        <h1 className="text-3xl font-bold text-gray-900">Panel Contador</h1>
                        <p className="text-sm text-gray-500 mt-1">Confirma transferencias y registra entregas a clientes.</p>
                    </div>
                    <button
                        onClick={fetchOrders}
                        className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:border-orange-400 transition"
                    >
                        <RefreshCw size={16} />
                        Actualizar
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <StatCard icon={ReceiptText} label="Transferencias pendientes" value={stats.pendingTransfers} color="yellow" />
                    <StatCard icon={Truck} label="Entregas por registrar" value={stats.pendingDeliveries} color="orange" />
                    <StatCard icon={CheckCircle2} label="Monto confirmado" value={formatCurrency(stats.confirmedAmount)} color="green" />
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
                        {error}
                    </div>
                )}

                {notice && (
                    <div className={`rounded-lg px-4 py-3 text-sm mb-6 border ${notice.type === "success"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-700"
                        }`}>
                        <div className="flex items-center justify-between gap-4">
                            <span>{notice.message}</span>
                            <button type="button" onClick={() => setNotice(null)} className="font-bold">Cerrar</button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <OrderSection
                            title="Pagos por transferencia"
                            emptyText="No hay transferencias pendientes"
                            orders={transferOrders}
                            updatingId={updatingId}
                            actions={(order) => (
                                <>
                                    <button
                                        onClick={() => updateOrder(order.id, "confirm-transfer", "Confirmar pago por transferencia?")}
                                        disabled={updatingId === order.id}
                                        className="inline-flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                                    >
                                        <CheckCircle2 size={15} />
                                        Confirmar
                                    </button>
                                    <button
                                        onClick={() => updateOrder(order.id, "reject-transfer", "Rechazar esta transferencia y liberar stock?")}
                                        disabled={updatingId === order.id}
                                        className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50"
                                    >
                                        <XCircle size={15} />
                                        Rechazar
                                    </button>
                                </>
                            )}
                        />

                        <OrderSection
                            title="Entrega a clientes"
                            emptyText="No hay pedidos despachados por entregar"
                            orders={shippedOrders}
                            updatingId={updatingId}
                            actions={(order) => (
                                <button
                                    onClick={() => updateOrder(order.id, "delivered", "Registrar pedido como entregado al cliente?")}
                                    disabled={updatingId === order.id}
                                    className="inline-flex items-center gap-2 bg-orange-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-orange-700 disabled:opacity-50"
                                >
                                    <Truck size={15} />
                                    Entregado
                                </button>
                            )}
                        />
                    </div>
                )}
            </div>

            {actionDraft && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900">Actualizar pedido #{actionDraft.orderId}</h2>
                        <p className="text-sm text-gray-500 mt-2">{actionDraft.confirmText}</p>
                        <div className="flex justify-end gap-2 mt-6">
                            <button type="button" onClick={() => setActionDraft(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">
                                Cancelar
                            </button>
                            <button type="button" onClick={confirmUpdateOrder} className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600">
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const StatCard = ({ icon: Icon, label, value, color }) => {
    const colors = {
        yellow: "bg-yellow-100 text-yellow-700",
        orange: "bg-orange-100 text-orange-600",
        green: "bg-green-100 text-green-600",
    }

    return (
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-gray-400 text-sm">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${colors[color]}`}>
                    <Icon size={22} />
                </div>
            </div>
        </div>
    )
}

const OrderSection = ({ title, emptyText, orders, actions }) => (
    <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-400">{orders.length} pedidos</p>
        </div>

        {orders.length === 0 ? (
            <div className="text-center py-14 text-gray-400 text-sm">{emptyText}</div>
        ) : (
            <div className="divide-y divide-gray-100">
                {orders.map((order) => (
                    <article key={order.id} className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-bold text-gray-900">Pedido #{order.id}</p>
                                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
                                        {statusLabels[order.status] || order.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">{order.user_name}</p>
                                <p className="text-xs text-gray-400">{order.user_email}</p>
                            </div>
                            <p className="text-lg font-bold text-orange-600">{formatCurrency(order.total)}</p>
                        </div>

                        <div className="mt-4 space-y-2">
                            {order.items?.map((item) => (
                                <div key={`${order.id}-${item.product_id}`} className="flex justify-between gap-3 text-sm">
                                    <span className="text-gray-600">{item.name}</span>
                                    <span className="font-semibold text-gray-800">x{item.quantity}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-5">
                            {actions(order)}
                        </div>
                    </article>
                ))}
            </div>
        )}
    </section>
)

export default ContadorPanel
