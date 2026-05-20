import { createElement, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertTriangle, Check, Package, RefreshCw, Save, Truck, X } from "lucide-react"
import api from "../../api/axios"
import { useAuth } from "../../context/AuthContext"

const statusColors = {
    paid: "bg-blue-100 text-blue-700",
    processing: "bg-purple-100 text-purple-700",
    shipped: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
}

const statusLabels = {
    paid: "Pagado",
    processing: "Procesando",
    shipped: "Enviado",
    delivered: "Entregado",
}

const warehouseActions = {
    paid: { nextStatus: "processing", label: "Preparar", confirm: "Marcar este pedido como en preparacion?" },
    processing: { nextStatus: "shipped", label: "Despachar", confirm: "Marcar este pedido como enviado?" },
    shipped: { nextStatus: "delivered", label: "Entregado", confirm: "Marcar este pedido como entregado al cliente?" },
}

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString("es-CL")}`

const BodegueroPanel = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState("inventory")
    const [inventory, setInventory] = useState([])
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [editingStockId, setEditingStockId] = useState(null)
    const [stockValue, setStockValue] = useState("")
    const [savingStockId, setSavingStockId] = useState(null)
    const [updatingOrderId, setUpdatingOrderId] = useState(null)

    useEffect(() => {
        if (!user) return
        if (!["admin", "bodeguero"].includes(user.role)) {
            navigate("/")
            return
        }
        fetchData()
    }, [user, navigate])

    const fetchData = async () => {
        setLoading(true)
        setError("")
        try {
            const [inventoryRes, ordersRes] = await Promise.all([
                api.get("/staff/inventory"),
                api.get("/staff/warehouse/orders"),
            ])
            setInventory(inventoryRes.data)
            setOrders(ordersRes.data)
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo cargar el panel de bodeguero")
        } finally {
            setLoading(false)
        }
    }

    const startStockEdit = (product) => {
        setEditingStockId(product.id)
        setStockValue(String(product.stock ?? 0))
    }

    const cancelStockEdit = () => {
        setEditingStockId(null)
        setStockValue("")
    }

    const handleUpdateStock = async (productId) => {
        const stock = Number(stockValue)
        if (!Number.isInteger(stock) || stock < 0) {
            alert("Ingresa un stock valido")
            return
        }

        setSavingStockId(productId)
        try {
            await api.put(`/staff/inventory/${productId}/stock`, { stock })
            cancelStockEdit()
            await fetchData()
        } catch (err) {
            alert(err.response?.data?.message || "Error al actualizar stock")
        } finally {
            setSavingStockId(null)
        }
    }

    const handleWarehouseStatusChange = async (order) => {
        const action = warehouseActions[order.status]
        if (!action) return
        if (!confirm(action.confirm)) return

        setUpdatingOrderId(order.id)
        try {
            await api.put(`/staff/warehouse/orders/${order.id}/status`, { status: action.nextStatus })
            await fetchData()
        } catch (err) {
            alert(err.response?.data?.message || "Error al actualizar el pedido")
        } finally {
            setUpdatingOrderId(null)
        }
    }

    const stats = useMemo(() => {
        const lowStock = inventory.filter((product) => Number(product.stock) > 0 && Number(product.stock) <= 5)
        const outOfStock = inventory.filter((product) => Number(product.stock) === 0)
        const inProgressOrders = orders.filter((order) => ["paid", "processing", "shipped"].includes(order.status))

        return {
            totalProducts: inventory.length,
            lowStock,
            outOfStock,
            inProgressOrders,
        }
    }, [inventory, orders])

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Panel Bodeguero</h1>
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
                    <StatCard icon={Package} label="Productos" value={stats.totalProducts} color="orange" />
                    <StatCard icon={AlertTriangle} label="Stock bajo" value={stats.lowStock.length} color="yellow" />
                    <StatCard icon={X} label="Sin stock" value={stats.outOfStock.length} color="red" />
                    <StatCard icon={Truck} label="En gestion" value={stats.inProgressOrders.length} color="blue" />
                </div>

                {(stats.lowStock.length > 0 || stats.outOfStock.length > 0) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <AlertTriangle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-yellow-800">Revisar inventario</p>
                            <p className="text-sm text-yellow-700 mt-1">
                                {stats.outOfStock.length} productos sin stock y {stats.lowStock.length} con stock bajo.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex gap-2 mb-6">
                    <TabButton active={activeTab === "inventory"} onClick={() => setActiveTab("inventory")}>
                        Inventario
                    </TabButton>
                    <TabButton active={activeTab === "orders"} onClick={() => setActiveTab("orders")}>
                        Despachos
                    </TabButton>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <LoadingState />
                ) : activeTab === "inventory" ? (
                    <InventoryTable
                        products={inventory}
                        editingStockId={editingStockId}
                        stockValue={stockValue}
                        savingStockId={savingStockId}
                        onStockValueChange={setStockValue}
                        onStartEdit={startStockEdit}
                        onCancelEdit={cancelStockEdit}
                        onSaveStock={handleUpdateStock}
                    />
                ) : (
                    <DispatchTable
                        orders={orders}
                        updatingOrderId={updatingOrderId}
                        onStatusChange={handleWarehouseStatusChange}
                    />
                )}
            </div>
        </div>
    )
}

const StatCard = ({ icon: Icon, label, value, color }) => {
    const colors = {
        orange: "bg-orange-100 text-orange-600",
        yellow: "bg-yellow-100 text-yellow-700",
        red: "bg-red-100 text-red-600",
        blue: "bg-blue-100 text-blue-600",
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

const InventoryTable = ({
    products,
    editingStockId,
    stockValue,
    savingStockId,
    onStockValueChange,
    onStartEdit,
    onCancelEdit,
    onSaveStock,
}) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4 text-left">Producto</th>
                        <th className="px-6 py-4 text-left">Categoria</th>
                        <th className="px-6 py-4 text-left">Precio</th>
                        <th className="px-6 py-4 text-left">Stock</th>
                        <th className="px-6 py-4 text-center">Accion</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-11 h-11 object-contain rounded-lg border border-gray-200" />
                                    ) : (
                                        <div className="w-11 h-11 bg-gray-100 rounded-lg" />
                                    )}
                                    <p className="font-semibold text-gray-800 max-w-[300px] truncate">{product.name}</p>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{product.category || "Sin categoria"}</td>
                            <td className="px-6 py-4 font-semibold text-gray-800">{formatCurrency(product.price)}</td>
                            <td className="px-6 py-4">
                                <StockBadge stock={Number(product.stock || 0)} />
                            </td>
                            <td className="px-6 py-4 text-center">
                                {editingStockId === product.id ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            value={stockValue}
                                            onChange={(event) => onStockValueChange(event.target.value)}
                                            className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                        <button
                                            onClick={() => onSaveStock(product.id)}
                                            disabled={savingStockId === product.id}
                                            className="inline-flex items-center justify-center w-9 h-9 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-60 transition"
                                            title="Guardar stock"
                                        >
                                            <Save size={15} />
                                        </button>
                                        <button
                                            onClick={onCancelEdit}
                                            className="inline-flex items-center justify-center w-9 h-9 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition"
                                            title="Cancelar"
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => onStartEdit(product)}
                                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-4 py-2 rounded-lg font-semibold transition"
                                    >
                                        Editar stock
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {products.length === 0 && <EmptyState text="No hay productos en inventario" />}
    </div>
)

const StockBadge = ({ stock }) => {
    const className = stock === 0
        ? "bg-red-100 text-red-700"
        : stock <= 5
            ? "bg-yellow-100 text-yellow-700"
            : "bg-green-100 text-green-700"

    return (
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${className}`}>
            {stock} unidades
        </span>
    )
}

