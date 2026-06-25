import { Fragment, createElement, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CreditCard, Download, Eye, MapPin, PackageCheck, RefreshCw, ShoppingBag, Star, TrendingUp, Users } from "lucide-react"
import api from "../../api/axios"
import { useAuth } from "../../context/AuthContext"
import { openOrderPdf } from "../../utils/orderPdf"

const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    transfer_pending: "bg-amber-100 text-amber-700",
    paid: "bg-blue-100 text-blue-700",
    processing: "bg-purple-100 text-purple-700",
    shipped: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
}

const statusLabels = {
    pending: "Pendiente",
    transfer_pending: "Transferencia pendiente",
    paid: "Pagado",
    processing: "Procesando",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
}

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString("es-CL")}`

const formatAddress = (address) => {
    if (!address) return "Sin direccion registrada"
    try {
        const parsed = typeof address === "string" ? JSON.parse(address) : address
        return [parsed.street, parsed.number, parsed.city, parsed.region].filter(Boolean).join(", ")
    } catch {
        return String(address)
    }
}

const VendedorPanel = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState("orders")
    const [orders, setOrders] = useState([])
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [selectedClientId, setSelectedClientId] = useState(null)
    const [clientDetail, setClientDetail] = useState(null)
    const [loadingClientId, setLoadingClientId] = useState(null)
    const [updatingOrderId, setUpdatingOrderId] = useState(null)
    const [notice, setNotice] = useState(null)

    useEffect(() => {
        if (!user) return
        if (!["admin", "vendedor"].includes(user.role)) {
            navigate("/")
            return
        }
        fetchData()
    }, [user, navigate])

    const fetchData = async () => {
        setLoading(true)
        setError("")
        try {
            const [ordersRes, clientsRes] = await Promise.all([
                api.get("/staff/orders"),
                api.get("/staff/clients"),
            ])
            setOrders(ordersRes.data.orders || ordersRes.data)
            setClients(clientsRes.data.clients || clientsRes.data)
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo cargar el panel de vendedor")
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (orderId, status) => {
        setUpdatingOrderId(orderId)
        try {
            await api.put(`/staff/orders/${orderId}/status`, { status })
            setNotice({ type: "success", message: "Estado actualizado correctamente." })
            await fetchData()
        } catch (err) {
            setNotice({ type: "error", message: err.response?.data?.message || "Error al actualizar el estado" })
        } finally {
            setUpdatingOrderId(null)
        }
    }

    const handleClientDetail = async (clientId) => {
        if (selectedClientId === clientId) {
            setSelectedClientId(null)
            setClientDetail(null)
            return
        }
        setSelectedClientId(clientId)
        setClientDetail(null)
        setLoadingClientId(clientId)
        try {
            const res = await api.get(`/staff/clients/${clientId}`)
            setClientDetail(res.data.client ? res.data : res.data)
        } catch (err) {
            setNotice({ type: "error", message: err.response?.data?.message || "No se pudo cargar la ficha del cliente" })
            setSelectedClientId(null)
        } finally {
            setLoadingClientId(null)
        }
    }

    const stats = useMemo(() => {
        const validOrders = orders.filter((order) => order.status !== "cancelled")
        const totalSales = validOrders.reduce((acc, order) => acc + Number(order.total || 0), 0)
        const pendingOrders = orders.filter((order) => ["pending", "transfer_pending", "paid"].includes(order.status)).length

        return {
            totalOrders: orders.length,
            totalClients: clients.length,
            totalSales,
            pendingOrders,
        }
    }, [orders, clients])

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Panel Vendedor</h1>
                        <p className="text-gray-500 text-sm mt-1">Bienvenido, {user?.name}</p>
                    </div>
                    <button
                        onClick={fetchData}
                        className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:border-orange-400 transition"
                    >
                        <RefreshCw size={16} />
                        Actualizar
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                    <StatCard icon={ShoppingBag} label="Pedidos" value={stats.totalOrders} color="orange" />
                    <StatCard icon={Users} label="Clientes" value={stats.totalClients} color="blue" />
                    <StatCard icon={TrendingUp} label="Ventas" value={formatCurrency(stats.totalSales)} color="green" />
                    <StatCard icon={PackageCheck} label="Por gestionar" value={stats.pendingOrders} color="purple" />
                </div>

                <div className="flex gap-2 mb-6">
                    <TabButton active={activeTab === "orders"} onClick={() => setActiveTab("orders")}>
                        Pedidos
                    </TabButton>
                    <TabButton active={activeTab === "clients"} onClick={() => setActiveTab("clients")}>
                        Clientes
                    </TabButton>
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
                    <LoadingState />
                ) : activeTab === "orders" ? (
                    <OrdersTable
                        orders={orders}
                        selectedOrder={selectedOrder}
                        updatingOrderId={updatingOrderId}
                        onSelectOrder={(order) => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                        onStatusChange={handleStatusChange}
                    />
                ) : (
                    <ClientsTable
                        clients={clients}
                        selectedClientId={selectedClientId}
                        clientDetail={clientDetail}
                        loadingClientId={loadingClientId}
                        onClientDetail={handleClientDetail}
                    />
                )}
            </div>
        </div>
    )
}

const StatCard = ({ icon: Icon, label, value, color }) => {
    const colors = {
        orange: "bg-orange-100 text-orange-600",
        blue: "bg-blue-100 text-blue-600",
        green: "bg-green-100 text-green-600",
        purple: "bg-purple-100 text-purple-600",
    }

    return (
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-gray-400 text-sm">{label}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
                </div>
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${colors[color]}`}>
                    {createElement(Icon, { size: 22 })}
                </div>
            </div>
        </div>
    )
}

