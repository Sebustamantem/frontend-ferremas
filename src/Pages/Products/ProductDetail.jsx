import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Heart,
    Minus,
    Plus,
    ShieldCheck,
    ShoppingCart,
    Star,
    Store,
    ThumbsDown,
    ThumbsUp,
    Truck,
} from "lucide-react"
import api from "../../api/axios"
import { useAuth } from "../../context/AuthContext"
import { useCart } from "../../context/CartContext"
import { useProducts } from "../../context/ProductContext"

const emptyReviewData = {
    total: 0,
    average_rating: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviews: [],
}

const formatPrice = (value) => `$${Number(value || 0).toLocaleString("es-CL")}`
const formatDate = (value) => value
    ? new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })
    : ""

const Stars = ({ size = 15, rating = 0 }) => (
    <div className="flex items-center text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} size={size} fill={star <= Math.round(rating) ? "currentColor" : "none"} strokeWidth={1.5} />
        ))}
    </div>
)

const ProductDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { addToCart } = useCart()
    const { products, favoriteIds, toggleFavorite } = useProducts()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [quantity, setQuantity] = useState(1)
    const [selectedImage, setSelectedImage] = useState(0)
    const [isFavorite, setIsFavorite] = useState(false)
    const [message, setMessage] = useState("")
    const [reviewData, setReviewData] = useState(emptyReviewData)

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" })
        const fetchProduct = async () => {
            try {
                const cachedProduct = products.find((item) => Number(item.id) === Number(id))
                if (cachedProduct) {
                    setProduct(cachedProduct)
                    return
                }
                const res = await api.get(`/products/${id}`)
                setProduct(res.data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchProduct()
    }, [id, products])

    useEffect(() => {
        api.get(`/products/${id}/reviews`)
            .then((res) => setReviewData(res.data))
            .catch(() => setReviewData(emptyReviewData))
    }, [id])

    useEffect(() => {
        setIsFavorite(favoriteIds.some((itemId) => Number(itemId) === Number(id)))
    }, [favoriteIds, id])

    const gallery = useMemo(() => {
        const urls = Array.isArray(product?.image_urls) ? product.image_urls.filter(Boolean) : []
        if (product?.image_url && !urls.includes(product.image_url)) urls.unshift(product.image_url)
        return [...new Set(urls)]
    }, [product])

    const stock = Number(product?.stock || 0)
    const maxQuantity = Math.max(stock, 1)
    const averageRating = Number(reviewData.average_rating || 0)
    const reviewTotal = Number(reviewData.total || 0)

    const handleAddToCart = async () => {
        if (!user) {
            navigate("/login")
            return
        }
        const ok = await addToCart(product.id, quantity)
        setMessage(ok ? "Producto agregado al carro" : "No se pudo agregar al carro")
    }

    const handleToggleFavorite = async () => {
        if (!user) {
            navigate("/login")
            return
        }
        try {
            const res = await toggleFavorite(product.id)
            setIsFavorite(res.is_favorite)
        } catch (err) {
            setMessage(err.response?.data?.message || "No se pudo actualizar favoritos")
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen brand-page flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!product) {
        return (
            <div className="min-h-screen brand-page flex flex-col items-center justify-center px-4 text-center">
                <h1 className="text-2xl font-bold text-gray-900">Producto no encontrado</h1>
                <Link to="/productos" className="mt-4 text-orange-600 font-semibold">Volver a productos</Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen brand-page text-gray-900">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
                <nav className="text-xs text-gray-500 mb-5 flex flex-wrap gap-1">
                    <Link to="/" className="hover:text-orange-600">Home</Link>
                    <span>&gt;</span>
                    <Link to="/productos" className="hover:text-orange-600">Productos</Link>
                    <span>&gt;</span>
                    <span>{product.category || "Categoria"}</span>
                </nav>

                <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)] gap-6 lg:gap-8">
                    <div className="grid grid-cols-1 sm:grid-cols-[86px_minmax(0,1fr)] gap-4">
                        <div className="order-2 sm:order-1 flex sm:flex-col gap-2 overflow-x-auto sm:overflow-visible">
                            {gallery.length > 0 ? gallery.map((image, index) => (
                                <button
                                    key={`${image}-${index}`}
                                    onClick={() => setSelectedImage(index)}
                                    className={`w-20 h-20 shrink-0 border bg-white p-2 ${selectedImage === index ? "border-blue-600" : "border-gray-200 hover:border-gray-400"}`}
                                    title={`Imagen ${index + 1}`}
                                >
                                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-contain" />
                                </button>
                            )) : (
                                <div className="w-20 h-20 border border-gray-200 text-xs text-gray-400 flex items-center justify-center">Sin imagen</div>
                            )}
                        </div>

                        <div className="order-1 sm:order-2 relative min-h-[360px] sm:min-h-[520px] border border-amber-100 bg-white/95 flex items-center justify-center rounded-2xl shadow-sm">
                            {gallery.length > 0 ? (
                                <img src={gallery[selectedImage]} alt={product.name} className="max-h-[520px] w-full object-contain p-6 sm:p-10" />
                            ) : (
                                <span className="text-gray-300">Sin imagen</span>
                            )}
                            {gallery.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setSelectedImage((prev) => (prev === 0 ? gallery.length - 1 : prev - 1))}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gray-700/70 text-white flex items-center justify-center hover:bg-gray-800"
                                        title="Imagen anterior"
                                    >
                                        <ChevronLeft size={22} />
                                    </button>
                                    <button
                                        onClick={() => setSelectedImage((prev) => (prev + 1) % gallery.length)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gray-700/70 text-white flex items-center justify-center hover:bg-gray-800"
                                        title="Imagen siguiente"
                                    >
                                        <ChevronRight size={22} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <aside>
                        <p className="text-sm text-gray-500 uppercase tracking-wide">{product.category || "FERREMAS"}</p>
                        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1">{product.name}</h1>

                        <div className="flex items-center gap-3 mt-3">
                            <Stars rating={averageRating} />
                            <a href="#opiniones" className="text-sm text-slate-600 underline">
                                {reviewTotal > 0 ? `${averageRating.toFixed(1)} (${reviewTotal})` : "Sin opiniones"}
                            </a>
                        </div>

                        <div className="mt-7">
                            <p className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</p>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <div className="flex items-center border border-gray-200 h-10">
                                <button
                                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                                    className="w-10 h-full flex items-center justify-center bg-gray-100 text-gray-500 hover:text-gray-900"
                                    title="Disminuir cantidad"
                                >
                                    <Minus size={15} />
                                </button>
                                <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                                <button
                                    onClick={() => setQuantity((prev) => Math.min(maxQuantity, prev + 1))}
                                    className="w-10 h-full flex items-center justify-center bg-gray-100 text-gray-500 hover:text-gray-900"
                                    title="Aumentar cantidad"
                                >
                                    <Plus size={15} />
                                </button>
                            </div>
                            <button
                                onClick={handleAddToCart}
                                disabled={stock === 0}
                                className="h-10 flex-1 brand-button disabled:bg-none disabled:bg-gray-300 font-bold rounded px-5 flex items-center justify-center gap-2"
                            >
                                <ShoppingCart size={18} />
                                {stock === 0 ? "Sin stock" : "Agregar al carro"}
                            </button>
                            <button
                                onClick={handleToggleFavorite}
                                className={`w-10 h-10 border rounded-full flex items-center justify-center ${isFavorite ? "text-red-500 border-red-200 bg-red-50" : "text-gray-500 border-gray-200 hover:text-red-500"}`}
                                title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                            >
                                <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
                            </button>
                        </div>
                        {message && <p className="text-sm text-green-700 mt-3">{message}</p>}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7 text-sm text-gray-700">
                            <p><span className="font-bold">Tipo:</span> {product.category || "General"}</p>
                            <p><span className="font-bold">Codigo:</span> {product.id}</p>
                        </div>

                        <div className="mt-6 border-t border-gray-200 pt-5">
                            <h2 className="font-semibold text-sm">Entrega en Cerrillos</h2>
                            <div className="mt-4 space-y-3 text-sm">
                                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                    <p className="font-semibold text-gray-800">Stock disponible: {stock}</p>
                                    <p className="text-xs text-gray-500 mt-1">Unidades disponibles para comprar.</p>
                                </div>
                                <div className="flex gap-3 rounded-xl border border-orange-100 bg-orange-50 p-3">
                                    <Store size={20} className="shrink-0 text-orange-600" />
                                    <span>
                                        <span className="font-semibold text-gray-800">Retiro en tienda</span>
                                        <br />
                                        <span className="text-gray-600 text-xs">
                                            Este producto se prepara y se envia a la tienda seleccionada para retiro.
                                        </span>
                                    </span>
                                </div>
                                <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                                    <Truck size={20} className="shrink-0 text-blue-600" />
                                    <span>
                                        <span className="font-semibold text-gray-800">Envio a domicilio</span>
                                        <br />
                                        <span className="text-gray-600 text-xs">
                                            Disponible para despacho directo a tu direccion durante el checkout.
                                        </span>
                                    </span>
                                </div>
                                <p className="flex gap-3">
                                    <ShieldCheck size={20} className="shrink-0" />
                                    <span>Compra protegida por Ferremas</span>
                                </p>
                            </div>
                        </div>
                    </aside>
                </section>

                <section className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)] gap-6 lg:gap-8">
                    <div className="space-y-3">
                        <details className="border border-gray-200 rounded-lg px-4 py-3" open>
                            <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold list-none">
                                Descripcion <ChevronDown size={16} />
                            </summary>
                            <p className="mt-5 text-gray-700 leading-7">{product.description || "Producto Ferremas seleccionado para trabajos de construccion, mantencion y mejoras del hogar."}</p>
                        </details>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-5 text-center">
                        <p className="text-green-700 text-sm font-semibold">Recomendado por clientes</p>
                        <div className="flex justify-center mt-2"><Stars rating={averageRating} /></div>
                        <div className="grid grid-cols-3 gap-3 mt-5 text-[11px] text-gray-600">
                            <span>Retiro en tienda</span>
                            <span>Envio disponible</span>
                            <span>Compra protegida</span>
                        </div>
                    </div>
                </section>

                <section id="opiniones" className="mt-12 pb-12">
                    <h2 className="text-lg font-semibold border-b border-slate-700 pb-3">Opiniones de este producto</h2>
                    <div className="mt-7 flex flex-col sm:flex-row gap-8 sm:items-center">
                        <div className="text-center w-36">
                            <p className="text-4xl font-light">{averageRating.toFixed(1)}<span className="text-lg">/5</span></p>
                            <div className="flex justify-center mt-2"><Stars rating={averageRating} /></div>
                            <p className="text-xs mt-1">{reviewTotal} comentarios</p>
                        </div>
                        <div className="space-y-2 text-xs min-w-[240px]">
                            {[5, 4, 3, 2, 1].map((rating) => {
                                const count = Number(reviewData.distribution?.[rating] || 0)
                                return (
                                    <div key={rating} className="flex items-center gap-2">
                                        <span className="w-20">{rating} estrellas</span>
                                        <div className="w-36 h-1.5 bg-gray-200">
                                            <div className="h-full bg-slate-600" style={{ width: `${reviewTotal ? (count / reviewTotal) * 100 : 0}%` }} />
                                        </div>
                                        <span className="text-slate-500">{count}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-3 text-sm">
                        <span>Ordenar por:</span>
                        <select className="border-b border-gray-300 py-2 pr-8 focus:outline-none">
                            <option>Mas recientes</option>
                            <option>Mejores evaluaciones</option>
                        </select>
                    </div>

                    {reviewData.reviews.length === 0 ? (
                        <div className="mt-7 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                            Todavia no hay opiniones para este producto.
                        </div>
                    ) : (
                        <div className="mt-7 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {reviewData.reviews.map((review) => (
                                <article key={review.id} className="border border-gray-200 rounded-lg p-4 shadow-sm min-h-32">
                                    <div className="flex justify-between gap-3">
                                        <div>
                                            <h3 className="font-bold text-sm">{review.comment ? "Opinion verificada" : "Compra verificada"}</h3>
                                            <p className="text-xs">por {`${review.user_name || "Cliente"} ${review.user_lastname || ""}`.trim()}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <Stars size={13} rating={review.rating} />
                                            <p className="text-[11px] text-gray-500">{formatDate(review.created_at)}</p>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-sm">{review.comment || "Sin comentario escrito."}</p>
                                    <div className="flex gap-2 mt-4">
                                        <button className="w-9 h-8 border border-gray-300 rounded flex items-center justify-center text-slate-600" title="Util">
                                            <ThumbsUp size={14} />
                                        </button>
                                        <button className="w-9 h-8 border border-gray-300 rounded flex items-center justify-center text-slate-600" title="No util">
                                            <ThumbsDown size={14} />
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}

export default ProductDetail
