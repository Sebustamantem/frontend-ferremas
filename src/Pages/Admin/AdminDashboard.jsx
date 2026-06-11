import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    BarChart3,
    Boxes,
    CreditCard,
    Filter,
    History,
    MessageSquareText,
    PackageCheck,
    RefreshCw,
    ShoppingBag,
    Star,
    TriangleAlert,
    XCircle,
    Users,
} from "lucide-react"
import api from "../../api/axios"
import { useAuth } from "../../context/AuthContext"
import { downloadCsv } from "../../utils/csv"
import ExportMenu from "../../components/ui/ExportMenu"

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
    const [activity, setActivity] = useState([])
    const [activityFilters, setActivityFilters] = useState({ action: "", entity_type: "", date_from: "", date_to: "" })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [notice, setNotice] = useState(null)

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
            setActivity(res.data.recent_activity || [])
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo cargar el dashboard")
        } finally {
            setLoading(false)
        }
    }

    const fetchActivity = async () => {
        try {
            const params = new URLSearchParams()
            Object.entries(activityFilters).forEach(([key, value]) => {
                if (value) params.append(key, value)
            })
            const res = await api.get(`/staff/admin/activity?${params.toString()}`)
            setActivity(res.data || [])
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo cargar el historial")
        }
    }

    const exportDashboard = () => {
        const rows = [
            { indicador: "Ventas de hoy", valor: dashboard?.sales_today?.total || 0, detalle: `${dashboard?.sales_today?.count || 0} pedidos` },
            { indicador: "Pedidos pendientes", valor: dashboard?.pending_orders || 0, detalle: "Por gestionar" },
            { indicador: "Transferencias pendientes", valor: dashboard?.transfer_pending || 0, detalle: "Por confirmar" },
            { indicador: "Productos sin stock", valor: dashboard?.out_of_stock || 0, detalle: "Reponer" },
            { indicador: "Reportes bodega", valor: dashboard?.pending_stock_reports || 0, detalle: "Pendientes" },
            { indicador: "Postulaciones FerreCredito", valor: dashboard?.pending_credit_applications || 0, detalle: "Pendientes" },
            { indicador: "Cuotas vencidas", valor: dashboard?.alerts?.overdue_installments || 0, detalle: "FerreCredito" },
        ]
        downloadCsv("ferremas-dashboard.csv", rows)
    }

    const exportActivity = () => {
        downloadCsv("ferremas-historial.csv", activity.map((item) => ({
            fecha: item.created_at,
            usuario: `${item.user_name || "Sistema"} ${item.user_lastname || ""}`.trim(),
            rol: item.user_role || "",
            accion: item.action,
            entidad: item.entity_type,
            entidad_id: item.entity_id || "",
            descripcion: item.description,
        })))
    }

    const cancelPendingOrders = async () => {
        setNotice(null)
        try {
            const res = await api.post("/staff/admin/pending-orders/cancel")
            setNotice({ type: "success", message: res.data?.message || "Pedidos pendientes cancelados." })
            await fetchDashboard()
        } catch (err) {
            setNotice({ type: "error", message: err.response?.data?.message || "No se pudieron cancelar los pendientes." })
        }
    }

    const satisfaction = useMemo(() => {
        const average = Number(dashboard?.surveys?.average_rating || 0)
        return average > 0 ? `${average.toFixed(1)} / 5` : "Sin datos"
    }, [dashboard])

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 overflow-visible rounded-lg bg-gray-900 text-white shadow-sm">
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
                                <NavButton icon={Users} label="Clientes" onClick={() => navigate("/vendedor")} />
                                <NavButton icon={CreditCard} label="Creditos" onClick={() => navigate("/admin/credits")} />
                                <button
                                    onClick={fetchDashboard}
                                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                                >
                                    <RefreshCw size={16} />
                                    Actualizar
                                </button>
                                <button
                                    onClick={cancelPendingOrders}
                                    className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                                >
                                    <XCircle size={16} />
                                    Cancelar pendientes
                                </button>
                                <ExportMenu
                                    dark
                                    items={[
                                        { label: "Resumen dashboard", description: "Indicadores principales", onClick: exportDashboard },
                                        { label: "Historial filtrado", description: "Acciones visibles en tabla", onClick: exportActivity },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
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
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
                            <MetricCard icon={BarChart3} label="Ventas de hoy" value={formatCurrency(dashboard?.sales_today?.total)} note={`${dashboard?.sales_today?.count || 0} pedidos`} color="orange" />
                            <MetricCard icon={PackageCheck} label="Pedidos pendientes" value={dashboard?.pending_orders || 0} note="Por gestionar" color="blue" />
                            <MetricCard icon={TriangleAlert} label="Productos sin stock" value={dashboard?.out_of_stock || 0} note="Reponer o despublicar" color="red" />
                            <MetricCard icon={MessageSquareText} label="Reportes bodega" value={dashboard?.pending_stock_reports || 0} note="Avisos pendientes" color="yellow" />
                            <MetricCard icon={CreditCard} label="FerreCredito" value={dashboard?.pending_credit_applications || 0} note="Postulaciones" color="green" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                            <MetricCard icon={PackageCheck} label="Transferencias" value={dashboard?.transfer_pending || 0} note="Por confirmar" color="blue" />
                            <MetricCard icon={Users} label="Usuarios nuevos" value={dashboard?.new_users_7d || 0} note="Ultimos 7 dias" color="green" />
                            <MetricCard icon={ShoppingBag} label="Servicios publicados" value={dashboard?.services?.active || 0} note={`${dashboard?.services?.total || 0} totales`} color="purple" />
                            <MetricCard icon={Star} label="Satisfaccion" value={satisfaction} note={`${dashboard?.surveys?.total || 0} encuestas`} color="yellow" />
                        </div>

                        {(dashboard?.alerts?.aged_transfer_pending > 0 || dashboard?.alerts?.aged_paid_orders > 0 || dashboard?.alerts?.overdue_installments > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <AlertCard label="Transferencias +24h" value={dashboard?.alerts?.aged_transfer_pending || 0} text="Revisar comprobantes pendientes." />
                                <AlertCard label="Pedidos pagados +24h" value={dashboard?.alerts?.aged_paid_orders || 0} text="Coordinar preparacion con bodega." />
                                <AlertCard label="Cuotas vencidas" value={dashboard?.alerts?.overdue_installments || 0} text="Bloquean nuevas compras a credito." />
                            </div>
                        )}

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                            <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                                <SectionHeader icon={BarChart3} title="Ventas 7 dias" subtitle="Monto diario confirmado" />
                                <BarChart
                                    data={dashboard?.charts?.sales_last_7_days || []}
                                    labelKey="date"
                                    valueKey="total"
                                    valueFormatter={formatCurrency}
                                />
                            </section>
                            <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                                <SectionHeader icon={PackageCheck} title="Estados pedido" subtitle="Distribucion operacional" />
                                <BarChart
                                    data={(dashboard?.charts?.orders_by_status || []).map((row) => ({ ...row, label: statusLabels[row.status] || row.status }))}
                                    labelKey="label"
                                    valueKey="count"
                                />
                            </section>
                            <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                                <SectionHeader icon={ShoppingBag} title="Mas vendidos" subtitle="Top productos por unidades" />
                                <BarChart
                                    data={dashboard?.charts?.top_products || []}
                                    labelKey="name"
                                    valueKey="quantity"
                                />
                            </section>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                                <div className="border-b border-gray-100">
                                    <SectionHeader icon={History} title="Historial de acciones" subtitle="Cambios internos recientes" />
                                    <div className="p-4 bg-gray-50 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
                                        <input
                                            value={activityFilters.action}
                                            onChange={(event) => setActivityFilters({ ...activityFilters, action: event.target.value })}
                                            placeholder="Accion"
                                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                        />
                                        <select
                                            value={activityFilters.entity_type}
                                            onChange={(event) => setActivityFilters({ ...activityFilters, entity_type: event.target.value })}
                                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                        >
                                            <option value="">Toda entidad</option>
                                            <option value="product">Producto</option>
                                            <option value="order">Pedido</option>
                                            <option value="user">Usuario</option>
                                            <option value="stock_report">Reporte stock</option>
                                            <option value="ferre_credit_installment">Cuota credito</option>
                                        </select>
                                        <input type="date" value={activityFilters.date_from} onChange={(event) => setActivityFilters({ ...activityFilters, date_from: event.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                                        <input type="date" value={activityFilters.date_to} onChange={(event) => setActivityFilters({ ...activityFilters, date_to: event.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                                        <div className="flex gap-2">
                                            <button type="button" onClick={fetchActivity} className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm font-semibold">
                                                <Filter size={15} />
                                                Filtrar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {activity?.length ? (
                                    <div className="divide-y divide-gray-100">
                                        {activity.map((item) => (
                                            <article key={item.id} className="p-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-gray-900 truncate">{item.description || item.action}</p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {item.user_name || "Sistema"} {item.user_lastname || ""} | {formatDate(item.created_at)}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-1 rounded-full shrink-0">
                                                        {item.entity_type}
                                                    </span>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState text="Todavia no hay acciones registradas." />
                                )}
                            </section>

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
        red: "bg-red-100 text-red-600",
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

const AlertCard = ({ label, value, text }) => (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="text-sm font-bold text-amber-900">{label}</p>
                <p className="text-xs text-amber-800 mt-1">{text}</p>
            </div>
            <span className="bg-amber-500 text-white min-w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold">
                {value}
            </span>
        </div>
    </div>
)

const BarChart = ({ data, labelKey, valueKey, valueFormatter = (value) => value }) => {
    const maxValue = Math.max(...(data || []).map((item) => Number(item[valueKey] || 0)), 1)

    if (!data?.length) return <EmptyState text="Sin datos para graficar." />

    return (
        <div className="p-5 space-y-3">
            {data.map((item, index) => {
                const value = Number(item[valueKey] || 0)
                const width = Math.max((value / maxValue) * 100, value > 0 ? 8 : 0)
                const label = labelKey === "date" ? formatDate(item[labelKey]) : item[labelKey]
                return (
                    <div key={`${label}-${index}`} className="space-y-1">
                        <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-gray-600 font-medium truncate">{label}</span>
                            <span className="text-gray-900 font-bold">{valueFormatter(value)}</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${width}%` }} />
                        </div>
                    </div>
                )
            })}
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
