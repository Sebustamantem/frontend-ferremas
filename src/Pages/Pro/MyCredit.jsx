import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
    AlertTriangle,
    ArrowLeft,
    Ban,
    CalendarClock,
    CheckCircle2,
    CreditCard,
    Landmark,
    ReceiptText,
    WalletCards,
} from "lucide-react"
import api from "../../api/axios"
import { useAuth } from "../../context/AuthContext"

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString("es-CL")}`

const getRemainingDebt = (item) => {
    const paidAmount = Math.max(
        Number(item.paid_amount || 0),
        Number(item.paid_installments || 0) * Number(item.amount_per_installment || 0)
    )
    return Math.max(Number(item.total_amount || 0) - paidAmount, 0)
}

const formatDate = (value) => {
    if (!value) return "Sin fecha"
    return new Intl.DateTimeFormat("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value))
}

const STATUS_CONFIG = {
    approved: {
        label: "Aprobado",
        title: "FerreCredito activo",
        tone: "green",
        icon: CheckCircle2,
    },
    pending: {
        label: "Pendiente",
        title: "Postulación en revisión",
        tone: "yellow",
        icon: CalendarClock,
    },
    inactive: {
        label: "Inactivo",
        title: "Línea desactivada",
        tone: "red",
        icon: Ban,
    },
    rejected: {
        label: "Rechazado",
        title: "Postulación no aprobada",
        tone: "red",
        icon: Ban,
    },
    not_requested: {
        label: "Sin postulación",
        title: "Sin FerreCredito",
        tone: "gray",
        icon: AlertTriangle,
    },
}

const BADGE_CLASSES = {
    green: "bg-green-100 text-green-700 border-green-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    red: "bg-red-100 text-red-700 border-red-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
}

const MyCredit = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [credit, setCredit] = useState(null)
    const [installments, setInstallments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [notice, setNotice] = useState("")
    const [paymentTarget, setPaymentTarget] = useState(null)
    const [paymentType, setPaymentType] = useState("installment")
    const [customAmount, setCustomAmount] = useState("")
    const [payingId, setPayingId] = useState(null)

    useEffect(() => {
        if (!user) return
        fetchCredit()
    }, [user])

    useEffect(() => {
        const paymentStatus = searchParams.get("payment")
        if (paymentStatus === "success") setNotice("Pago Webpay confirmado correctamente.")
        if (paymentStatus === "failure") setError("No se pudo confirmar el pago Webpay.")
    }, [searchParams])

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

    const handleStartWebpayPayment = async () => {
        if (!paymentTarget) return
        setError("")
        setNotice("")
        setPayingId(paymentTarget.id)
        try {
            const res = await api.post(`/ferre-credit/installments/${paymentTarget.id}/webpay`, {
                payment_type: paymentType,
                amount: paymentType === "custom" ? customAmount : undefined,
            })
            const form = document.createElement("form")
            form.method = "POST"
            form.action = res.data.url

            const input = document.createElement("input")
            input.type = "hidden"
            input.name = "token_ws"
            input.value = res.data.token
            form.appendChild(input)

            document.body.appendChild(form)
            form.submit()
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo iniciar el pago Webpay")
            setPayingId(null)
        } finally {
            setPaymentTarget(null)
        }
    }

    const summary = useMemo(() => {
        const limit = Number(credit?.credit_limit || 0)
        const used = Number(credit?.balance_used || 0)
        const available = Math.max(Number(credit?.available ?? limit - used), 0)
        const activeInstallments = installments.filter((item) => item.effective_status !== "completed")
        const overdueInstallments = installments.filter((item) => item.effective_status === "overdue")
        const monthlyDebt = activeInstallments.reduce((acc, item) => acc + Math.min(Number(item.amount_per_installment || 0), getRemainingDebt(item)), 0)
        const nextInstallment = [...activeInstallments]
            .sort((a, b) => new Date(a.due_date || a.created_at) - new Date(b.due_date || b.created_at))[0]

        const blockers = []
        if (credit?.application_status && credit.application_status !== "approved") {
            blockers.push(credit.status_reason)
        }
        if (credit?.application_status === "approved" && available <= 0) {
            blockers.push("No tienes cupo disponible.")
        }
        if (overdueInstallments.length > 0) {
            blockers.push("Tienes cuotas vencidas. Regulariza tus pagos antes de seguir comprando.")
        }

        return {
            limit,
            used,
            available,
            activeInstallments,
            overdueInstallments,
            monthlyDebt,
            nextInstallment,
            blockers: blockers.filter(Boolean),
        }
    }, [credit, installments])

    const status = credit?.application_status || "not_requested"
    const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.not_requested
    const StatusIcon = statusConfig.icon

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
                        <p className="text-gray-500 text-sm mt-1">Estado, cupo y cuotas de tu línea de crédito</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
                        {error}
                    </div>
                )}
                {notice && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-6">
                        {notice}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-medium">Cargando FerreCredito...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-hidden rounded-lg bg-gray-900 text-white shadow-sm mb-6">
                            <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                <div className="max-w-2xl">
                                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${BADGE_CLASSES[statusConfig.tone]}`}>
                                        <StatusIcon size={15} />
                                        {statusConfig.label}
                                    </span>
                                    <h2 className="text-3xl font-bold mt-4">{statusConfig.title}</h2>
                                    <p className="text-gray-300 text-sm mt-2">
                                        {credit?.status_reason || "No hay información de estado disponible."}
                                    </p>
                                </div>
                                <div className="bg-white/10 border border-white/15 rounded-lg p-4 min-w-[240px]">
                                    <p className="text-sm text-gray-300">Cupo disponible</p>
                                    <p className="text-3xl font-bold text-white mt-1">{formatCurrency(summary.available)}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Aprobado: {formatCurrency(summary.limit)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {summary.blockers.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle size={20} className="text-red-600 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-red-700">Por qué no puedes comprar con FerreCredito</p>
                                        <div className="mt-2 flex flex-col gap-1">
                                            {summary.blockers.map((blocker) => (
                                                <p key={blocker} className="text-sm text-red-700">{blocker}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <StatCard icon={CreditCard} label="Cupo aprobado" value={formatCurrency(summary.limit)} color="orange" />
                            <StatCard icon={Landmark} label="Cupo usado" value={formatCurrency(summary.used)} color="red" />
                            <StatCard icon={WalletCards} label="Cupo disponible" value={formatCurrency(summary.available)} color="green" />
                            <StatCard icon={ReceiptText} label="Cuotas pendientes" value={summary.activeInstallments.length} color="blue" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 lg:col-span-2">
                                <div className="flex items-center gap-3 mb-4">
                                    <CalendarClock size={22} className="text-orange-500" />
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800">Próxima cuota</h2>
                                        <p className="text-sm text-gray-400">Fecha y monto estimado del siguiente pago</p>
                                    </div>
                                </div>

                                {summary.nextInstallment ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <InfoTile label="Orden" value={`#${summary.nextInstallment.order_id}`} />
                                        <InfoTile label="Vence" value={formatDate(summary.nextInstallment.due_date)} />
                                        <InfoTile label="Monto" value={formatCurrency(summary.nextInstallment.amount_per_installment)} />
                                    </div>
                                ) : (
                                    <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-6 text-sm text-gray-500">
                                        No tienes cuotas pendientes.
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
                                <p className="text-sm text-gray-400">Pago mensual estimado</p>
                                <p className="text-3xl font-bold text-gray-800 mt-2">{formatCurrency(summary.monthlyDebt)}</p>
                                <p className="text-xs text-gray-400 mt-3">
                                    Suma de cuotas activas. Puede cambiar cuando registres pagos.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h2 className="text-lg font-bold text-gray-800">Historial de cuotas</h2>
                                <p className="text-sm text-gray-400">{installments.length} compras con FerreCredito</p>
                            </div>

                            {installments.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    No tienes compras con FerreCredito todavia.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm min-w-[860px]">
                                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                            <tr>
                                                <th className="px-6 py-4 text-left">Orden</th>
                                                <th className="px-6 py-4 text-left">Total</th>
                                                <th className="px-6 py-4 text-left">Cuotas</th>
                                                <th className="px-6 py-4 text-left">Valor cuota</th>
                                                <th className="px-6 py-4 text-left">Pagado</th>
                                                <th className="px-6 py-4 text-left">Próximo vencimiento</th>
                                                <th className="px-6 py-4 text-left">Estado</th>
                                                <th className="px-6 py-4 text-center">Acción</th>
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
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 w-fit">
                                                                {item.paid_installments}/{item.installments}
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                {formatCurrency(Math.max(Number(item.paid_amount || 0), Number(item.paid_installments || 0) * Number(item.amount_per_installment || 0)))} abonado
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">{formatDate(item.due_date)}</td>
                                                    <td className="px-6 py-4">
                                                        <InstallmentStatus status={item.effective_status || item.status} />
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {item.effective_status === "webpay_pending" ? (
                                                            <span className="text-xs font-semibold text-orange-600">Webpay pendiente</span>
                                                        ) : (item.effective_status || item.status) !== "completed" && getRemainingDebt(item) > 0 ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setPaymentTarget(item)
                                                                    setPaymentType("installment")
                                                                    setCustomAmount("")
                                                                }}
                                                                disabled={payingId === item.id}
                                                                className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                                                            >
                                                                {payingId === item.id ? "Redirigiendo..." : "Pagar cuota"}
                                                            </button>
                                                        ) : null}
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

            {paymentTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h2 className="text-lg font-bold text-gray-900">Pagar FerreCredito</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Orden #{paymentTarget.order_id} - deuda pendiente {formatCurrency(getRemainingDebt(paymentTarget))}
                        </p>

                        <div className="mt-5 grid gap-2">
                            {[
                                ["installment", `Pagar cuota: ${formatCurrency(Math.min(Number(paymentTarget.amount_per_installment || 0), getRemainingDebt(paymentTarget)))}`],
                                ["total", `Pagar total: ${formatCurrency(getRemainingDebt(paymentTarget))}`],
                                ["custom", "Abonar otro monto"],
                            ].map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setPaymentType(value)}
                                    className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${paymentType === value
                                        ? "border-orange-500 bg-orange-50 text-orange-700"
                                        : "border-gray-200 text-gray-600 hover:border-orange-300"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {paymentType === "custom" && (
                            <div className="mt-4">
                                <label className="text-sm font-semibold text-gray-700">Monto a abonar</label>
                                <input
                                    type="number"
                                    min="1000"
                                    max={getRemainingDebt(paymentTarget)}
                                    value={customAmount}
                                    onChange={(event) => setCustomAmount(event.target.value)}
                                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Ej: 25000"
                                />
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setPaymentTarget(null)}
                                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleStartWebpayPayment}
                                className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                            >
                                Ir a Webpay
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

const InfoTile = ({ label, value }) => (
    <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-800 mt-1">{value}</p>
    </div>
)

const InstallmentStatus = ({ status }) => {
    const config = {
        completed: ["Completado", "bg-green-100 text-green-700"],
        webpay_pending: ["Webpay pendiente", "bg-orange-100 text-orange-700"],
        payment_pending: ["Pago informado", "bg-orange-100 text-orange-700"],
        overdue: ["Vencido", "bg-red-100 text-red-700"],
        active: ["Activo", "bg-blue-100 text-blue-700"],
    }[status] || ["Activo", "bg-blue-100 text-blue-700"]

    return (
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${config[1]}`}>
            {config[0]}
        </span>
    )
}

export default MyCredit
