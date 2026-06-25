import { useState, useEffect } from "react"
import { useCart } from "../../context/CartContext"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Briefcase, Building2, Coins, CreditCard, Home, Landmark, MapPin, PackageCheck, Phone, ShoppingCart, Trash2, Truck, UserRound } from "lucide-react"
import api from "../../api/axios"
import { regions } from "../../data/chileRegions"

const calculateEarnedPoints = (amount) => {
    const purchaseAmount = Number(amount || 0)
    if (purchaseAmount <= 0) return 0
    if (purchaseAmount >= 50000) return 250
    if (purchaseAmount >= 30000) return 200
    if (purchaseAmount >= 10000) return 150
    return 100
}

const Checkout = () => {
    const { cart, removeFromCart, removeServiceFromCart, total, clearCart } = useCart()
    const { user, login } = useAuth()
    const navigate = useNavigate()
    const [payLoading, setPayLoading] = useState(false)
    const [payMethod, setPayMethod] = useState("transbank")
    const [installments, setInstallments] = useState(3)
    const [myCredit, setMyCredit] = useState(null)
    const [myPoints, setMyPoints] = useState(0)
    const [pointsToUse, setPointsToUse] = useState(0)
    const [deliveryMethod, setDeliveryMethod] = useState("delivery")
    const [saveAddress, setSaveAddress] = useState(false)
    const [addressTouched, setAddressTouched] = useState(false)
    const [checkoutNotice, setCheckoutNotice] = useState(null)
    const [address, setAddress] = useState({
        receiver: "",
        region: "",
        city: "",
        street: "",
        number: "",
        apartment: "",
        zip: "",
        reference: "",
        phone: "",
    })

    const normalizePhone = (value) => {
        const digits = String(value || "").replace(/\D/g, "")
        if (!digits) return ""
        if (digits.startsWith("569")) return `+${digits}`
        if (digits.startsWith("56")) return `+${digits}`
        if (digits.startsWith("9")) return `+56${digits}`
        return `+569${digits}`
    }

    const updateAddress = (field, value) => {
        setAddressTouched(true)
        setAddress((prev) => ({ ...prev, [field]: value }))
    }

    const cleanAddress = {
        receiver: address.receiver.trim() || `${user?.name || ""} ${user?.lastname || ""}`.trim(),
        region: address.region,
        city: address.city,
        street: address.street.trim(),
        number: address.number.trim(),
        apartment: address.apartment.trim(),
        zip: address.zip.trim(),
        reference: address.reference.trim(),
        phone: normalizePhone(address.phone),
    }
    const phoneDigits = cleanAddress.phone.replace(/\D/g, "")
    const isValidPhone = phoneDigits.length === 11 && phoneDigits.startsWith("569")
    const selectedRegion = regions.find((region) => region.name === address.region)
    const isPro = ["maestro", "pyme"].includes(user?.user_type)
    const canUseFerreCredit = isPro || myCredit?.is_active
    const professionalLabel = user?.user_type?.includes("maestro") ? "maestros" : "PYMEs"
    const isDeliveryAddressComplete = Boolean(
        cleanAddress.receiver &&
        cleanAddress.region &&
        cleanAddress.city &&
        cleanAddress.street &&
        cleanAddress.number &&
        isValidPhone
    )
    const canContinueCheckout = deliveryMethod === "pickup"
        ? Boolean(cleanAddress.receiver && isValidPhone)
        : isDeliveryAddressComplete
    const showAddressErrors = addressTouched || payLoading
    const addressSummary = deliveryMethod === "pickup"
        ? "Retiro en tienda"
        : [cleanAddress.street && `${cleanAddress.street} ${cleanAddress.number}`, cleanAddress.apartment, cleanAddress.city, cleanAddress.region]
            .filter(Boolean)
            .join(", ")
    const productItems = cart.filter((item) => item.item_type !== "service")
    const serviceItems = cart.filter((item) => item.item_type === "service")
    const productTotal = productItems
        .reduce((acc, item) => acc + Number(item.price) * item.quantity, 0)
    const serviceTotal = serviceItems
        .reduce((acc, item) => acc + Number(item.price) * item.quantity, 0)
    const shipping = deliveryMethod === "delivery" && productTotal > 0 && productTotal < 50000 ? 4990 : 0
    const earnedPoints = calculateEarnedPoints(productTotal)

    // Calcular total con descuento primera compra
    const discountedTotal = canUseFerreCredit && !user?.first_purchase_used
        ? Math.round(total * 0.7)
        : total
    const maxPointsToUse = Math.min(myPoints, discountedTotal + shipping)
    const appliedPoints = Math.min(Number(pointsToUse || 0), maxPointsToUse)
    const finalTotal = Math.max(discountedTotal + shipping - appliedPoints, 0)
    const available = myCredit
        ? Math.max(Number(myCredit.credit_limit) - Number(myCredit.balance_used), 0)
        : 0
    const hasInsufficientFerreCredit = payMethod === "ferrecredito" && myCredit?.is_active && available < finalTotal
    const hasInactiveFerreCredit = payMethod === "ferrecredito" && !myCredit?.is_active

    useEffect(() => {
        api.get("/points/my")
            .then(res => setMyPoints(Number(res.data.balance || 0)))
            .catch(() => setMyPoints(0))
        api.get("/ferre-credit/my")
            .then(res => setMyCredit(res.data.credit || res.data))
            .catch(err => console.error(err))
    }, [])

    useEffect(() => {
        if (!user) return
        let userAddress = null
        if (user.address) {
            try {
                userAddress = typeof user.address === "object" ? user.address : JSON.parse(user.address)
            } catch {
                userAddress = null
            }
        }
        const receiver = `${user.name || ""} ${user.lastname || ""}`.trim()
        if (userAddress) {
            setAddress((prev) => ({
                ...prev,
                ...userAddress,
                receiver: userAddress.receiver || receiver,
                apartment: userAddress.apartment || userAddress.department || "",
                reference: userAddress.reference || "",
                phone: normalizePhone(userAddress.phone || user.phone || prev.phone),
            }))
            return
        }
        api.get("/users/me")
            .then((res) => {
                const profile = res.data.user || res.data
                const savedAddress = profile.address && typeof profile.address === "object"
                    ? profile.address
                    : profile.address ? JSON.parse(profile.address) : null
                if (savedAddress) {
                    setAddress((prev) => ({
                        ...prev,
                        ...savedAddress,
                        receiver: savedAddress.receiver || receiver,
                        apartment: savedAddress.apartment || savedAddress.department || "",
                        reference: savedAddress.reference || "",
                        phone: normalizePhone(savedAddress.phone || profile.phone || prev.phone),
                    }))
                } else {
                    setAddress((prev) => ({
                        ...prev,
                        receiver,
                        phone: normalizePhone(profile.phone || prev.phone),
                    }))
                    setSaveAddress(true)
                }
            })
            .catch(() => { })
    }, [user])

    if (!user) {
        navigate("/login")
        return null
    }

    const handlePay = async () => {
        setAddressTouched(true)
        setCheckoutNotice(null)
        if (!canContinueCheckout) {
            setCheckoutNotice({
                type: "error",
                message: deliveryMethod === "pickup"
                    ? "Completa nombre y telefono de contacto para retirar en tienda."
                    : "Completa direccion, comuna, region y telefono para continuar.",
            })
            return
        }
        if (hasInactiveFerreCredit) {
            setCheckoutNotice({ type: "error", message: "Tu FerreCredito no esta activo para usarlo en esta compra." })
            return
        }
        if (hasInsufficientFerreCredit) {
            setCheckoutNotice({
                type: "error",
                message: `No tienes cupo suficiente en FerreCredito. Disponible: $${available.toLocaleString("es-CL")}.`,
            })
            return
        }
        setPayLoading(true)

        try {
            if (saveAddress) {
                const res = await api.put("/users/me", {
                    name: user.name,
                    lastname: user.lastname || "",
                    email: user.email,
                    phone: user.phone || cleanAddress.phone,
                    address: cleanAddress,
                    business_name: user.business_name,
                    profession: user.profession,
                })
                login(res.data.user || res.data, localStorage.getItem("token"))
            }

            if (payMethod === "transbank") {
                const res = await api.post("/payment/create", { address: cleanAddress, points_to_use: appliedPoints, delivery_method: deliveryMethod })
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
                const res = await api.post("/payment/transfer", { address: cleanAddress, points_to_use: appliedPoints, delivery_method: deliveryMethod })
                await clearCart()
                navigate(`/checkout/success?order_id=${res.data.order_id}&method=transferencia`)
            } else {
                const res = await api.post("/ferre-credit/pay", { installments, address: cleanAddress, points_to_use: appliedPoints, delivery_method: deliveryMethod })
                await clearCart()
                navigate(`/checkout/success?order_id=${res.data.order_id}&method=ferrecredito`)
            }
        } catch (err) {
            setCheckoutNotice({ type: "error", message: err.response?.data?.message || "Error al procesar el pago." })
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

                {checkoutNotice && (
                    <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${checkoutNotice.type === "success"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-700"
                        }`}>
                        <div className="flex items-center justify-between gap-4">
                            <span>{checkoutNotice.message}</span>
                            <button type="button" onClick={() => setCheckoutNotice(null)} className="font-bold">Cerrar</button>
                        </div>
                    </div>
                )}

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
                            {canUseFerreCredit && !user?.first_purchase_used && (
                                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                                    <span className="text-2xl">🎉</span>
                                    <div>
                                        <p className="text-sm font-bold text-green-700">¡30% de descuento en tu primera compra!</p>
                                        <p className="text-xs text-green-600">Beneficio exclusivo para {professionalLabel}</p>
                                    </div>
                                </div>
                            )}

                            {/* Productos */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100">
                                    <h2 className="font-bold text-gray-800">Productos y asesorias ({cart.length})</h2>
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
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                                                    {item.item_type === "service" && (
                                                        <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                                                            Asesoria
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {item.item_type === "service"
                                                        ? "Contacto liberado despues del pago"
                                                        : `Cantidad: ${item.quantity}`}
                                                </p>
                                                {item.item_type === "service" && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Ferremas cobra solo la confirmacion. El servicio final se acuerda directo con el maestro/PYME.
                                                    </p>
                                                )}
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

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="font-bold text-gray-800 mb-4">Entrega</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${deliveryMethod === "delivery" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}>
                                        <input type="radio" name="deliveryMethod" checked={deliveryMethod === "delivery"} onChange={() => setDeliveryMethod("delivery")} className="mt-1 accent-orange-500" />
                                        <Truck size={22} className="text-orange-500 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-gray-800 text-sm">Despacho a domicilio</p>
                                            <p className="text-xs text-gray-400 mt-1">Gratis sobre $50.000 en productos.</p>
                                        </div>
                                    </label>
                                    <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${deliveryMethod === "pickup" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}>
                                        <input type="radio" name="deliveryMethod" checked={deliveryMethod === "pickup"} onChange={() => setDeliveryMethod("pickup")} className="mt-1 accent-gray-900" />
                                        <PackageCheck size={22} className="text-gray-700 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-gray-800 text-sm">Retiro en tienda</p>
                                            <p className="text-xs text-gray-400 mt-1">Sin costo de despacho.</p>
                                        </div>
                                    </label>
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
                                    {canUseFerreCredit && (
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
                                                    {available < finalTotal && (
                                                        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                                                            No tienes cupo suficiente para esta compra. Disponible: ${available.toLocaleString("es-CL")}
                                                        </div>
                                                    )}
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

                                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h2 className="font-bold text-gray-800">Direccion de entrega</h2>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {deliveryMethod === "pickup"
                                                ? "Usaremos estos datos para identificar tu retiro."
                                                : "Completa los datos para despacho y contacto."}
                                        </p>
                                    </div>
                                    {addressSummary && (
                                        <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500 sm:max-w-xs">
                                            <span className="font-semibold text-gray-700">Resumen: </span>{addressSummary}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <CheckoutField
                                            icon={UserRound}
                                            label="Persona que recibe"
                                            placeholder="Ej: Sebastian Bustamante"
                                            value={address.receiver}
                                            onChange={(value) => updateAddress("receiver", value)}
                                            error={showAddressErrors && !cleanAddress.receiver ? "Ingresa un nombre de contacto." : ""}
                                        />
                                        <CheckoutField
                                            icon={Phone}
                                            label="Telefono de contacto"
                                            placeholder="+569 1234 5678"
                                            value={address.phone}
                                            onChange={(value) => updateAddress("phone", normalizePhone(value))}
                                            error={showAddressErrors && !isValidPhone ? "Usa un celular chileno valido. Ej: +56912345678." : ""}
                                        />
                                    </div>

                                    {deliveryMethod === "delivery" && (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs text-gray-500 font-medium">Region</label>
                                                    <select value={address.region}
                                                        onChange={(e) => {
                                                            setAddressTouched(true)
                                                            setAddress({ ...address, region: e.target.value, city: "" })
                                                        }}
                                                        className={`border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 ${showAddressErrors && !address.region ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
                                                        <option value="">Selecciona region</option>
                                                        {regions.map((region) => (
                                                            <option key={region.name} value={region.name}>{region.name}</option>
                                                        ))}
                                                    </select>
                                                    {showAddressErrors && !address.region && <p className="text-xs text-red-500">Selecciona una region.</p>}
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs text-gray-500 font-medium">Comuna</label>
                                                    <select value={address.city}
                                                        onChange={(e) => updateAddress("city", e.target.value)}
                                                        disabled={!selectedRegion}
                                                        className={`border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 ${showAddressErrors && !address.city ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
                                                        <option value="">Selecciona comuna</option>
                                                        {selectedRegion?.communes.map((commune) => (
                                                            <option key={commune} value={commune}>{commune}</option>
                                                        ))}
                                                    </select>
                                                    {showAddressErrors && !address.city && <p className="text-xs text-red-500">Selecciona una comuna.</p>}
                                                </div>
                                            </div>

                                            <CheckoutField
                                                icon={Home}
                                                label="Calle o avenida"
                                                placeholder="Ej: Av. Providencia"
                                                value={address.street}
                                                onChange={(value) => updateAddress("street", value)}
                                                error={showAddressErrors && !cleanAddress.street ? "Ingresa la calle o avenida." : ""}
                                            />

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <CheckoutField
                                                    icon={MapPin}
                                                    label="Numero"
                                                    placeholder="Ej: 1234"
                                                    value={address.number}
                                                    onChange={(value) => updateAddress("number", value)}
                                                    error={showAddressErrors && !cleanAddress.number ? "Ingresa el numero." : ""}
                                                />
                                                <CheckoutField
                                                    icon={Building2}
                                                    label="Depto, casa o local"
                                                    placeholder="Ej: Depto 301"
                                                    value={address.apartment}
                                                    onChange={(value) => updateAddress("apartment", value)}
                                                    optional
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <CheckoutField
                                                    icon={MapPin}
                                                    label="Codigo postal"
                                                    placeholder="Ej: 7500000"
                                                    value={address.zip}
                                                    onChange={(value) => updateAddress("zip", value.replace(/\D/g, "").slice(0, 7))}
                                                    optional
                                                />
                                                <CheckoutField
                                                    icon={Truck}
                                                    label="Referencia para el repartidor"
                                                    placeholder="Ej: Porton negro, llamar al llegar"
                                                    value={address.reference}
                                                    onChange={(value) => updateAddress("reference", value)}
                                                    optional
                                                />
                                            </div>
                                        </>
                                    )}

                                    <label className="flex items-start gap-3 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={saveAddress}
                                            onChange={(e) => setSaveAddress(e.target.checked)}
                                            className="mt-1 accent-orange-500"
                                        />
                                        <span>
                                            <span className="block text-sm font-semibold text-gray-800">Guardar esta direccion para futuras compras</span>
                                            <span className="block text-xs text-gray-500 mt-0.5">La proxima vez se completara automaticamente en el checkout.</span>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Resumen */}
                        <div className="flex flex-col gap-4">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-44">
                                <h2 className="font-bold text-gray-800 mb-4">Resumen del Pedido</h2>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                        <p className="text-xs text-gray-400">Productos</p>
                                        <p className="text-base font-bold text-gray-800">${productTotal.toLocaleString("es-CL")}</p>
                                    </div>
                                    <div className="rounded-xl border border-orange-100 bg-orange-50 p-3">
                                        <p className="text-xs text-orange-500">Asesorias</p>
                                        <p className="text-base font-bold text-orange-600">${serviceTotal.toLocaleString("es-CL")}</p>
                                    </div>
                                </div>

                                {serviceItems.length > 0 && (
                                    <div className="rounded-xl border border-orange-100 bg-orange-50 p-3 mb-4">
                                        <div className="flex items-start gap-2">
                                            <Briefcase size={18} className="text-orange-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">Contacto maestro/PYME</p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Al confirmar el pago, el voucher mostrara los datos del profesional y se enviara el correo mixto de contacto.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t border-gray-100 pt-4 mb-4 flex flex-col gap-2.5">
                                    <SummaryRow label="Subtotal productos" value={`$${productTotal.toLocaleString("es-CL")}`} />

                                    {serviceTotal > 0 && (
                                        <SummaryRow
                                            label={`Asesorias (${serviceItems.length})`}
                                            value={`$${serviceTotal.toLocaleString("es-CL")}`}
                                            tone="orange"
                                        />
                                    )}

                                    {canUseFerreCredit && !user?.first_purchase_used && (
                                        <SummaryRow
                                            label="Descuento primera compra"
                                            value={`-$${(total - discountedTotal).toLocaleString("es-CL")}`}
                                            tone="green"
                                        />
                                    )}

                                    {myPoints > 0 && (
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 my-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-blue-700">Puntos Ferremas</p>
                                                    <p className="text-xs text-blue-500">
                                                        Disponibles: {myPoints.toLocaleString("es-CL")} puntos
                                                    </p>
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
                                        <SummaryRow
                                            label="Descuento por puntos"
                                            value={`-$${appliedPoints.toLocaleString("es-CL")}`}
                                            tone="blue"
                                        />
                                    )}

                                    <SummaryRow
                                        label="Despacho"
                                        value={deliveryMethod === "pickup" ? "Retiro en tienda" : productTotal === 0 ? "No aplica" : shipping === 0 ? "Gratis" : `$${shipping.toLocaleString("es-CL")}`}
                                        tone={shipping === 0 ? "green" : "default"}
                                    />

                                    {earnedPoints > 0 && (
                                        <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <Coins size={18} className="text-amber-600" />
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">Puntos que ganaras</p>
                                                    <p className="text-xs text-amber-700">Calculados sobre productos vendidos</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-amber-700">+{earnedPoints}</span>
                                        </div>
                                    )}

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

                                    {hasInactiveFerreCredit && (
                                        <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 mt-2 text-xs">
                                            Tu FerreCredito esta inactivo. Solicita aprobacion o elige otro metodo de pago.
                                        </div>
                                    )}
                                </div>

                                {deliveryMethod === "delivery" && productTotal > 0 && productTotal < 50000 && (
                                    <div className="bg-orange-50 text-orange-600 text-xs p-3 rounded-xl mb-4 text-center">
                                        Agrega ${(50000 - productTotal).toLocaleString("es-CL")} mas en productos para despacho gratis.
                                    </div>
                                )}

                                <button
                                    onClick={handlePay}
                                    disabled={!canContinueCheckout || hasInactiveFerreCredit || hasInsufficientFerreCredit || payLoading}
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

                                {!canContinueCheckout && (
                                    <p className="text-xs text-red-400 text-center mt-2">
                                        {deliveryMethod === "pickup" ? "Completa nombre y telefono de contacto" : "Completa la direccion para continuar"}
                                    </p>
                                )}

                                {hasInsufficientFerreCredit && (
                                    <p className="text-xs text-red-500 text-center mt-2">
                                        No tienes cupo suficiente en FerreCredito para esta compra.
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

const SummaryRow = ({ label, value, tone = "default" }) => {
    const toneClass = {
        default: "text-gray-800",
        green: "text-green-600",
        blue: "text-blue-600",
        orange: "text-orange-600",
    }[tone]

    return (
        <div className="flex justify-between gap-4 text-sm">
            <span className="text-gray-500">{label}</span>
            <span className={`font-medium text-right ${toneClass}`}>{value}</span>
        </div>
    )
}

const CheckoutField = ({ icon: Icon, label, value, onChange, placeholder, error = "", optional = false }) => (
    <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
            <label className="text-xs text-gray-500 font-medium">{label}</label>
            {optional && <span className="text-[11px] text-gray-400">Opcional</span>}
        </div>
        <div className={`flex items-center gap-2 rounded-xl border bg-gray-50 px-3 py-2.5 focus-within:ring-2 focus-within:ring-orange-500 ${error ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
            {Icon && <Icon size={18} className={error ? "text-red-400" : "text-gray-400"} />}
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
)

export default Checkout