const TabButton = ({ active, children, onClick }) => (
    <button
        onClick={onClick}
        className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${active
            ? "bg-orange-500 text-white"
            : "bg-white text-gray-600 border border-gray-200 hover:border-orange-400"
            }`}
    >
        {children}
    </button>
)

const LoadingState = () => (
    <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
)

const OrdersTable = ({ orders, selectedOrder, updatingOrderId, onSelectOrder, onStatusChange }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4 text-left">Pedido</th>
                        <th className="px-6 py-4 text-left">Cliente</th>
                        <th className="px-6 py-4 text-left">Total</th>
                        <th className="px-6 py-4 text-left">Estado</th>
                        <th className="px-6 py-4 text-left">Fecha</th>
                        <th className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => (
                        <Fragment key={order.id}>
                            <tr className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 font-semibold text-gray-800">#{order.id}</td>
                                <td className="px-6 py-4">
                                    <p className="font-semibold text-gray-800">{order.user_name}</p>
                                    <p className="text-xs text-gray-400">{order.user_email}</p>
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-800">{formatCurrency(order.total)}</td>
                                <td className="px-6 py-4">
                                    <select
                                        value={order.status}
                                        disabled={updatingOrderId === order.id}
                                        onChange={(event) => onStatusChange(order.id, event.target.value)}
                                        className={`text-xs font-semibold px-3 py-1 rounded-full border-0 cursor-pointer ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}
                                    >
                                        {Object.entries(statusLabels).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-xs">
                                    {new Date(order.created_at).toLocaleDateString("es-CL")}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => onSelectOrder(order)}
                                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${selectedOrder?.id === order.id
                                            ? "bg-blue-500 text-white"
                                            : "text-blue-600 bg-blue-50 hover:bg-blue-100"
                                            }`}
                                        title="Ver detalle"
                                    >
                                        <Eye size={16} />
                                        {selectedOrder?.id === order.id ? "Ocultar" : "Ver"}
                                    </button>
                                    <button
                                        onClick={() => openOrderPdf(order)}
                                        className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                                        title="Descargar resumen PDF"
                                    >
                                        <Download size={15} />
                                        PDF
                                    </button>
                                </td>
                            </tr>
                            {selectedOrder?.id === order.id && (
                                <tr>
                                    <td colSpan={6} className="p-0">
                                        <OrderDetail order={order} />
                                    </td>
                                </tr>
                            )}
                        </Fragment>
                    ))}
                </tbody>
            </table>
        </div>

        {orders.length === 0 && <EmptyState text="No hay pedidos registrados" />}
    </div>
)

const OrderDetail = ({ order }) => (
    <div className="border-t border-gray-100 p-5 bg-blue-50">
        <h3 className="font-bold text-gray-800 mb-4">Detalle pedido #{order.id}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <p className="text-xs text-gray-500">Cliente</p>
                <p className="text-sm font-semibold text-gray-800">{order.user_name}</p>
                <p className="text-xs text-gray-500">{order.user_email}</p>
                <p className="text-xs text-gray-500">{order.user_phone || "Sin telefono"}</p>
            </div>
            <div>
                <p className="text-xs text-gray-500">Direccion</p>
                <p className="text-sm font-semibold text-gray-800">{formatAddress(order.address)}</p>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {order.items?.map((item) => (
                <div key={`${order.id}-${item.product_id}`} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-100">
                    {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-12 h-12 object-contain rounded-lg border border-gray-200" />
                    ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg" />
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">Cantidad: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(Number(item.price) * Number(item.quantity))}</p>
                </div>
            ))}
        </div>
    </div>
)

const ClientsTable = ({ clients, selectedClientId, clientDetail, loadingClientId, onClientDetail }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[980px]">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4 text-left">Cliente</th>
                        <th className="px-6 py-4 text-left">RUT</th>
                        <th className="px-6 py-4 text-left">Telefono</th>
                        <th className="px-6 py-4 text-left">Tipo</th>
                        <th className="px-6 py-4 text-left">Compras</th>
                        <th className="px-6 py-4 text-left">Puntos</th>
                        <th className="px-6 py-4 text-left">Registro</th>
                        <th className="px-6 py-4 text-center">Ficha</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {clients.map((client) => (
                        <Fragment key={client.id}>
                            <tr className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                                            {client.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{client.name} {client.lastname}</p>
                                            <p className="text-gray-400 text-xs">{client.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{client.rut || "-"}</td>
                                <td className="px-6 py-4 text-gray-600">{client.phone || "-"}</td>
                                <td className="px-6 py-4">
                                    <ClientTypeBadge type={client.user_type} />
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-semibold text-gray-800">{client.order_count || 0}</p>
                                    <p className="text-xs text-gray-400">{formatCurrency(client.total_spent)}</p>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{client.points_balance || 0}</td>
                                <td className="px-6 py-4 text-gray-400 text-xs">
                                    {new Date(client.created_at).toLocaleDateString("es-CL")}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        type="button"
                                        onClick={() => onClientDetail(client.id)}
                                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${selectedClientId === client.id
                                            ? "bg-blue-500 text-white"
                                            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                            }`}
                                    >
                                        <Eye size={15} />
                                        {loadingClientId === client.id ? "Cargando..." : selectedClientId === client.id ? "Ocultar" : "Ver"}
                                    </button>
                                </td>
                            </tr>
                            {selectedClientId === client.id && (
                                <tr>
                                    <td colSpan={8} className="p-0">
                                        <ClientDetailPanel detail={clientDetail} fallbackClient={client} loading={loadingClientId === client.id} />
                                    </td>
                                </tr>
                            )}
                        </Fragment>
                    ))}
                </tbody>
            </table>
        </div>
        {clients.length === 0 && <EmptyState text="No hay clientes registrados" />}
    </div>
)

