import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
    BadgeCheck,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Heart,
    Minus,
    PackageCheck,
    Plus,
    RotateCcw,
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

const reviews = [
    { title: "Firme", author: "Patricio Riquelme", text: "Adecuado tamano", age: "hace 1 mes" },
    { title: "Es la que necesitaba", author: "Carolin", text: "Se ve igual a la foto, ademas se siente muy firme y segura.", age: "hace 5 meses" },
    { title: "PERFECTA PARA MIS EXPECTATIVAS", author: "ELENA", text: "Es liviana, facil de transportar y ocupa poco espacio para guardarla.", age: "hace 1 ano" },
    { title: "Excelente", author: "Glenis guacaran", text: "Es justo lo que estaba buscando.", age: "hace 1 ano" },
    { title: "Buena calidad", author: "Alicia", text: "Buen producto, cumple con lo esperado.", age: "hace 2 anos" },
    { title: "100% funcional", author: "Patricia", text: "De buena calidad, la foto es precisa.", age: "hace 2 anos" },
]

const formatPrice = (value) => `$${Number(value || 0).toLocaleString("es-CL")}`

const Stars = ({ size = 15 }) => (
    <div className="flex items-center text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} size={size} fill="currentColor" strokeWidth={1.5} />
        ))}
    </div>
)

const ProductDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { addToCart } = useCart()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [quantity, setQuantity] = useState(1)
    const [selectedImage, setSelectedImage] = useState(0)
    const [isFavorite, setIsFavorite] = useState(false)
    const [message, setMessage] = useState("")

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/products/${id}`)
                setProduct(res.data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchProduct()
    }, [id])

    useEffect(() => {
        if (!user) return
        api.get("/products/favorites/my")
            .then((res) => setIsFavorite(res.data.some((item) => Number(item.id) === Number(id))))
            .catch(() => setIsFavorite(false))
    }, [id, user])

    const gallery = useMemo(() => {
        if (!product?.image_url) return []
        return [product.image_url, product.image_url, product.image_url, product.image_url]
    }, [product])

    const discountPrice = Math.round(Number(product?.price || 0) * 1.18)
    const stock = Number(product?.stock || 0)
    const maxQuantity = Math.max(stock, 1)

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
            const res = await api.post(`/products/${product.id}/favorite`)
            setIsFavorite(res.data.is_favorite)
        } catch (err) {
            setMessage(err.response?.data?.message || "No se pudo actualizar favoritos")
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
                <h1 className="text-2xl font-bold text-gray-900">Producto no encontrado</h1>
                <Link to="/productos" className="mt-4 text-orange-600 font-semibold">Volver a productos</Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white text-gray-900">
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

                        <div className="order-1 sm:order-2 relative min-h-[360px] sm:min-h-[520px] border border-gray-200 bg-white flex items-center justify-center">
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
                        <p className="text-xs text-gray-600 mt-3">
                            Vendido por <span className="font-semibold underline">Ferremas</span> <BadgeCheck size={13} className="inline text-slate-500" />
                        </p>

                        <div className="flex items-center gap-3 mt-3">
                            <Stars />
                            <a href="#opiniones" className="text-sm text-slate-600 underline">4.6 (21)</a>
                        </div>

                        <div className="mt-7">
                            <div className="flex items-center gap-2">
                                <p className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</p>
                                <span className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">-15%</span>
                            </div>
                            <p className="text-sm text-gray-400 line-through">{formatPrice(discountPrice)}</p>
                        </div>

                        <div className="mt-5 text-xs text-green-700">
                            <span className="bg-green-600 text-white px-1 mr-1 rounded-sm">CMR</span>
                            Ahorra comprando sobre $50.000
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
                                className="h-10 flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded px-5 flex items-center justify-center gap-2"
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
                            <p><span className="font-bold">• Tipo:</span> {product.category || "General"}</p>
                            <p><span className="font-bold">• Material:</span> Alta resistencia</p>
                        </div>

                        <div className="mt-6 space-y-4 text-sm border-b border-gray-200 pb-5">
                            <p className="flex items-center gap-3"><RotateCcw size={18} /> Este producto tiene <span className="underline">derecho a retracto</span></p>
                            <p className="flex items-center gap-3 text-gray-500"><PackageCheck size={18} /> Cod. del producto: {product.id}</p>
                        </div>

                        <div className="mt-5">
                            <h2 className="font-semibold text-sm">Entrega en Cerrillos</h2>
                            <div className="mt-4 space-y-4 text-sm">
                                <p className="flex gap-3">
                                    <Store size={20} className="shrink-0" />
                                    <span><span className="font-semibold">Stock disponible: {stock}</span><br /><span className="text-gray-500 text-xs">Selecciona ubicacion, Metropolitana de Santiago</span></span>
                                </p>
                                <p className="flex gap-3">
                                    <Truck size={20} className="shrink-0" />
                                    <span><span className="underline">Envio a domicilio</span> <span className="text-green-700 bg-green-100 text-xs px-1 py-0.5 rounded">Llega manana</span></span>
                                </p>
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
                        <p className="text-xs text-gray-500">Vendido por <span className="font-bold underline text-gray-900">Ferremas</span></p>
                        <p className="text-green-700 text-sm font-semibold mt-2">Recomendado por clientes</p>
                        <div className="flex justify-center mt-2"><Stars /></div>
                        <div className="grid grid-cols-3 gap-3 mt-5 text-[11px] text-gray-600">
                            <span>Entrega a tiempo</span>
                            <span>Cumple sus entregas</span>
                            <span>Buen servicio</span>
                        </div>
                    </div>
                </section>

                <section id="opiniones" className="mt-12 pb-12">
                    <h2 className="text-lg font-semibold border-b border-slate-700 pb-3">Opiniones de este producto</h2>
                    <div className="mt-7 flex flex-col sm:flex-row gap-8 sm:items-center">
                        <div className="text-center w-36">
                            <p className="text-4xl font-light">4.6<span className="text-lg">/5</span></p>
                            <div className="flex justify-center mt-2"><Stars /></div>
                            <p className="text-xs mt-1">21 comentarios</p>
                        </div>
                        <div className="space-y-2 text-xs min-w-[220px]">
                            {[15, 5, 0, 1, 0].map((count, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <span>{5 - index}★</span>
                                    <div className="w-36 h-1.5 bg-gray-200">
                                        <div className="h-full bg-slate-600" style={{ width: `${Math.max((count / 15) * 100, count ? 8 : 0)}%` }} />
                                    </div>
                                    <span className="text-slate-500">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-3 text-sm">
                        <span>Ordenar por:</span>
                        <select className="border-b border-gray-300 py-2 pr-8 focus:outline-none">
                            <option>Mejores evaluaciones</option>
                            <option>Mas recientes</option>
                        </select>
                    </div>

                    <div className="mt-7 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {reviews.map((review) => (
                            <article key={`${review.title}-${review.author}`} className="border border-gray-200 rounded-lg p-4 shadow-sm min-h-32">
                                <div className="flex justify-between gap-3">
                                    <div>
                                        <h3 className="font-bold text-sm">{review.title}</h3>
                                        <p className="text-xs">por {review.author}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <Stars size={13} />
                                        <p className="text-[11px] text-gray-500">{review.age}</p>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm">{review.text}</p>
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
                </section>
            </div>
        </div>
    )
}

export default ProductDetail
