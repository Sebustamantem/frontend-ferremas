import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { CheckCircle, Coins, ShoppingBag } from "lucide-react"
import api from "../../api/axios"

const Success = () => {
    const [searchParams] = useSearchParams()
    const [order, setOrder] = useState(null)
    const [survey, setSurvey] = useState({ rating: 5, comment: "" })
    const [surveySent, setSurveySent] = useState(false)
    const navigate = useNavigate()
    const orderId = searchParams.get("order_id")
    const method = searchParams.get("method")
    const isTransfer = method === "transferencia"
    const receiptCode = order ? `FERREMAS-${String(order.id).padStart(6, "0")}` : ""
    const receiptPayload = order
        ? `Ferremas|Pedido:${order.id}|Codigo:${receiptCode}|Total:${Number(order.total || 0)}|Estado:${order.status}`
        : ""

    useEffect(() => {
        if (orderId) {
            api.get(`/orders/${orderId}`)
                .then(res => setOrder(res.data))
                .catch(err => console.error(err))
        }
    }, [orderId])

    const submitSurvey = async () => {
        try {
            await api.post("/surveys", { order_id: orderId, ...survey })
            setSurveySent(true)
        } catch (err) {
            alert(err.response?.data?.message || "No se pudo enviar la encuesta")
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
                <div className="flex justify-center mb-6">
                    <CheckCircle size={64} className="text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    {isTransfer ? "Pedido creado" : "Pago exitoso"}
                </h1>
                <p className="text-gray-400 text-sm mb-6">
                    {isTransfer
                        ? "Tu transferencia quedo pendiente de confirmacion por contador."
                        : "Tu pedido ha sido confirmado y esta siendo procesado."}
                </p>

                {order && (
                    <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left">
                        <p className="text-xs text-gray-400 mb-2">Resumen del pedido #{order.id}</p>
                        {order.items?.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm py-1">
                                <span className="text-gray-600">{item.name} x{item.quantity}</span>
                                <span className="font-medium">${Number(item.price * item.quantity).toLocaleString("es-CL")}</span>
                            </div>
                        ))}
                        {order.service_requests?.map((service) => (
                            <div key={`service-${service.id}`} className="border-t border-gray-200 mt-2 pt-2 text-sm">
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">{service.title || "Asesoria profesional"}</span>
                                    <span className="font-medium">${Number(service.amount || 5000).toLocaleString("es-CL")}</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Contacto: {service.professional_name} · {service.professional_email}
                                    {service.professional_phone ? ` · ${service.professional_phone}` : ""}
                                </p>
                            </div>
                        ))}
                        <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold">
                            <span>Total</span>
                            <span className="text-orange-500">${Number(order.total).toLocaleString("es-CL")}</span>
                        </div>
                        {Number(order.points_earned || 0) > 0 && (
                            <div className="mt-3 rounded-xl bg-orange-50 border border-orange-100 px-3 py-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Coins size={18} className="text-orange-500" />
                                    <span className="text-sm font-semibold text-gray-800">Puntos ganados</span>
                                </div>
                                <span className="text-sm font-bold text-orange-600">
                                    +{Number(order.points_earned).toLocaleString("es-CL")}
                                </span>
                            </div>
                        )}
                        {Number(order.points_used || 0) > 0 && (
                            <div className="mt-2 flex justify-between text-xs text-blue-600">
                                <span>Puntos usados en esta compra</span>
                                <span>-{Number(order.points_used).toLocaleString("es-CL")}</span>
                            </div>
                        )}

                        <div className="mt-4 rounded-2xl border border-orange-100 bg-white p-4 text-center">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Comprobante digital</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{receiptCode}</p>
                            <div className="mt-3 flex justify-center">
                                <QrCode value={receiptPayload} />
                            </div>
                            <p className="mt-3 text-xs text-gray-500">
                                Presenta este codigo para retiro en tienda o seguimiento del pedido.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    {!surveySent ? (
                        <div className="bg-gray-50 rounded-2xl p-4 text-left">
                            <p className="text-sm font-bold text-gray-800 mb-3">Evalua tu experiencia</p>
                            <select
                                value={survey.rating}
                                onChange={(e) => setSurvey({ ...survey, rating: Number(e.target.value) })}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3"
                            >
                                {[5, 4, 3, 2, 1].map((score) => (
                                    <option key={score} value={score}>{score} estrellas</option>
                                ))}
                            </select>
                            <textarea
                                value={survey.comment}
                                onChange={(e) => setSurvey({ ...survey, comment: e.target.value })}
                                placeholder="Comentario opcional"
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3"
                            />
                            <button onClick={submitSurvey} className="w-full bg-gray-900 text-white rounded-xl py-2 text-sm font-semibold">
                                Enviar encuesta
                            </button>
                        </div>
                    ) : (
                        <div className="bg-green-50 text-green-700 rounded-xl px-4 py-3 text-sm">
                            Gracias por responder la encuesta.
                        </div>
                    )}

                    <button
                        onClick={() => navigate("/productos")}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition"
                    >
                        Seguir comprando
                    </button>
                    <button
                        onClick={() => navigate("/mis-pedidos")}
                        className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                    >
                        <ShoppingBag size={18} />
                        Ver mis pedidos
                    </button>
                </div>
            </div>
        </div>
    )
}

const QrCode = ({ value }) => {
    const [sourceIndex, setSourceIndex] = useState(0)
    const sources = [
        `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=12&data=${encodeURIComponent(value)}`,
        `https://quickchart.io/qr?size=180&margin=2&text=${encodeURIComponent(value)}`,
    ]

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-2">
            {sourceIndex < sources.length ? (
                <img
                    src={sources[sourceIndex]}
                    alt="QR del comprobante"
                    className="h-36 w-36"
                    onError={() => setSourceIndex((current) => current + 1)}
                />
            ) : (
                <div className="h-36 w-36 flex items-center justify-center text-center text-xs text-gray-500">
                    QR no disponible. Usa el codigo del comprobante.
                </div>
            )}
        </div>
    )
}

export default Success
