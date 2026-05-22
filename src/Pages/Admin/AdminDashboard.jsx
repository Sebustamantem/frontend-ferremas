import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    BarChart3,
    Boxes,
    CreditCard,
    MessageSquareText,
    PackageCheck,
    RefreshCw,
    ShoppingBag,
    Star,
    Users,
} from "lucide-react"
import api from "../../api/axios"
import { useAuth } from "../../context/AuthContext"

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString("es-CL")}`

const formatDate = (value) => {
    if (!value) return "Sin fecha"
    return new Date(value).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}

const statusLabels = {
    pending: "Pendiente",
    transfer_pending: "Transferencia",
    paid: "Pagado",
    processing: "Preparacion",
    shipped: "Despachado",
    delivered: "Entregado",
    cancelled: "Cancelado",
}

const AdminDashboard = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [dashboard, setDashboard] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!user || user.role !== "admin") {
            navigate("/")
            return
        }
        fetchDashboard()
    }, [user, navigate])

    const fetchDashboard = async () => {
        setLoading(true)
        setError("")
        try {
            const res = await api.get("/staff/admin/dashboard")
            setDashboard(res.data)
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo cargar el dashboard")
        } finally {
            setLoading(false)
        }
    }

    const satisfaction = useMemo(() => {
        const average = Number(dashboard?.surveys?.average_rating || 0)
        return average > 0 ? `${average.toFixed(1)} / 5` : "Sin datos"
    }, [dashboard])

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 overflow-hidden rounded-lg bg-gray-900 text-white shadow-sm">
                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div>
                                <p className="text-sm font-semibold text-orange-300">Administrador</p>
                                <h1 className="text-3xl font-bold mt-1">Dashboard principal</h1>
                                <p className="text-gray-300 text-sm mt-2">
                                    Vista rapida de ventas, pedidos, usuarios, servicios y satisfaccion.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <NavButton icon={Boxes} label="Productos" onClick={() => navigate("/admin/products")} />
                                <NavButton icon={Users} label="Usuarios" onClick={() => navigate("/admin/users")} />
                                <NavButton icon={CreditCard} label="Creditos" onClick={() => navigate("/admin/credits")} />
                                <button
                                    onClick={fetchDashboard}
                                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                                >
                                    <RefreshCw size={16} />
                                    Actualizar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
                            <MetricCard icon={BarChart3} label="Ventas de hoy" value={formatCurrency(dashboard?.sales_today?.total)} note={`${dashboard?.sales_today?.count || 0} pedidos`} color="orange" />
                            <MetricCard icon={PackageCheck} label="Pedidos pendientes" value={dashboard?.pending_orders || 0} note="Por gestionar" color="blue" />
                            <MetricCard icon={Users} label="Usuarios nuevos" value={dashboard?.new_users_7d || 0} note="Ultimos 7 dias" color="green" />
                            <MetricCard icon={ShoppingBag} label="Servicios publicados" value={dashboard?.services?.active || 0} note={`${dashboard?.services?.total || 0} totales`} color="purple" />
                            <MetricCard icon={Star} label="Satisfaccion" value={satisfaction} note={`${dashboard?.surveys?.total || 0} encuestas`} color="yellow" />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                                <SectionHeader icon={MessageSquareText} title="Encuestas de satisfaccion" subtitle="Comentarios recientes de clientes" />
                                {dashboard?.surveys?.comments?.length ? (
                                    <div className="divide-y divide-gray-100">
                                        {dashboard.surveys.comments.map((survey) => (
                                            <article key={survey.id} className="p-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-gray-900">
                                                                {survey.user_name || "Cliente"} {survey.user_lastname || ""}
                                                            </p>
                                                            <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-1 rounded-full">
                                                                {survey.rating}/5
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Pedido #{survey.order_id || "N/A"} · {formatDate(survey.created_at)}
                                                        </p>
                                                    </div>
                                                    <Star size={18} className="text-yellow-500 shrink-0" />
                                                </div>
                                                <p className="text-sm text-gray-600 mt-3">
                                                    {survey.comment || "Sin comentario escrito."}
                                                </p>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState text="Todavia no hay encuestas registradas." />
                                )}
                            </section>

                            <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                                <SectionHeader icon={PackageCheck} title="Pedidos recientes" subtitle="Ultimos movimientos del comercio" />
                                {dashboard?.recent_orders?.length ? (
                                    <div className="divide-y divide-gray-100">
                                        {dashboard.recent_orders.map((order) => (
                                            <article key={order.id} className="p-5">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">Pedido #{order.id}</p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {order.user_name || "Cliente"} {order.user_lastname || ""} · {formatDate(order.created_at)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-orange-600">{formatCurrency(order.total)}</p>
                                                        <p className="text-xs text-gray-500">{statusLabels[order.status] || order.status}</p>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState text="Todavia no hay pedidos registrados." />
                                )}
                            </section>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

const NavButton = ({ icon: Icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
    >
        <Icon size={16} />
        {label}
    </button>
)

const MetricCard = ({ icon: Icon, label, value, note, color }) => {
    const colors = {
        orange: "bg-orange-100 text-orange-600",
        blue: "bg-blue-100 text-blue-600",
        green: "bg-green-100 text-green-600",
        purple: "bg-purple-100 text-purple-600",
        yellow: "bg-yellow-100 text-yellow-700",
    }

    return (
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-gray-400 text-sm">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
                    <p className="text-xs text-gray-400 mt-1">{note}</p>
                </div>
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${colors[color]}`}>
                    <Icon size={22} />
                </div>
            </div>
        </div>
    )
}

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
            <Icon size={20} />
        </div>
        <div>
            <h2 className="font-bold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
    </div>
)

const EmptyState = ({ text }) => (
    <div className="text-center py-14 text-gray-400 text-sm">{text}</div>
)

export default AdminDashboard
