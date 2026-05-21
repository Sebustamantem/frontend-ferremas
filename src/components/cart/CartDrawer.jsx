import { X, Trash2, ShoppingCart, Plus, Minus } from "lucide-react"
import { useEffect, useState } from "react"
import { useCart } from "../../context/CartContext"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"

const CartDrawer = ({ isOpen, onClose }) => {
    const { cart, removeFromCart, clearCart, updateQuantity, total, itemCount, reservationExpiresAt, fetchCart } = useCart()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [remainingSeconds, setRemainingSeconds] = useState(null)

    useEffect(() => {
        if (!reservationExpiresAt) {
            setRemainingSeconds(null)
            return
        }

        const updateRemaining = () => {
            const seconds = Math.max(Math.ceil((new Date(reservationExpiresAt).getTime() - Date.now()) / 1000), 0)
            setRemainingSeconds(seconds)
            if (seconds === 0) fetchCart()
        }

        updateRemaining()
        const interval = setInterval(updateRemaining, 1000)
        return () => clearInterval(interval)
    }, [reservationExpiresAt, fetchCart])

    const reservationTime = remainingSeconds !== null
        ? `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}`
        : "10:00"

    const handleCheckout = () => {
        onClose()
        navigate("/checkout")
    }

    const handleClearCart = async () => {
        if (confirm("¿Vaciar todo el carrito?")) {
            await clearCart()
        }
    }

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
            )}

            <div className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-2">
                        <ShoppingCart size={22} className="text-orange-500" />
                        <h2 className="text-lg font-bold text-gray-800">Mi Carrito</h2>
                        {itemCount > 0 && (
                            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {itemCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {cart.length > 0 && (
                            <button onClick={handleClearCart}
                                className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition">
                                Vaciar todo
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Items */}
                <div className="overflow-y-auto p-6 h-[calc(100vh-200px)]">
                    {!user ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <ShoppingCart size={48} className="text-gray-200" />
                            <p className="text-gray-500 font-medium">Inicia sesión para ver tu carrito</p>
                            <button onClick={() => { onClose(); navigate("/login") }}
                                className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition">
                                Iniciar Sesión
                            </button>
                        </div>
                    ) : cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <ShoppingCart size={48} className="text-gray-200" />
                            <p className="text-gray-500 font-medium">Tu carrito está vacío</p>
                            <button onClick={() => { onClose(); navigate("/productos") }}
                                className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition">
                                Ver Productos
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="bg-orange-50 border border-orange-200 text-orange-700 text-xs p-3 rounded-xl text-center">
                                Tu carrito esta reservado por <strong>{reservationTime}</strong>. Completa tu compra antes de que expire.
                            </div>

                            {cart.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name}
                                            className="w-14 h-14 object-contain bg-white rounded-xl border border-gray-200 p-1 shrink-0" />
                                    ) : (
                                        <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs shrink-0">
                                            Sin img
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 line-clamp-2">{item.name}</p>
                                        <p className="text-sm font-bold text-orange-500 mt-1">
                                            ${Number(item.price * item.quantity).toLocaleString("es-CL")}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => {
                                                    if (item.quantity === 1) removeFromCart(item.product_id)
                                                    else updateQuantity(item.product_id, item.quantity - 1)
                                                }}
                                                className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-red-100 hover:text-red-500 rounded-lg transition">
                                                <Minus size={12} />
                                            </button>
                                            <span className="text-sm font-bold text-gray-800 w-6 text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                                className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-orange-100 hover:text-orange-500 rounded-lg transition">
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFromCart(item.product_id)}
                                        className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition shrink-0">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {user && cart.length > 0 && (
                    <div className="border-t p-6 bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-600 font-medium">Total</span>
                            <span className="text-2xl font-bold text-gray-800">
                                ${total.toLocaleString("es-CL")}
                            </span>
                        </div>
                        <button onClick={handleCheckout}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-bold text-lg transition shadow-md">
                            Ir a Pagar
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}

export default CartDrawer
