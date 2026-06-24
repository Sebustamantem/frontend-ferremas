import { useEffect, useMemo } from "react"
import { Heart, ShoppingCart, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useCart } from "../../context/CartContext"
import { useProducts } from "../../context/ProductContext"

const Favorites = () => {
    const { user } = useAuth()
    const { addToCart } = useCart()
    const { products, productsLoading, favoriteIds, toggleFavorite } = useProducts()
    const navigate = useNavigate()
    const favorites = useMemo(
        () => products.filter((product) => favoriteIds.includes(product.id)),
        [products, favoriteIds]
    )

    useEffect(() => {
        if (!user) {
            navigate("/login")
            return
        }
    }, [user, navigate])

    const handleRemove = async (productId) => {
        await toggleFavorite(productId)
    }

    const handleAddToCart = async (productId) => {
        await addToCart(productId)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Mis favoritos</h1>
                    <p className="text-gray-500 text-sm mt-1">Productos guardados para comprar despues.</p>
                </div>

                {productsLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                        <Heart className="mx-auto text-gray-300 mb-3" size={42} />
                        <h2 className="text-xl font-bold text-gray-800">Aun no tienes favoritos</h2>
                        <p className="text-gray-500 text-sm mt-2">Marca productos con el corazon para verlos aqui.</p>
                        <button
                            onClick={() => navigate("/productos")}
                            className="mt-5 bg-orange-500 text-white rounded-xl px-5 py-3 font-semibold hover:bg-orange-600"
                        >
                            Ver productos
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {favorites.map((product) => (
                            <article key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                <div className="h-40 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-3" />
                                    ) : (
                                        <span className="text-gray-300 text-sm">Sin imagen</span>
                                    )}
                                </div>
                                <p className="text-xs font-semibold text-orange-500">{product.category || "Producto"}</p>
                                <h2 className="text-base font-bold text-gray-900 mt-1">{product.name}</h2>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                                <div className="flex items-center justify-between gap-3 mt-4">
                                    <p className="text-lg font-bold text-gray-900">${Number(product.price).toLocaleString("es-CL")}</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAddToCart(product.id)}
                                            disabled={Number(product.stock || 0) <= 0}
                                            className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400"
                                            title="Agregar al carrito"
                                        >
                                            <ShoppingCart size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleRemove(product.id)}
                                            className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                                            title="Quitar favorito"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Favorites
