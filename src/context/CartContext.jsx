import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import api from "../api/axios"

const CartContext = createContext()
const CART_CACHE_TTL = 60 * 1000
let cartCache = {
    userId: null,
    data: [],
    fetchedAt: 0,
    promise: null,
}

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([])
    const [loading, setLoading] = useState(false)
    const { user } = useAuth()

    useEffect(() => {
        if (user) fetchCart()
        else setCart([])
    }, [user])

    const fetchCart = async ({ force = false } = {}) => {
        if (!user?.id) {
            setCart([])
            return []
        }

        const isSameUser = cartCache.userId === user.id
        const isFresh = isSameUser && Date.now() - cartCache.fetchedAt < CART_CACHE_TTL
        if (!force && isFresh) {
            setCart(cartCache.data)
            return cartCache.data
        }

        try {
            if (!cartCache.promise || !isSameUser) {
                cartCache.promise = api.get("/cart")
                    .then((res) => {
                        cartCache = {
                            userId: user.id,
                            data: res.data.cart || res.data || [],
                            fetchedAt: Date.now(),
                            promise: null,
                        }
                        return cartCache.data
                    })
                    .finally(() => {
                        cartCache.promise = null
                    })
            }
            const data = await cartCache.promise
            setCart(data)
            return data
        } catch (err) {
            console.error(err)
            return []
        }
    }

    const addToCart = async (product_id, quantity = 1) => {
        if (!user) return false
        try {
            setLoading(true)
            await api.post("/cart", { product_id, quantity })
            await fetchCart({ force: true })
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
            await fetchCart({ force: true })
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
            await fetchCart({ force: true })
        } catch (err) {
            console.error(err)
        }
    }

    const removeFromCart = async (productId) => {
        try {
            await api.delete(`/cart/${productId}`)
            await fetchCart({ force: true })
        } catch (err) {
            console.error(err)
        }
    }

    const removeServiceFromCart = async (serviceId) => {
        try {
            await api.delete(`/services/${serviceId}/cart`)
            await fetchCart({ force: true })
        } catch (err) {
            console.error(err)
        }
    }

    const clearCart = async () => {
        try {
            await api.delete("/cart/clear")
            cartCache = { userId: user?.id || null, data: [], fetchedAt: Date.now(), promise: null }
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
