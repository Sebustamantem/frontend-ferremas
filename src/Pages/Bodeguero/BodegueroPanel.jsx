import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { Package, AlertTriangle, Truck } from "lucide-react"
import api from "../../api/axios"

const statusColors = {
    paid: "bg-blue-100 text-blue-600",
    processing: "bg-purple-100 text-purple-600",
    shipped: "bg-orange-100 text-orange-600",
}

const statusLabels = {
    paid: "💳 Pagado",
    processing: "⚙️ Procesando",
    shipped: "🚚 Enviado",
}

const BodegueroPanel = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState("inventory")
    const [inventory, setInventory] = useState([])
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingStock, setEditingStock] = useState(null)
    const [newStock, setNewStock] = useState("")

    useEffect(() => {
        if (!user || !["admin", "bodeguero"].includes(user.role)) {
            navigate("/")
            return
        }
        fetchData()
    }, [user])

    const fetchData = async () => {
        try {
            const [invRes, ordersRes] = await Promise.all([
                api.get("/staff/inventory"),
                api.get("/staff/warehouse/orders")
            ])
            setInventory(invRes.data)
            setOrders(ordersRes.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStock = async (id) => {
        try {
            await api.put(`/staff/inventory/${id}/stock`, { stock: Number(newStock) })
            setEditingStock(null)
            setNewStock("")
            fetchData()
        } catch (err) {
            alert(err.response?.data?.message || "Error al actualizar stock")
        }
    }

    const handleDispatch = async (id) => {
        if (!confirm("¿Marcar este pedido como enviado?")) return
        try {
            await api.put(`/staff/warehouse/orders/${id}/dispatch`)
            fetchData()
        } catch (err) {
            alert(err.response?.data?.message || "Error al despachar pedido")
        }
    }

    const lowStock = inventory.filter(p => p.stock <= 5)

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Panel Bodeguero</h1>
                    <p className="text-gray-500 text-sm mt-1">Bienvenido, {user?.name}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Productos</p>
                                <p className="text-3xl font-bold text-gray-800">{inventory.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                <Package size={24} className="text-orange-500" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Stock Bajo (&le;5)</p>
                                <p className="text-3xl font-bold text-red-500">{lowStock.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <AlertTriangle size={24} className="text-red-500" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Pedidos Pendientes</p>
                                <p className="text-3xl font-bold text-gray-800">{orders.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Truck size={24} className="text-blue-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alerta stock bajo */}
                {lowStock.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
                        <AlertTriangle size={20} className="text-red-500 shrink-0" />
                        <p className="text-sm text-red-700">
                            <span className="font-bold">{lowStock.length} productos</span> con stock bajo o agotado:
                            {" "}{lowStock.map(p => p.name).join(", ")}
                        </p>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {["inventory", "orders"].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 rounded-xl text-sm font-medium transition ${activeTab === tab
                                    ? "bg-orange-500 text-white"
                                    : "bg-white text-gray-600 border border-gray-200 hover:border-orange-400"
                                }`}>
                            {tab === "inventory" ? "📦 Inventario" : "🚚 Despachos"}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Tab Inventario */}
                        {activeTab === "inventory" && (
                            <div className="bg-white rounded-2xl shadow overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-4 text-left">Producto</th>
                                            <th className="px-6 py-4 text-left">Categoría</th>
                                            <th className="px-6 py-4 text-left">Precio</th>
                                            <th className="px-6 py-4 text-left">Stock</th>
                                            <th className="px-6 py-4 text-center">Actualizar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {inventory.map((p) => (
                                            <tr key={p.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {p.image_url ? (
                                                            <img src={p.image_url} alt={p.name}
                                                                className="w-10 h-10 object-contain rounded-lg border border-gray-200" />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-gray-100 rounded-lg" />
                                                        )}
                                                        <p className="font-semibold text-gray-800 line-clamp-1">{p.name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-orange-100 text-orange-600 text-xs px-3 py-1 rounded-full">
                                                        {p.category || "Sin categoría"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-semibold">
                                                    ${Number(p.price).toLocaleString("es-CL")}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${p.stock === 0 ? "bg-red-100 text-red-600" :
                                                            p.stock <= 5 ? "bg-yellow-100 text-yellow-600" :
                                                                "bg-green-100 text-green-600"
                                                        }`}>
                                                        {p.stock} unidades
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {editingStock === p.id ? (
                                                        <div className="flex items-center gap-2 justify-center">
                                                            <input type="number" value={newStock} min="0"
                                                                onChange={(e) => setNewStock(e.target.value)}
                                                                className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                                            <button onClick={() => handleUpdateStock(p.id)}
                                                                className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-600 transition">
                                                                ✓
                                                            </button>
                                                            <button onClick={() => setEditingStock(null)}
                                                                className="bg-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-300 transition">
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => { setEditingStock(p.id); setNewStock(p.stock) }}
                                                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-4 py-2 rounded-xl transition">
                                                            Editar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Tab Despachos */}
                        {activeTab === "orders" && (
                            <div className="bg-white rounded-2xl shadow overflow-hidden">
                                {orders.length === 0 ? (
                                    <div className="text-center py-20 text-gray-400">
                                        <Truck size={48} className="mx-auto mb-4 opacity-20" />
                                        <p>No hay pedidos pendientes de despacho</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                            <tr>
                                                <th className="px-6 py-4 text-left">#</th>
                                                <th className="px-6 py-4 text-left">Cliente</th>
                                                <th className="px-6 py-4 text-left">Productos</th>
                                                <th className="px-6 py-4 text-left">Total</th>
                                                <th className="px-6 py-4 text-left">Estado</th>
                                                <th className="px-6 py-4 text-center">Acción</th>
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
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {o.items?.slice(0, 2).map((item, i) => (
                                                                <p key={i} className="text-xs text-gray-600">
                                                                    {item.name} x{item.quantity}
                                                                </p>
                                                            ))}
                                                            {o.items?.length > 2 && (
                                                                <p className="text-xs text-gray-400">+{o.items.length - 2} más</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-semibold">
                                                        ${Number(o.total).toLocaleString("es-CL")}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[o.status]}`}>
                                                            {statusLabels[o.status]}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {o.status === "processing" && (
                                                            <button onClick={() => handleDispatch(o.id)}
                                                                className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-4 py-2 rounded-xl transition flex items-center gap-1 mx-auto">
                                                                <Truck size={14} />
                                                                Despachar
                                                            </button>
                                                        )}
                                                        {o.status === "shipped" && (
                                                            <span className="text-xs text-green-600 font-medium">✅ Despachado</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default BodegueroPanel