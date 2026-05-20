import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { ShoppingBag, Users, TrendingUp, Eye } from "lucide-react"
import api from "../../api/axios"

const statusColors = {
    pending: "bg-yellow-100 text-yellow-600",
    paid: "bg-blue-100 text-blue-600",
    processing: "bg-purple-100 text-purple-600",
    shipped: "bg-orange-100 text-orange-600",
    delivered: "bg-green-100 text-green-600",
    cancelled: "bg-red-100 text-red-600",
}

const statusLabels = {
    pending: "⏳ Pendiente",
    paid: "💳 Pagado",
    processing: "⚙️ Procesando",
    shipped: "🚚 Enviado",
    delivered: "✅ Entregado",
    cancelled: "❌ Cancelado",
}

const VendedorPanel = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState("orders")
    const [orders, setOrders] = useState([])
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState(null)

    useEffect(() => {
        if (!user || !["admin", "vendedor"].includes(user.role)) {
            navigate("/")
            return
        }
        fetchData()
    }, [user])

    const fetchData = async () => {
        try {
            const [ordersRes, clientsRes] = await Promise.all([
                api.get("/staff/orders"),
                api.get("/staff/clients")
            ])
            setOrders(ordersRes.data)
            setClients(clientsRes.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (orderId, status) => {
        try {
            await api.put(`/staff/orders/${orderId}/status`, { status })
            fetchData()
        } catch (err) {
            alert(err.response?.data?.message || "Error al actualizar estado")
        }
    }

    const totalVentas = orders
        .filter(o => o.status !== "cancelled")
        .reduce((acc, o) => acc + Number(o.total), 0)

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Panel Vendedor</h1>
                    <p className="text-gray-500 text-sm mt-1">Bienvenido, {user?.name}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Pedidos</p>
                                <p className="text-3xl font-bold text-gray-800">{orders.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                <ShoppingBag size={24} className="text-orange-500" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Clientes</p>
                                <p className="text-3xl font-bold text-gray-800">{clients.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Users size={24} className="text-blue-500" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Ventas Totales</p>
                                <p className="text-2xl font-bold text-gray-800">${totalVentas.toLocaleString("es-CL")}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <TrendingUp size={24} className="text-green-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {["orders", "clients"].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 rounded-xl text-sm font-medium transition ${activeTab === tab
                                    ? "bg-orange-500 text-white"
                                    : "bg-white text-gray-600 border border-gray-200 hover:border-orange-400"
                                }`}>
                            {tab === "orders" ? "📦 Pedidos" : "👥 Clientes"}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Tab Pedidos */}
                        {activeTab === "orders" && (
                            <div className="bg-white rounded-2xl shadow overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-4 text-left">#</th>
                                            <th className="px-6 py-4 text-left">Cliente</th>
                                            <th className="px-6 py-4 text-left">Total</th>
                                            <th className="px-6 py-4 text-left">Estado</th>
                                            <th className="px-6 py-4 text-left">Fecha</th>
                                            <th className="px-6 py-4 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {orders.map((o) => (
                                            <tr key={o.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 font-semibold text-gray-800">#{o.id}</td>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-gray-800">{o.user_name}</p>
                                                    <p className="text-xs text-gray-400">{o.user_email}</p>
                                                </td>
                                                <td className="px-6 py-4 font-semibold">
                                                    ${Number(o.total).toLocaleString("es-CL")}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={o.status}
                                                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                                                        className={`text-xs font-semibold px-3 py-1 rounded-full border-0 cursor-pointer ${statusColors[o.status]}`}
                                                    >
                                                        {Object.entries(statusLabels).map(([val, label]) => (
                                                            <option key={val} value={val}>{label}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-gray-400 text-xs">
                                                    {new Date(o.created_at).toLocaleDateString("es-CL")}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => setSelectedOrder(selectedOrder?.id === o.id ? null : o)}
                                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition">
                                                        <Eye size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Detalle orden expandida */}
                                {selectedOrder && (
                                    <div className="border-t border-gray-100 p-6 bg-blue-50">
                                        <h3 className="font-bold text-gray-800 mb-3">Detalle Pedido #{selectedOrder.id}</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-xs text-gray-400">Cliente</p>
                                                <p className="text-sm font-semibold">{selectedOrder.user_name}</p>
                                                <p className="text-xs text-gray-500">{selectedOrder.user_email}</p>
                                                <p className="text-xs text-gray-500">{selectedOrder.user_phone}</p>
                                            </div>
                                            {selectedOrder.address && (
                                                <div>
                                                    <p className="text-xs text-gray-400">Dirección</p>
                                                    {(() => {
                                                        const addr = typeof selectedOrder.address === "string"
                                                            ? JSON.parse(selectedOrder.address)
                                                            : selectedOrder.address
                                                        return (
                                                            <p className="text-sm font-semibold">
                                                                {addr.street} {addr.number}, {addr.city}, {addr.region}
                                                            </p>
                                                        )
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {selectedOrder.items?.map((item, i) => (
                                                <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3">
                                                    {item.image_url && (
                                                        <img src={item.image_url} alt={item.name}
                                                            className="w-10 h-10 object-contain rounded-lg border border-gray-200" />
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{item.name}</p>
                                                        <p className="text-xs text-gray-400">x{item.quantity}</p>
                                                    </div>
                                                    <p className="text-sm font-semibold">
                                                        ${Number(item.price * item.quantity).toLocaleString("es-CL")}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab Clientes */}
                        {activeTab === "clients" && (
                            <div className="bg-white rounded-2xl shadow overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-4 text-left">Cliente</th>
                                            <th className="px-6 py-4 text-left">RUT</th>
                                            <th className="px-6 py-4 text-left">Teléfono</th>
                                            <th className="px-6 py-4 text-left">Tipo</th>
                                            <th className="px-6 py-4 text-left">Registro</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {clients.map((c) => (
                                            <tr key={c.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                                                            {c.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{c.name} {c.lastname}</p>
                                                            <p className="text-gray-400 text-xs">{c.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{c.rut || "—"}</td>
                                                <td className="px-6 py-4 text-gray-600">{c.phone || "—"}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${c.user_type === "maestro" ? "bg-orange-100 text-orange-600" :
                                                            c.user_type === "pyme" ? "bg-blue-100 text-blue-600" :
                                                                "bg-gray-100 text-gray-600"
                                                        }`}>
                                                        {c.user_type === "maestro" ? "🔨 Maestro" :
                                                            c.user_type === "pyme" ? "🏢 PYME" : "👤 Cliente"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-400 text-xs">
                                                    {new Date(c.created_at).toLocaleDateString("es-CL")}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default VendedorPanel