const ClientTypeBadge = ({ type }) => (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${type === "maestro"
        ? "bg-orange-100 text-orange-600"
        : type === "pyme"
            ? "bg-blue-100 text-blue-600"
            : type?.includes("pending")
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-600"
        }`}>
        {type || "cliente"}
    </span>
)

const ClientDetailPanel = ({ detail, fallbackClient, loading }) => {
    if (loading || !detail) {
        return (
            <div className="bg-slate-50 border-t border-gray-100 p-6 text-sm text-gray-400">
                Cargando ficha del cliente...
            </div>
        )
    }

    const client = detail.client || fallbackClient
    const credit = detail.ferre_credit
    const availableCredit = credit ? Number(credit.credit_limit || 0) - Number(credit.balance_used || 0) : 0

    return (
        <div className="bg-slate-50 border-t border-gray-100 p-5">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
                <MiniInfo icon={MapPin} label="Direccion" value={formatAddress(client.address)} />
                <MiniInfo icon={Star} label="Puntos" value={`${detail.points?.balance || 0} puntos`} />
                <MiniInfo icon={CreditCard} label="FerreCredito" value={credit ? `${formatCurrency(availableCredit)} disponible` : "Sin credito"} />
                <MiniInfo icon={ShoppingBag} label="Compras" value={`${detail.orders?.length || 0} recientes`} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <section className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800">Compras recientes</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {detail.orders?.length ? detail.orders.map((order) => (
                            <div key={order.id} className="p-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="font-semibold text-gray-800">Pedido #{order.id}</p>
                                    <p className="text-xs text-gray-400">{statusLabels[order.status] || order.status} | {new Date(order.created_at).toLocaleDateString("es-CL")}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-orange-600">{formatCurrency(order.total)}</p>
                                    <button
                                        type="button"
                                        onClick={() => openOrderPdf({ ...order, user_name: client.name, user_lastname: client.lastname, user_email: client.email, user_phone: client.phone })}
                                        className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                                    >
                                        <Download size={14} />
                                        PDF
                                    </button>
                                </div>
                            </div>
                        )) : <EmptyInline text="Sin compras registradas" />}
                    </div>
                </section>

                <section className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800">Puntos e historial</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {detail.points?.transactions?.length ? detail.points.transactions.map((tx) => (
                            <div key={tx.id} className="p-4 flex justify-between gap-4">
                                <div>
                                    <p className="font-semibold text-gray-800">{tx.description || tx.type}</p>
                                    <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString("es-CL")}</p>
                                </div>
                                <p className={`font-bold ${tx.type === "used" ? "text-red-600" : "text-green-600"}`}>
                                    {tx.type === "used" ? "-" : "+"}{tx.points}
                                </p>
                            </div>
                        )) : <EmptyInline text="Sin movimientos de puntos" />}
                    </div>
                </section>
            </div>

            {detail.ferre_credit_installments?.length > 0 && (
                <section className="bg-white rounded-lg border border-gray-100 overflow-hidden mt-4">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800">Cuotas FerreCredito</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
                        {detail.ferre_credit_installments.map((inst) => (
                            <div key={inst.id} className="rounded-lg border border-gray-100 p-4">
                                <p className="font-semibold text-gray-800">Pedido #{inst.order_id}</p>
                                <p className="text-sm text-gray-500">{inst.paid_installments}/{inst.installments} cuotas pagadas</p>
                                <p className="text-sm font-bold text-orange-600 mt-1">{formatCurrency(inst.amount_per_installment)} / cuota</p>
                                <p className="text-xs text-gray-400 mt-1">Vence: {inst.due_date ? new Date(inst.due_date).toLocaleDateString("es-CL") : "Sin fecha"}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

const MiniInfo = ({ icon: Icon, label, value }) => (
    <div className="bg-white rounded-lg border border-gray-100 p-4">
        <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase">
            <Icon size={15} />
            {label}
        </div>
        <p className="text-sm font-bold text-gray-800 mt-2 break-words">{value}</p>
    </div>
)

const EmptyInline = ({ text }) => (
    <div className="p-6 text-center text-sm text-gray-400">{text}</div>
)

const EmptyState = ({ text }) => (
    <div className="text-center py-16 text-gray-400">
        <p>{text}</p>
    </div>
)

export default VendedorPanel
