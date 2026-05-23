import { useEffect, useState } from "react"
import { ShoppingCart, Heart } from "lucide-react"
import { useNavigate } from "react-router-dom"
import api from "../../api/axios"
import { useCart } from "../../context/CartContext"
import { useAuth } from "../../context/AuthContext"

const FeaturedProducts = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [favoriteIds, setFavoriteIds] = useState([])
    const { addToCart } = useCart()
    const { user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get("/products")
                setProducts(res.data.slice(0, 8))
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [])

    useEffect(() => {
        if (!user) {
            setFavoriteIds([])
            return
        }
        api.get("/products/favorites/my")
            .then((res) => setFavoriteIds(res.data.map((product) => product.id)))
            .catch(() => setFavoriteIds([]))
    }, [user])

    const handleAddToCart = async (productId) => {
        if (!user) { navigate("/login"); return }
        await addToCart(productId)
    }

    const handleToggleFavorite = async (productId) => {
        if (!user) { navigate("/login"); return }
        try {
            const res = await api.post(`/products/${productId}/favorite`)
            setFavoriteIds((prev) => res.data.is_favorite
                ? [...new Set([...prev, productId])]
                : prev.filter((id) => id !== productId)
            )
        } catch (err) {
            alert(err.response?.data?.message || "No se pudo actualizar favorito")
        }
    }

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
    )

    if (products.length === 0) return null

    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Productos Destacados</h2>
                    <p className="text-gray-400 text-sm mt-1">Los más vendidos de Ferremas</p>
                </div>
                <a href="/productos" className="text-orange-500 text-sm font-semibold hover:underline">
                    Ver todos →
                </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {products.map((p) => (
                    <div
                        key={p.id}
                        onClick={() => navigate(`/productos/${p.id}`)}
                        onKeyDown={(e) => e.key === "Enter" && navigate(`/productos/${p.id}`)}
                        role="button"
                        tabIndex={0}
                        className="bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition group border border-gray-100 min-w-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <div className="relative overflow-hidden rounded-t-xl sm:rounded-t-2xl bg-gray-50 h-36 sm:h-48">
                            {p.image_url ? (
                                <img src={p.image_url} alt={p.name}
                                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition duration-300" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">Sin imagen</div>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleToggleFavorite(p.id)
                                }}
                                className={`absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 bg-white rounded-full shadow transition ${favoriteIds.includes(p.id) ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
                                title={favoriteIds.includes(p.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                            >
                                <Heart size={16} fill={favoriteIds.includes(p.id) ? "currentColor" : "none"} />
                            </button>
                            {p.stock === 0 && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-t-2xl">
                                    <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full">Agotado</span>
                                </div>
                            )}
                        </div>
                        <div className="p-3 sm:p-4">
                            <span className="text-xs text-orange-500 font-medium">{p.category}</span>
                            <h3 className="text-sm font-semibold text-gray-800 mt-1 line-clamp-2">{p.name}</h3>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{p.description}</p>
                            <p className="text-xs text-gray-400 mt-1">Stock: {p.stock}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3">
                                <span className="text-base sm:text-lg font-bold text-gray-800">
                                    ${Number(p.price).toLocaleString("es-CL")}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleAddToCart(p.id)
                                    }}
                                    disabled={p.stock === 0}
                                    className="flex items-center justify-center gap-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs px-3 py-2 rounded-xl transition w-full sm:w-auto">
                                    <ShoppingCart size={14} />
                                    {p.stock === 0 ? "Agotado" : "Agregar"}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default FeaturedProducts
