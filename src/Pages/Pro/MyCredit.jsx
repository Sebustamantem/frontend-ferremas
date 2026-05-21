import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, CreditCard, Landmark, ReceiptText } from "lucide-react"
import api from "../../api/axios"
import { useAuth } from "../../context/AuthContext"

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString("es-CL")}`

const MyCredit = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [credit, setCredit] = useState(null)
    const [installments, setInstallments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!user) return
        if (!["maestro", "pyme"].includes(user.user_type)) {
            navigate("/")
            return
        }
        fetchCredit()
    }, [user, navigate])

    const fetchCredit = async () => {
        setLoading(true)
        setError("")
        try {
            const [creditRes, installmentsRes] = await Promise.all([
                api.get("/ferre-credit/my"),
                api.get("/ferre-credit/installments"),
            ])
            setCredit(creditRes.data)
            setInstallments(installmentsRes.data)
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo cargar FerreCredito")
        } finally {
            setLoading(false)
        }
    }

    const summary = useMemo(() => {
        const limit = Number(credit?.credit_limit || 0)
        const used = Number(credit?.balance_used || 0)
        const available = Math.max(limit - used, 0)
        const activeInstallments = installments.filter((item) => item.status === "active")
        const monthlyDebt = activeInstallments.reduce((acc, item) => acc + Number(item.amount_per_installment || 0), 0)

        return { limit, used, available, monthlyDebt, activeInstallments: activeInstallments.length }
    }, [credit, installments])

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-orange-400 transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Mi FerreCredito</h1>
                        <p className="text-gray-500 text-sm mt-1">Cupo, compras a cuotas y estado de pago</p>
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
                        <div className="overflow-hidden rounded-lg bg-gray-900 text-white shadow-sm mb-6">
                            <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                <div>
                                    <p className="text-sm font-semibold text-orange-300">FerreCredito</p>
                                    <h2 className="text-3xl font-bold mt-1">
                                        {credit?.is_active ? "Credito activo" : "Credito no activo"}
                                    </h2>
                                    <p className="text-gray-300 text-sm mt-2">
                                        {credit?.is_active
                                            ? "Puedes usar tu cupo disponible en el checkout."
                                            : "El administrador debe activar tu linea de credito."}
                                    </p>
                                </div>
                                <div className="bg-white/10 border border-white/15 rounded-lg p-4 min-w-[220px]">
                                    <p className="text-sm text-gray-300">Disponible</p>
                                    <p className="text-3xl font-bold text-white mt-1">{formatCurrency(summary.available)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <StatCard icon={CreditCard} label="Limite aprobado" value={formatCurrency(summary.limit)} color="orange" />
                            <StatCard icon={Landmark} label="Saldo usado" value={formatCurrency(summary.used)} color="red" />
                            <StatCard icon={ReceiptText} label="Compras activas" value={summary.activeInstallments} color="blue" />
                            <StatCard icon={ReceiptText} label="Cuota mensual" value={formatCurrency(summary.monthlyDebt)} color="green" />
                        </div>

                        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h2 className="text-lg font-bold text-gray-800">Mis cuotas</h2>
                                <p className="text-sm text-gray-400">{installments.length} compras con FerreCredito</p>
                            </div>

                            {installments.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    No tienes compras con FerreCredito todavia.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm min-w-[760px]">
                                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                            <tr>
                                                <th className="px-6 py-4 text-left">Orden</th>
                                                <th className="px-6 py-4 text-left">Total</th>
                                                <th className="px-6 py-4 text-left">Cuotas</th>
                                                <th className="px-6 py-4 text-left">Valor cuota</th>
                                                <th className="px-6 py-4 text-left">Pagadas</th>
                                                <th className="px-6 py-4 text-left">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {installments.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50 transition">
                                                    <td className="px-6 py-4 font-semibold text-gray-800">#{item.order_id}</td>
                                                    <td className="px-6 py-4 font-semibold text-gray-800">{formatCurrency(item.total_amount)}</td>
                                                    <td className="px-6 py-4 text-gray-600">{item.installments}</td>
                                                    <td className="px-6 py-4 text-gray-600">{formatCurrency(item.amount_per_installment)}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                                            {item.paid_installments}/{item.installments}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${item.status === "completed"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-blue-100 text-blue-700"
                                                            }`}>
                                                            {item.status === "completed" ? "Completado" : "Activo"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

const StatCard = ({ icon: Icon, label, value, color }) => {
    const colors = {
        orange: "bg-orange-100 text-orange-600",
        red: "bg-red-100 text-red-600",
        blue: "bg-blue-100 text-blue-600",
        green: "bg-green-100 text-green-600",
    }

    return (
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-gray-400 text-sm">{label}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
                </div>
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${colors[color]}`}>
                    <Icon size={22} />
                </div>
            </div>
        </div>
    )
}

export default MyCredit
