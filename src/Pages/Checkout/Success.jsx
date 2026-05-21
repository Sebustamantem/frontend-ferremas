import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { CheckCircle, ShoppingBag } from "lucide-react"
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
                        <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold">
                            <span>Total</span>
                            <span className="text-orange-500">${Number(order.total).toLocaleString("es-CL")}</span>
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

export default Success
