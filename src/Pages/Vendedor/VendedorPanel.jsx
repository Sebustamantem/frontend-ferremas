import { createElement, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, PackageCheck, RefreshCw, ShoppingBag, TrendingUp, Users } from "lucide-react"
import api from "../../api/axios"
import { useAuth } from "../../context/AuthContext"

const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    paid: "bg-blue-100 text-blue-700",
    processing: "bg-purple-100 text-purple-700",
    shipped: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
}

const statusLabels = {
    pending: "Pendiente",
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
    const [updatingOrderId, setUpdatingOrderId] = useState(null)

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
            setOrders(ordersRes.data)
            setClients(clientsRes.data)
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
            await fetchData()
        } catch (err) {
            alert(err.response?.data?.message || "Error al actualizar el estado")
        } finally {
            setUpdatingOrderId(null)
        }
    }

    const stats = useMemo(() => {
        const validOrders = orders.filter((order) => order.status !== "cancelled")
        const totalSales = validOrders.reduce((acc, order) => acc + Number(order.total || 0), 0)
        const pendingOrders = orders.filter((order) => ["pending", "paid"].includes(order.status)).length

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
                    <ClientsTable clients={clients} />
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
                        <th className="px-6 py-4 text-center">Detalle</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition">
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
                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                    title="Ver detalle"
                                >
                                    <Eye size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {orders.length === 0 && <EmptyState text="No hay pedidos registrados" />}
        {selectedOrder && <OrderDetail order={selectedOrder} />}
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

const ClientsTable = ({ clients }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4 text-left">Cliente</th>
                        <th className="px-6 py-4 text-left">RUT</th>
                        <th className="px-6 py-4 text-left">Telefono</th>
                        <th className="px-6 py-4 text-left">Tipo</th>
                        <th className="px-6 py-4 text-left">Registro</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {clients.map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50 transition">
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
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${client.user_type === "maestro"
                                    ? "bg-orange-100 text-orange-600"
                                    : client.user_type === "pyme"
                                        ? "bg-blue-100 text-blue-600"
                                        : "bg-gray-100 text-gray-600"
                                    }`}>
                                    {client.user_type || "cliente"}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-gray-400 text-xs">
                                {new Date(client.created_at).toLocaleDateString("es-CL")}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {clients.length === 0 && <EmptyState text="No hay clientes registrados" />}
    </div>
)

const EmptyState = ({ text }) => (
    <div className="text-center py-16 text-gray-400">
        <p>{text}</p>
    </div>
)

export default VendedorPanel
