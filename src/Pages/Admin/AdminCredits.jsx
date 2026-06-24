import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { CreditCard, ReceiptText, X, Check } from "lucide-react"
import api from "../../api/axios"
import { downloadCsv } from "../../utils/csv"
import ExportMenu from "../../components/ui/ExportMenu"

const AdminCredits = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [users, setUsers] = useState([])
    const [credits, setCredits] = useState([])
    const [installments, setInstallments] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [form, setForm] = useState({ credit_limit: "", is_active: true })
    const [activeTab, setActiveTab] = useState("credits")
    const [error, setError] = useState("")
    const [notice, setNotice] = useState(null)
    const [confirmAction, setConfirmAction] = useState(null)

    useEffect(() => {
        if (!user || user.role !== "admin") { navigate("/"); return }
        fetchData()
    }, [user])

    const fetchData = async () => {
        setError("")
        try {
            const [usersRes, creditsRes] = await Promise.all([
                api.get("/users"),
                api.get("/ferre-credit/all")
            ])
            setUsers(usersRes.data.filter(u => ["maestro", "pyme", "maestro_pending", "pyme_pending"].includes(u.user_type)))
            setCredits(creditsRes.data)
        } catch (err) {
            setError(err.response?.data?.message || "Error al cargar FerreCredito")
        } finally {
            setLoading(false)
        }
    }

    const fetchInstallments = async () => {
        try {
            const res = await api.get("/ferre-credit/all-installments")
            setInstallments(res.data)
        } catch (err) {
            setError(err.response?.data?.message || "Error al cargar cuotas")
        }
    }

    const handleTabChange = (tab) => {
        setActiveTab(tab)
        if (tab === "installments") fetchInstallments()
    }

    const handleSetCredit = (u) => {
        setSelectedUser(u)
        const existing = credits.find(c => c.user_id === u.id)
        setForm({
            credit_limit: existing?.credit_limit || "",
            is_active: existing?.is_active ?? true
        })
        setShowModal(true)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        try {
            await api.post(`/ferre-credit/user/${selectedUser.id}`, form)
            setShowModal(false)
            setNotice({ type: "success", message: "FerreCredito guardado correctamente." })
            fetchData()
        } catch (err) {
            setNotice({ type: "error", message: err.response?.data?.message || "Error al guardar FerreCredito" })
        }
    }

    const handleRejectApplication = async (u) => {
        setConfirmAction({
            title: "Rechazar postulacion",
            message: `Rechazar postulacion de ${u.name}?`,
            confirmLabel: "Rechazar",
            tone: "danger",
            run: async () => {
                await api.post(`/ferre-credit/user/${u.id}/reject`)
                setNotice({ type: "success", message: "Postulacion rechazada." })
                fetchData()
            },
        })
    }

    const handlePayInstallment = async (installmentId) => {
        setConfirmAction({
            title: "Registrar pago",
            message: "Registrar pago de esta cuota?",
            confirmLabel: "Registrar pago",
            tone: "success",
            run: async () => {
                await api.post(`/ferre-credit/installments/${installmentId}/pay`)
                setNotice({ type: "success", message: "Pago de cuota registrado." })
                fetchInstallments()
            },
        })
    }

    const runConfirmAction = async () => {
        if (!confirmAction) return
        try {
            await confirmAction.run()
            setConfirmAction(null)
        } catch (err) {
            setNotice({ type: "error", message: err.response?.data?.message || "No se pudo completar la accion" })
        }
    }
    const getCreditForUser = (userId) => credits.find(c => c.user_id === userId)
    const isPendingApplication = (type) => ["maestro_pending", "pyme_pending"].includes(type)
    const getUserTypeLabel = (type) => {
        if (type === "maestro" || type === "maestro_pending") return "Maestro"
        if (type === "pyme" || type === "pyme_pending") return "PYME"
        return "Cliente"
    }

    const statusColors = {
        active: "bg-yellow-100 text-yellow-600",
        completed: "bg-green-100 text-green-600",
        overdue: "bg-red-100 text-red-600",
    }

    const statusLabels = {
        active: "Pendiente",
        completed: "Pagada",
        overdue: "Vencida",
    }

    const formatDate = (value) => {
        if (!value) return "Sin fecha"
        return new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })
    }

    const exportCredits = () => {
        downloadCsv("ferremas-creditos.csv", users.map((item) => {
            const credit = getCreditForUser(item.id)
            return {
                id_usuario: item.id,
                nombre: `${item.name || ""} ${item.lastname || ""}`.trim(),
                email: item.email,
                tipo: item.user_type,
                limite: credit ? Number(credit.credit_limit || 0) : 0,
                usado: credit ? Number(credit.balance_used || 0) : 0,
                disponible: credit ? Number(credit.credit_limit || 0) - Number(credit.balance_used || 0) : 0,
                activo: credit ? (credit.is_active ? "si" : "no") : "sin_credito",
            }
        }))
    }

    const exportInstallments = () => {
        downloadCsv("ferremas-cuotas.csv", installments.map((inst) => ({
            id: inst.id,
            usuario: inst.user_name,
            email: inst.user_email,
            orden: inst.order_id,
            total: Number(inst.total_amount || 0),
            cuotas: inst.installments,
            cuota_mensual: Number(inst.amount_per_installment || 0),
            pagadas: inst.paid_installments,
            vencimiento: inst.due_date || "",
            estado: inst.effective_status || inst.status,
        })))
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">FerreCredito</h1>
                        <p className="text-gray-500 text-sm mt-1">Gestión de créditos para maestros y PYMEs</p>
                    </div>
                    <button onClick={() => navigate("/admin/dashboard")}
                        className="text-sm text-orange-500 hover:underline font-medium">
                        Volver al dashboard
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
                        {error}
                    </div>
                )}

                {notice && (
                    <div className={`rounded-xl px-4 py-3 text-sm mb-6 border ${notice.type === "success"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-700"
                        }`}>
                        <div className="flex items-center justify-between gap-4">
                            <span>{notice.message}</span>
                            <button type="button" onClick={() => setNotice(null)} className="font-bold">Cerrar</button>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {["credits", "installments"].map((tab) => (
                        <button key={tab} onClick={() => handleTabChange(tab)}
                            className={`px-5 py-2 rounded-xl text-sm font-medium transition ${activeTab === tab
                                    ? "bg-orange-500 text-white"
                                    : "bg-white text-gray-600 border border-gray-200 hover:border-orange-400"
                                }`}>
                            <span className="inline-flex items-center gap-2">
                                {tab === "credits" ? <CreditCard size={15} /> : <ReceiptText size={15} />}
                                {tab === "credits" ? "Créditos" : "Cuotas"}
                            </span>
                        </button>
                    ))}
                    <ExportMenu
                        items={[
                            { label: "Créditos", description: "Cupos, usado y disponible", onClick: exportCredits },
                            { label: "Cuotas", description: "Vencimientos y estados", onClick: exportInstallments },
                        ]}
                    />
                </div>

                {/* Tab Créditos */}
                {activeTab === "credits" && (
                    <div className="bg-white rounded-2xl shadow overflow-hidden">
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                <CreditCard size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-semibold text-gray-500">No hay maestros ni PYMEs registrados aún</p>
                                <p className="text-sm text-gray-400 mt-1">Cuando alguien postule, aparecerá en esta lista.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-sm">
                                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Usuario</th>
                                        <th className="px-6 py-4 text-left">Tipo</th>
                                        <th className="px-6 py-4 text-left">Límite</th>
                                        <th className="px-6 py-4 text-left">Usado</th>
                                        <th className="px-6 py-4 text-left">Disponible</th>
                                        <th className="px-6 py-4 text-left">Estado</th>
                                        <th className="px-6 py-4 text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map((u) => {
                                        const credit = getCreditForUser(u.id)
                                        const available = credit
                                            ? Number(credit.credit_limit) - Number(credit.balance_used)
                                            : 0
                                        return (
                                            <tr key={u.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                            {u.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{u.name} {u.lastname}</p>
                                                            <p className="text-gray-400 text-xs">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${u.user_type.includes("maestro")
                                                            ? "bg-orange-100 text-orange-600"
                                                            : "bg-blue-100 text-blue-600"
                                                        }`}>
                                                        {getUserTypeLabel(u.user_type)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-800">
                                                    {credit ? `$${Number(credit.credit_limit).toLocaleString("es-CL")}` : "-"}
                                                </td>
                                                <td className="px-6 py-4 text-red-500 font-medium">
                                                    {credit ? `$${Number(credit.balance_used).toLocaleString("es-CL")}` : "-"}
                                                </td>
                                                <td className="px-6 py-4 text-green-600 font-medium">
                                                    {credit ? `$${available.toLocaleString("es-CL")}` : "-"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isPendingApplication(u.user_type) ? (
                                                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                                            Pendiente admin
                                                        </span>
                                                    ) : credit ? (
                                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${credit.is_active
                                                                ? "bg-green-100 text-green-600"
                                                                : "bg-red-100 text-red-500"
                                                            }`}>
                                                            {credit.is_active ? "Activo" : "Inactivo"}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Sin crédito</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {isPendingApplication(u.user_type) ? (
                                                        <div className="flex justify-center gap-2">
                                                            <button onClick={() => handleSetCredit(u)}
                                                                className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-2 rounded-xl transition">
                                                                Aprobar
                                                            </button>
                                                            <button onClick={() => handleRejectApplication(u)}
                                                                className="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-3 py-2 rounded-xl transition">
                                                                Rechazar
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => handleSetCredit(u)}
                                                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-4 py-2 rounded-xl transition">
                                                            {credit ? "Editar" : "Asignar"}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab Cuotas */}
                {activeTab === "installments" && (
                    <div className="bg-white rounded-2xl shadow overflow-hidden">
                        {installments.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                <ReceiptText size={44} className="mx-auto mb-3 opacity-20" />
                                <p className="font-semibold text-gray-500">No hay cuotas registradas aún</p>
                                <p className="text-sm text-gray-400 mt-1">Las compras con FerreCredito aparecerán aquí.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px] text-sm">
                                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Usuario</th>
                                        <th className="px-6 py-4 text-left">Orden</th>
                                        <th className="px-6 py-4 text-left">Total</th>
                                        <th className="px-6 py-4 text-left">Cuotas</th>
                                        <th className="px-6 py-4 text-left">Por cuota</th>
                                        <th className="px-6 py-4 text-left">Pagadas</th>
                                        <th className="px-6 py-4 text-left">Vence</th>
                                        <th className="px-6 py-4 text-left">Estado</th>
                                        <th className="px-6 py-4 text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {installments.map((inst) => (
                                        <tr key={inst.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-800">{inst.user_name}</p>
                                                <p className="text-xs text-gray-400">{inst.user_email}</p>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">#{inst.order_id}</td>
                                            <td className="px-6 py-4 font-semibold">
                                                ${Number(inst.total_amount).toLocaleString("es-CL")}
                                            </td>
                                            <td className="px-6 py-4">{inst.installments}</td>
                                            <td className="px-6 py-4">
                                                ${Number(inst.amount_per_installment).toLocaleString("es-CL")}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${inst.paid_installments >= inst.installments
                                                        ? "bg-green-100 text-green-600"
                                                        : "bg-yellow-100 text-yellow-600"
                                                    }`}>
                                                    {inst.paid_installments}/{inst.installments}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {formatDate(inst.due_date)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[inst.effective_status || inst.status] || "bg-gray-100 text-gray-600"}`}>
                                                    {statusLabels[inst.effective_status || inst.status] || inst.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {(inst.effective_status || inst.status) !== "completed" && inst.paid_installments < inst.installments && (
                                                    <button onClick={() => handlePayInstallment(inst.id)}
                                                        className="bg-green-500 hover:bg-green-600 text-white text-xs px-4 py-2 rounded-xl transition flex items-center gap-1 mx-auto">
                                                        <Check size={14} />
                                                        Registrar pago
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal asignar crédito */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
                        <button onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Asignar FerreCredito</h2>
                        <p className="text-sm text-gray-400 mb-6">
                            {selectedUser?.name} {selectedUser?.lastname} —{" "}
                            <span className="text-orange-500">{selectedUser?.user_type}</span>
                        </p>

                        <form onSubmit={handleSave} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500 font-medium">Límite de crédito ($)</label>
                                <input type="number" value={form.credit_limit} min="0"
                                    onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
                                    required placeholder="Ej: 500000"
                                    className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50" />
                            </div>

                            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                                <input type="checkbox" id="is_active" checked={form.is_active}
                                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                    className="w-4 h-4 accent-orange-500" />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                    Crédito activo
                                </label>
                            </div>

                            <button type="submit"
                                className="bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition">
                                Guardar
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {confirmAction && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900">{confirmAction.title}</h2>
                        <p className="text-sm text-gray-500 mt-2">{confirmAction.message}</p>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                type="button"
                                onClick={() => setConfirmAction(null)}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={runConfirmAction}
                                className={`px-4 py-2 rounded-xl text-white text-sm font-semibold ${confirmAction.tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                            >
                                {confirmAction.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminCredits
