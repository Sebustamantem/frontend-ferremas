import { useEffect, useState } from "react"
import { ShoppingCart, Heart, Search, SlidersHorizontal } from "lucide-react"
import api from "../../api/axios"
import { useCart } from "../../context/CartContext"
import { useAuth } from "../../context/AuthContext"
import { useNavigate, useSearchParams } from "react-router-dom"

const categories = ["Todas", "Herramientas", "Construcción", "Electricidad", "Plomería", "Pintura", "Jardín", "Fijaciones", "Otros"]

const normalizeCategory = (value = "") =>
    value
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()

const getCategoryFromParam = (param) => {
    if (!param) return "Todas"
    const normalizedParam = normalizeCategory(param)
    return categories.find((category) => normalizeCategory(category) === normalizedParam) || "Todas"
}

const Products = () => {
    const [products, setProducts] = useState([])
    const [filtered, setFiltered] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeCategory, setActiveCategory] = useState("Todas")
    const [search, setSearch] = useState("")
    const [sortBy, setSortBy] = useState("newest")
    const [favoriteIds, setFavoriteIds] = useState([])
    const { addToCart } = useCart()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    useEffect(() => {
        setActiveCategory(getCategoryFromParam(searchParams.get("categoria")))
        setSearch(searchParams.get("buscar") || "")
    }, [searchParams])

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get("/products")
                setProducts(res.data)
                setFiltered(res.data)
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

    useEffect(() => {
        let result = [...products]
        if (activeCategory !== "Todas") {
            result = result.filter((p) => normalizeCategory(p.category) === normalizeCategory(activeCategory))
        }
        if (search.trim()) {
            const query = search.toLowerCase()
            result = result.filter((p) =>
                p.name?.toLowerCase().includes(query)
                || p.description?.toLowerCase().includes(query)
                || p.category?.toLowerCase().includes(query)
            )
        }
        if (sortBy === "price_asc") result.sort((a, b) => a.price - b.price)
        if (sortBy === "price_desc") result.sort((a, b) => b.price - a.price)
        if (sortBy === "newest") result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        setFiltered(result)
    }, [activeCategory, search, sortBy, products])

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
            console.error(err.response?.data?.message || "No se pudo actualizar favorito")
        }
    }

    const handleCategoryChange = (category) => {
        setActiveCategory(category)
        const nextParams = {}
        if (search.trim()) nextParams.buscar = search.trim()
        if (category === "Todas") {
            setSearchParams(nextParams)
            return
        }
        setSearchParams({ ...nextParams, categoria: normalizeCategory(category) })
    }

    const handleSearchChange = (value) => {
        setSearch(value)
        const nextParams = {}
        if (value.trim()) nextParams.buscar = value.trim()
        if (activeCategory !== "Todas") nextParams.categoria = normalizeCategory(activeCategory)
        setSearchParams(nextParams)
    }

    return (
        <div className="min-h-screen brand-page">
            <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">

                <div className="mb-5 sm:mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Productos</h1>
                    <p className="text-gray-600 text-sm mt-1">{filtered.length} productos encontrados</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Buscar productos..."
                            value={search} onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-amber-100 bg-white/95 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal size={18} className="text-gray-400 shrink-0" />
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                            className="w-full sm:w-auto py-3 px-4 rounded-xl border border-amber-100 bg-white/95 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                            <option value="newest">Más recientes</option>
                            <option value="price_asc">Menor precio</option>
                            <option value="price_desc">Mayor precio</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                    {categories.map((cat) => (
                        <button key={cat} onClick={() => handleCategoryChange(cat)}
                            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition ${activeCategory === cat
                                    ? "brand-button text-gray-950 shadow-md"
                                    : "bg-white/95 text-gray-700 border border-amber-100 hover:border-teal-300 hover:text-teal-700"
                                }`}>
                            {cat}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <p className="text-lg font-medium">No se encontraron productos</p>
                        <p className="text-sm mt-1">Intenta con otra categoría o búsqueda</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                        {filtered.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => navigate(`/productos/${p.id}`)}
                                onKeyDown={(e) => e.key === "Enter" && navigate(`/productos/${p.id}`)}
                                role="button"
                                tabIndex={0}
                                className="brand-card rounded-xl sm:rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition group border min-w-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <div className="relative overflow-hidden rounded-t-xl sm:rounded-t-2xl bg-gradient-to-br from-amber-50 to-teal-50 h-36 sm:h-48">
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
                                    <span className="text-xs text-teal-700 font-medium">{p.category}</span>
                                    <h3 className="text-sm font-semibold text-gray-800 mt-1 line-clamp-2">{p.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{p.description}</p>
                                    <p className="text-xs text-gray-500 mt-1">Stock: {p.stock}</p>
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
                                            className="flex items-center justify-center gap-1 brand-button disabled:bg-none disabled:bg-gray-200 disabled:text-gray-600 text-xs px-3 py-2 rounded-xl transition w-full sm:w-auto">
                                            <ShoppingCart size={14} />
                                            {p.stock === 0 ? "Agotado" : "Agregar"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Products
