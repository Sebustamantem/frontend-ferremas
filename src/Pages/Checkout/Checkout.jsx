import { useState } from "react"
import { useCart } from "../../context/CartContext"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { ShoppingCart, Trash2, CreditCard, ArrowLeft } from "lucide-react"
import api from "../../api/axios"

const Checkout = () => {
    const { cart, removeFromCart, total } = useCart()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [payLoading, setPayLoading] = useState(false)
    const [address, setAddress] = useState({
        region: "", city: "", street: "", number: "", zip: "", phone: ""
    })

    const isAddressComplete = address.region && address.city && address.street && address.phone

    if (!user) {
        navigate("/login")
        return null
    }

    const handlePay = async () => {
        if (!isAddressComplete) {
            alert("Por favor completa todos los campos de dirección")
            return
        }
        setPayLoading(true)
        try {
            const res = await api.post("/payment/create", { address })
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
            console.error("Error pago:", err)
            alert("Error al procesar el pago. Intenta nuevamente.")
            setPayLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-200 rounded-xl transition">
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
                        <p className="text-gray-400 text-sm mt-1">Revisa tu pedido antes de pagar</p>
                    </div>
                </div>

                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <ShoppingCart size={48} className="text-gray-200" />
                        <p className="text-gray-500 font-medium">Tu carrito está vacío</p>
                        <button onClick={() => navigate("/productos")}
                            className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition">
                            Ver Productos
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Izquierda */}
                        <div className="lg:col-span-2 flex flex-col gap-4">

                            {/* Productos */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100">
                                    <h2 className="font-bold text-gray-800">Productos ({cart.length})</h2>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name}
                                                    className="w-16 h-16 object-contain bg-gray-50 rounded-xl border border-gray-200 p-1" />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs">
                                                    Sin img
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">Cantidad: {item.quantity}</p>
                                                <p className="text-sm font-bold text-orange-500 mt-1">
                                                    ${Number(item.price * item.quantity).toLocaleString("es-CL")}
                                                </p>
                                            </div>
                                            <button onClick={() => removeFromCart(item.product_id || item.id)}
                                                className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Datos y dirección */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="font-bold text-gray-800 mb-4">Datos del Cliente</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Nombre</p>
                                        <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Email</p>
                                        <p className="text-sm font-semibold text-gray-800">{user.email}</p>
                                    </div>
                                </div>

                                <h2 className="font-bold text-gray-800 mb-4">Dirección de Envío</h2>
                                <div className="flex flex-col gap-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-500 font-medium">Región</label>
                                            <select value={address.region}
                                                onChange={(e) => setAddress({ ...address, region: e.target.value })}
                                                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50">
                                                <option value="">Selecciona región</option>
                                                <option>Región Metropolitana</option>
                                                <option>Valparaíso</option>
                                                <option>Biobío</option>
                                                <option>La Araucanía</option>
                                                <option>Los Lagos</option>
                                                <option>Maule</option>
                                                <option>O'Higgins</option>
                                                <option>Coquimbo</option>
                                                <option>Atacama</option>
                                                <option>Antofagasta</option>
                                                <option>Tarapacá</option>
                                                <option>Arica y Parinacota</option>
                                                <option>Los Ríos</option>
                                                <option>Aysén</option>
                                                <option>Magallanes</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-500 font-medium">Ciudad</label>
                                            <input type="text" placeholder="Ej: Santiago"
                                                value={address.city}
                                                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-500 font-medium">Dirección</label>
                                        <input type="text" placeholder="Ej: Av. Providencia 1234"
                                            value={address.street}
                                            onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50" />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-500 font-medium">Número / Depto</label>
                                            <input type="text" placeholder="Ej: Depto 301"
                                                value={address.number}
                                                onChange={(e) => setAddress({ ...address, number: e.target.value })}
                                                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-500 font-medium">Código Postal</label>
                                            <input type="text" placeholder="Ej: 7500000"
                                                value={address.zip}
                                                onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                                                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-500 font-medium">Teléfono de contacto</label>
                                        <input type="tel" placeholder="Ej: +56 9 1234 5678"
                                            value={address.phone}
                                            onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                                            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Resumen */}
                        <div className="flex flex-col gap-4">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-44">
                                <h2 className="font-bold text-gray-800 mb-4">Resumen del Pedido</h2>

                                <div className="flex flex-col gap-3 mb-4">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span className="text-gray-500 line-clamp-1 flex-1">{item.name}</span>
                                            <span className="font-medium text-gray-800 ml-2">
                                                ${Number(item.price * item.quantity).toLocaleString("es-CL")}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-gray-100 pt-4 mb-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="font-medium">${total.toLocaleString("es-CL")}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-500">Despacho</span>
                                        <span className="font-medium text-green-500">
                                            {total >= 50000 ? "Gratis" : "$4.990"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-gray-100">
                                        <span>Total</span>
                                        <span className="text-orange-500">
                                            ${(total >= 50000 ? total : total + 4990).toLocaleString("es-CL")}
                                        </span>
                                    </div>
                                </div>

                                {total < 50000 && (
                                    <div className="bg-orange-50 text-orange-600 text-xs p-3 rounded-xl mb-4 text-center">
                                        ¡Agrega ${(50000 - total).toLocaleString("es-CL")} más para despacho gratis!
                                    </div>
                                )}

                                <button
                                    onClick={handlePay}
                                    disabled={!isAddressComplete || payLoading}
                                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-xl font-bold text-lg transition shadow-md flex items-center justify-center gap-2"
                                >
                                    <CreditCard size={20} />
                                    {payLoading ? "Procesando..." : "Pagar con WebPay"}
                                </button>

                                {!isAddressComplete && (
                                    <p className="text-xs text-red-400 text-center mt-2">
                                        Completa la dirección para continuar
                                    </p>
                                )}

                                <p className="text-xs text-gray-400 text-center mt-3">
                                    Pago 100% seguro con Mercado Pago
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Checkout