const DispatchTable = ({ orders, updatingOrderId, onStatusChange }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {orders.length === 0 ? (
            <EmptyState text="No hay pedidos pendientes de despacho" />
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4 text-left">Pedido</th>
                            <th className="px-6 py-4 text-left">Cliente</th>
                            <th className="px-6 py-4 text-left">Productos</th>
                            <th className="px-6 py-4 text-left">Total</th>
                            <th className="px-6 py-4 text-left">Estado</th>
                            <th className="px-6 py-4 text-center">Accion</th>
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
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        {order.items?.slice(0, 3).map((item) => (
                                            <p key={`${order.id}-${item.product_id}`} className="text-xs text-gray-600">
                                                {item.name} x{item.quantity}
                                            </p>
                                        ))}
                                        {order.items?.length > 3 && (
                                            <p className="text-xs text-gray-400">+{order.items.length - 3} mas</p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-800">{formatCurrency(order.total)}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
                                        {statusLabels[order.status] || order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {warehouseActions[order.status] ? (
                                        <button
                                            onClick={() => onStatusChange(order)}
                                            disabled={updatingOrderId === order.id}
                                            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs px-4 py-2 rounded-lg font-semibold disabled:opacity-60 transition"
                                        >
                                            <Truck size={14} />
                                            {warehouseActions[order.status].label}
                                        </button>
                                    ) : order.status === "delivered" ? (
                                        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold">
                                            <Check size={14} />
                                            Entregado
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">Sin accion</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
)

const EmptyState = ({ text }) => (
    <div className="text-center py-16 text-gray-400">
        <p>{text}</p>
    </div>
)

export default BodegueroPanel
