import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import api from "../api/axios"
import { useAuth } from "./AuthContext"

const ProductContext = createContext()
const PRODUCT_CACHE_TTL = 5 * 60 * 1000

let productCache = {
    data: [],
    fetchedAt: 0,
    promise: null,
}

let favoriteCache = {
    userId: null,
    ids: [],
    fetchedAt: 0,
    promise: null,
}

export const ProductProvider = ({ children }) => {
    const { user } = useAuth()
    const [products, setProducts] = useState(productCache.data)
    const [productsLoading, setProductsLoading] = useState(!productCache.data.length)
    const [favoriteIds, setFavoriteIds] = useState([])
    const userIdRef = useRef(user?.id || null)

    const fetchProducts = useCallback(async ({ force = false } = {}) => {
        const isFresh = productCache.data.length && Date.now() - productCache.fetchedAt < PRODUCT_CACHE_TTL
        if (!force && isFresh) {
            setProducts(productCache.data)
            setProductsLoading(false)
            return productCache.data
        }

        if (!productCache.promise) {
            productCache.promise = api.get("/products")
                .then((res) => {
                    productCache.data = res.data.products || res.data.data || res.data || []
                    productCache.fetchedAt = Date.now()
                    return productCache.data
                })
                .finally(() => {
                    productCache.promise = null
                })
        }

        setProductsLoading(true)
        try {
            const data = await productCache.promise
            setProducts(data)
            return data
        } catch (err) {
            console.error(err)
            setProducts([])
            return []
        } finally {
            setProductsLoading(false)
        }
    }, [])

    const fetchFavoriteIds = useCallback(async ({ force = false } = {}) => {
        if (!user?.id) {
            favoriteCache = { userId: null, ids: [], fetchedAt: 0, promise: null }
            setFavoriteIds([])
            return []
        }

        const isSameUser = favoriteCache.userId === user.id
        const isFresh = isSameUser && Date.now() - favoriteCache.fetchedAt < PRODUCT_CACHE_TTL
        if (!force && isFresh) {
            setFavoriteIds(favoriteCache.ids)
            return favoriteCache.ids
        }

        if (!favoriteCache.promise || !isSameUser) {
            favoriteCache.promise = api.get("/products/favorites/my")
                .then((res) => {
                    const products = res.data.products || res.data || []
                    const ids = products.map((product) => product.id)
                    favoriteCache = {
                        userId: user.id,
                        ids,
                        fetchedAt: Date.now(),
                        promise: null,
                    }
                    return ids
                })
                .finally(() => {
                    favoriteCache.promise = null
                })
        }

        try {
            const ids = await favoriteCache.promise
            setFavoriteIds(ids)
            return ids
        } catch {
            setFavoriteIds([])
            return []
        }
    }, [user?.id])

    const toggleFavorite = useCallback(async (productId) => {
        const res = await api.post(`/products/${productId}/favorite`)
        const nextIds = res.data.is_favorite
            ? [...new Set([...favoriteCache.ids, productId])]
            : favoriteCache.ids.filter((id) => id !== productId)

        favoriteCache = {
            userId: user?.id || null,
            ids: nextIds,
            fetchedAt: Date.now(),
            promise: null,
        }
        setFavoriteIds(nextIds)
        return res.data
    }, [user?.id])

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    useEffect(() => {
        if (userIdRef.current !== user?.id) {
            userIdRef.current = user?.id || null
            setFavoriteIds([])
        }
        fetchFavoriteIds()
    }, [fetchFavoriteIds, user?.id])

    const value = useMemo(() => ({
        products,
        productsLoading,
        favoriteIds,
        fetchProducts,
        fetchFavoriteIds,
        toggleFavorite,
    }), [products, productsLoading, favoriteIds, fetchProducts, fetchFavoriteIds, toggleFavorite])

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    )
}

export const useProducts = () => useContext(ProductContext)
