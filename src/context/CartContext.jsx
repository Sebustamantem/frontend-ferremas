import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import api from "../api/axios"

const CartContext = createContext()

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([])
    const [loading, setLoading] = useState(false)
    const { user } = useAuth()

    useEffect(() => {
        if (user) fetchCart()
        else setCart([])
    }, [user])

    const fetchCart = async () => {
        try {
            const res = await api.get("/cart")
            setCart(res.data)
        } catch (err) {
            console.error(err)
        }
    }

    const addToCart = async (product_id, quantity = 1) => {
        if (!user) return false
        try {
            setLoading(true)
            await api.post("/cart", { product_id, quantity })
            await fetchCart()
            return true
        } catch (err) {
            console.error(err)
            return false
        } finally {
            setLoading(false)
        }
    }

    const addServiceToCart = async (serviceId) => {
        if (!user) return false
        try {
            setLoading(true)
            await api.post(`/services/${serviceId}/cart`)
            await fetchCart()
            return true
        } catch (err) {
            console.error(err)
            return false
        } finally {
            setLoading(false)
        }
    }

    const updateQuantity = async (productId, quantity) => {
        try {
            if (quantity < 1) return
            await api.put(`/cart/${productId}`, { quantity })
            await fetchCart()
        } catch (err) {
            console.error(err)
        }
    }

    const removeFromCart = async (productId) => {
        try {
            await api.delete(`/cart/${productId}`)
            await fetchCart()
        } catch (err) {
            console.error(err)
        }
    }

    const removeServiceFromCart = async (serviceId) => {
        try {
            await api.delete(`/services/${serviceId}/cart`)
            await fetchCart()
        } catch (err) {
            console.error(err)
        }
    }

    const clearCart = async () => {
        try {
            await api.delete("/cart/clear")
            setCart([])
        } catch (err) {
            console.error(err)
        }
    }

    const total = cart.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0)
    const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0)
    const reservationExpiresAt = cart
        .map((item) => item.reservation_expires_at)
        .filter(Boolean)
        .sort()[0] || null

    return (
        <CartContext.Provider value={{ cart, loading, addToCart, addServiceToCart, updateQuantity, removeFromCart, removeServiceFromCart, clearCart, total, itemCount, reservationExpiresAt, fetchCart }}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => useContext(CartContext)
