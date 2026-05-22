import { useState, useEffect } from "react"
import { useCart } from "../../context/CartContext"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { ShoppingCart, Trash2, CreditCard, ArrowLeft, Landmark } from "lucide-react"
import api from "../../api/axios"
import { regions } from "../../data/chileRegions"

const Checkout = () => {
    const { cart, removeFromCart, removeServiceFromCart, total, clearCart } = useCart()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [payLoading, setPayLoading] = useState(false)
    const [payMethod, setPayMethod] = useState("transbank")
    const [installments, setInstallments] = useState(3)
    const [myCredit, setMyCredit] = useState(null)
    const [myPoints, setMyPoints] = useState(0)
    const [pointsToUse, setPointsToUse] = useState(0)
    const [address, setAddress] = useState({
        region: "", city: "", street: "", number: "", zip: "", phone: ""
    })

    const normalizePhone = (value) => {
        const digits = value.replace(/\D/g, "")
        if (!digits) return ""
        if (digits.startsWith("569")) return `+${digits}`
        if (digits.startsWith("56")) return `+${digits}`
        if (digits.startsWith("9")) return `+56${digits}`
        return `+569${digits}`
    }

    const selectedRegion = regions.find((region) => region.name === address.region)
    const isPro = ["maestro", "pyme"].includes(user?.user_type)
    const isAddressComplete = address.region && address.city && address.street && address.phone
    const shipping = total >= 50000 ? 0 : 4990

    // Calcular total con descuento primera compra
    const discountedTotal = isPro && !user?.first_purchase_used
        ? Math.round(total * 0.7)
        : total
    const maxPointsToUse = Math.min(myPoints, discountedTotal + shipping)
    const appliedPoints = Math.min(Number(pointsToUse || 0), maxPointsToUse)
    const finalTotal = Math.max(discountedTotal + shipping - appliedPoints, 0)
    const available = myCredit
        ? Number(myCredit.credit_limit) - Number(myCredit.balance_used)
        : 0

    useEffect(() => {
        api.get("/points/my")
            .then(res => setMyPoints(Number(res.data.balance || 0)))
            .catch(() => setMyPoints(0))
        if (isPro) {
            api.get("/ferre-credit/my")
                .then(res => setMyCredit(res.data))
                .catch(err => console.error(err))
        }
    }, [isPro])

    useEffect(() => {
        if (!user) return
        let userAddress = null
        if (user.address) {
            userAddress = typeof user.address === "object" ? user.address : JSON.parse(user.address)
        }
        if (userAddress) {
            setAddress((prev) => ({
                ...prev,
                ...userAddress,
                phone: normalizePhone(userAddress.phone || prev.phone),
            }))
            return
        }
        api.get("/users/me")
            .then((res) => {
                if (res.data.address) {
                    setAddress((prev) => ({
                        ...prev,
                        ...res.data.address,
                        phone: normalizePhone(res.data.address.phone || prev.phone),
                    }))
                }
            })
            .catch(() => { })
    }, [user])

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
            if (payMethod === "transbank") {
                const res = await api.post("/payment/create", { address, points_to_use: appliedPoints })
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
            } else if (payMethod === "transferencia") {
                const res = await api.post("/payment/transfer", { address, points_to_use: appliedPoints })
                await clearCart()
                navigate(`/checkout/success?order_id=${res.data.order_id}&method=transferencia`)
            } else {
                const res = await api.post("/ferre-credit/pay", { installments, address, points_to_use: appliedPoints })
                await clearCart()
                navigate(`/checkout/success?order_id=${res.data.order_id}&method=ferrecredito`)
            }
        } catch (err) {
            alert(err.response?.data?.message || "Error al procesar el pago.")
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

                            {/* Descuento primera compra */}
                            {isPro && !user?.first_purchase_used && (
                                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                                    <span className="text-2xl">🎉</span>
                                    <div>
                                        <p className="text-sm font-bold text-green-700">¡30% de descuento en tu primera compra!</p>
                                        <p className="text-xs text-green-600">Beneficio exclusivo para {user.user_type === "maestro" ? "maestros" : "PYMEs"}</p>
                                    </div>
                                </div>
                            )}

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
                                            <button onClick={() => item.item_type === "service" ? removeServiceFromCart(item.service_id) : removeFromCart(item.product_id || item.id)}
                                                className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Método de pago */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="font-bold text-gray-800 mb-4">Método de Pago</h2>
                                <div className="flex flex-col gap-3">

                                    {/* Transbank */}
                                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${payMethod === "transbank" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                                        }`}>
                                        <input type="radio" name="payMethod" value="transbank"
                                            checked={payMethod === "transbank"}
                                            onChange={() => setPayMethod("transbank")}
                                            className="accent-orange-500" />
                                        <CreditCard size={22} className="text-orange-500" />
                                        <div>
                                            <p className="font-semibold text-gray-800 text-sm">Transbank Webpay</p>
                                            <p className="text-xs text-gray-400">Pago con tarjeta de crédito o débito</p>
                                        </div>
                                    </label>

                                    {/* Transferencia bancaria */}
                                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${payMethod === "transferencia" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                                        }`}>
                                        <input type="radio" name="payMethod" value="transferencia"
                                            checked={payMethod === "transferencia"}
                                            onChange={() => setPayMethod("transferencia")}
                                            className="accent-blue-500" />
                                        <Landmark size={22} className="text-blue-600" />
                                        <div>
                                            <p className="font-semibold text-gray-800 text-sm">Transferencia bancaria</p>
                                            <p className="text-xs text-gray-400">El contador confirma el pago antes de enviar a bodega</p>
                                        </div>
                                    </label>

                                    {/* FerreCredito solo para maestros/PYMEs */}
                                    {isPro && (
                                        <label className={`flex flex-col gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${payMethod === "ferrecredito" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
                                            } ${!myCredit?.is_active ? "opacity-50 cursor-not-allowed" : ""}`}>
                                            <div className="flex items-center gap-4">
                                                <input type="radio" name="payMethod" value="ferrecredito"
                                                    checked={payMethod === "ferrecredito"}
                                                    onChange={() => setPayMethod("ferrecredito")}
                                                    disabled={!myCredit?.is_active}
                                                    className="accent-gray-900" />
                                                <Landmark size={22} className="text-gray-700" />
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-800 text-sm">FerreCredito</p>
                                                    <p className="text-xs text-gray-400">Compra a cuotas sin tarjeta bancaria</p>
                                                </div>
                                                {myCredit?.is_active ? (
                                                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
                                                        Disponible: ${available.toLocaleString("es-CL")}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs bg-red-100 text-red-500 px-2 py-1 rounded-full font-medium">
                                                        No activo
                                                    </span>
                                                )}
                                            </div>

                                            {/* Selector de cuotas */}
                                            {payMethod === "ferrecredito" && myCredit?.is_active && (
                                                <div className="flex flex-col gap-2 mt-2 pl-8">
                                                    <p className="text-xs font-medium text-gray-600">Número de cuotas:</p>
                                                    <div className="flex gap-2">
                                                        {[3, 6, 9, 12].map((n) => (
                                                            <button key={n} type="button"
                                                                onClick={() => setInstallments(n)}
                                                                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${installments === n
                                                                    ? "bg-gray-900 text-white"
                                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                                    }`}>
                                                                {n}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-gray-400">
                                                        ${Math.round(finalTotal / installments).toLocaleString("es-CL")} / mes por {installments} meses
                                                    </p>
                                                </div>
                                            )}
                                        </label>
                                    )}
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
                                                onChange={(e) => setAddress({ ...address, region: e.target.value, city: "" })}
                                                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50">
                                                <option value="">Selecciona región</option>
                                                {regions.map((region) => (
                                                    <option key={region.name} value={region.name}>{region.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-500 font-medium">Comuna</label>
                                            <select value={address.city}
                                                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                                disabled={!selectedRegion}
                                                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100">
                                                <option value="">Selecciona comuna</option>
                                                {selectedRegion?.communes.map((commune) => (
                                                    <option key={commune} value={commune}>{commune}</option>
                                                ))}
                                            </select>
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
                                        <input type="tel" placeholder="+569 1234 5678"
                                            value={address.phone}
                                            onChange={(e) => setAddress({ ...address, phone: normalizePhone(e.target.value) })}
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

                                <div className="border-t border-gray-100 pt-4 mb-4 flex flex-col gap-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="font-medium">${total.toLocaleString("es-CL")}</span>
                                    </div>

                                    {isPro && !user?.first_purchase_used && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-green-600 font-medium">Descuento 30%</span>
                                            <span className="text-green-600 font-medium">
                                                -${(total - discountedTotal).toLocaleString("es-CL")}
                                            </span>
                                        </div>
                                    )}

                                    {myPoints > 0 && (
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 my-2">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-blue-700">Puntos Ferremas</p>
                                                    <p className="text-xs text-blue-500">Disponibles: {myPoints.toLocaleString("es-CL")}</p>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={maxPointsToUse}
                                                    value={pointsToUse}
                                                    onChange={(e) => setPointsToUse(Math.min(Number(e.target.value || 0), maxPointsToUse))}
                                                    className="w-24 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {appliedPoints > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-blue-600 font-medium">Descuento puntos</span>
                                            <span className="text-blue-600 font-medium">
                                                -${appliedPoints.toLocaleString("es-CL")}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Despacho</span>
                                        <span className="font-medium text-green-500">
                                            {shipping === 0 ? "Gratis" : `$${shipping.toLocaleString("es-CL")}`}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-lg font-bold mt-2 pt-3 border-t border-gray-100">
                                        <span>Total</span>
                                        <span className="text-orange-500">
                                            ${finalTotal.toLocaleString("es-CL")}
                                        </span>
                                    </div>

                                    {payMethod === "ferrecredito" && myCredit?.is_active && (
                                        <div className="bg-gray-50 rounded-xl p-3 mt-2 text-center">
                                            <p className="text-xs text-gray-500">
                                                {installments} cuotas de{" "}
                                                <span className="font-bold text-gray-800">
                                                    ${Math.round(finalTotal / installments).toLocaleString("es-CL")}
                                                </span>
                                                /mes
                                            </p>
                                        </div>
                                    )}
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
                                    {payMethod === "transbank" ? <CreditCard size={20} /> : <Landmark size={20} />}
                                    {payLoading
                                        ? "Procesando..."
                                        : payMethod === "transbank"
                                            ? "Pagar con Transbank"
                                            : payMethod === "transferencia"
                                                ? "Crear pedido por transferencia"
                                                : "Pagar con FerreCredito"}
                                </button>

                                {!isAddressComplete && (
                                    <p className="text-xs text-red-400 text-center mt-2">
                                        Completa la dirección para continuar
                                    </p>
                                )}

                                <p className="text-xs text-gray-400 text-center mt-3">
                                    🔒 Pago 100% seguro
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
