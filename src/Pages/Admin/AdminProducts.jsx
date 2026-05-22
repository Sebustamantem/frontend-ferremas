import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    AlertTriangle,
    Boxes,
    CreditCard,
    Pencil,
    Plus,
    Search,
    Trash2,
    Upload,
    Users,
    X,
} from "lucide-react"
import api from "../../api/axios"
import { useAuth } from "../../context/AuthContext"

const categories = [
    "Herramientas", "Construccion", "Electricidad",
    "Plomeria", "Pintura", "Jardin", "Fijaciones", "Otros"
]

const emptyForm = { name: "", description: "", price: "", stock: "", category: "" }

const normalizeCategory = (value = "") =>
    value
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()

const AdminProducts = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [products, setProducts] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [editingId, setEditingId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState("")
    const [search, setSearch] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("Todas")

    useEffect(() => {
        if (!user || user.role !== "admin") {
            navigate("/")
            return
        }
        fetchProducts()
    }, [user, navigate])

    const fetchProducts = async () => {
        setFetching(true)
        try {
            const res = await api.get("/products")
            setProducts(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setFetching(false)
        }
    }

    const stats = useMemo(() => {
        const totalStock = products.reduce((acc, product) => acc + Number(product.stock || 0), 0)
        const lowStock = products.filter((product) => Number(product.stock || 0) > 0 && Number(product.stock || 0) <= 5)
        const outOfStock = products.filter((product) => Number(product.stock || 0) === 0)

        return {
            totalProducts: products.length,
            totalStock,
            lowStock: lowStock.length,
            outOfStock: outOfStock.length,
        }
    }, [products])

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch = product.name?.toLowerCase().includes(search.toLowerCase())
                || product.description?.toLowerCase().includes(search.toLowerCase())
            const matchesCategory = categoryFilter === "Todas"
                || normalizeCategory(product.category) === normalizeCategory(categoryFilter)
            return matchesSearch && matchesCategory
        })
    }, [products, search, categoryFilter])

    const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value })

    const handleImageChange = (event) => {
        const file = event.target.files[0]
        if (file) {
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setLoading(true)
        setError("")
        try {
            const formData = new FormData()
            formData.append("name", form.name)
            formData.append("description", form.description)
            formData.append("price", form.price)
            formData.append("stock", form.stock)
            formData.append("category", form.category)
            if (imageFile) formData.append("image", imageFile)

            if (editingId) {
                await api.put(`/products/${editingId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                })
            } else {
                await api.post("/products", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                })
            }
            handleCloseModal()
            fetchProducts()
        } catch (err) {
            setError(err.response?.data?.message || "Error al guardar producto")
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (product) => {
        setForm({
            name: product.name,
            description: product.description || "",
            price: product.price,
            stock: product.stock,
            category: product.category || ""
        })
        setImagePreview(product.image_url || null)
        setImageFile(null)
        setEditingId(product.id)
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (!confirm("Seguro que quieres eliminar este producto?")) return
        try {
            await api.delete(`/products/${id}`)
            fetchProducts()
        } catch (err) {
            console.error(err)
        }
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setForm(emptyForm)
        setImageFile(null)
        setImagePreview(null)
        setEditingId(null)
        setError("")
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 overflow-hidden rounded-lg bg-gray-900 text-white shadow-sm">
                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div>
                                <p className="text-sm font-semibold text-orange-300">Administrador</p>
                                <h1 className="text-3xl font-bold mt-1">Panel de productos</h1>
                                <p className="text-gray-300 text-sm mt-2">
                                    Gestiona catalogo, stock y accesos principales de Ferremas.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => navigate("/admin/dashboard")}
                                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                                >
                                    <Boxes size={16} />
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => navigate("/admin/users")}
                                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                                >
                                    <Users size={16} />
                                    Usuarios
                                </button>
                                <button
                                    onClick={() => navigate("/admin/credits")}
                                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                                >
                                    <CreditCard size={16} />
                                    FerreCredito
                                </button>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
                                >
                                    <Plus size={18} />
                                    Nuevo producto
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                    <StatCard icon={Boxes} label="Productos" value={stats.totalProducts} color="orange" />
                    <StatCard icon={Boxes} label="Unidades en stock" value={stats.totalStock} color="blue" />
                    <StatCard icon={AlertTriangle} label="Stock bajo" value={stats.lowStock} color="yellow" />
                    <StatCard icon={X} label="Agotados" value={stats.outOfStock} color="red" />
                </div>

                <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-gray-100">
                        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Catalogo</h2>
                                <p className="text-sm text-gray-400">{filteredProducts.length} productos visibles</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative">
                                    <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Buscar producto"
                                        className="w-full sm:w-72 pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <select
                                    value={categoryFilter}
                                    onChange={(event) => setCategoryFilter(event.target.value)}
                                    className="py-2.5 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="Todas">Todas</option>
                                    {categories.map((category) => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {fetching ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[860px]">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Producto</th>
                                        <th className="px-6 py-4 text-left">Categoria</th>
                                        <th className="px-6 py-4 text-left">Precio</th>
                                        <th className="px-6 py-4 text-left">Stock</th>
                                        <th className="px-6 py-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                                                No hay productos para mostrar.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProducts.map((product) => (
                                            <tr key={product.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {product.image_url ? (
                                                            <img
                                                                src={product.image_url}
                                                                alt={product.name}
                                                                className="w-12 h-12 object-cover rounded-lg border border-gray-200 bg-gray-50"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                                                Sin img
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-gray-800 truncate max-w-[360px]">{product.name}</p>
                                                            <p className="text-gray-400 text-xs truncate max-w-[360px]">{product.description}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-orange-100 text-orange-600 text-xs px-3 py-1 rounded-full font-semibold">
                                                        {product.category || "Sin categoria"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-gray-800">
                                                    ${Number(product.price).toLocaleString("es-CL")}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StockBadge stock={Number(product.stock || 0)} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(product)}
                                                            className="inline-flex items-center justify-center w-9 h-9 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                                            title="Editar"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            className="inline-flex items-center justify-center w-9 h-9 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 mb-1">
                            {editingId ? "Editar producto" : "Nuevo producto"}
                        </h2>
                        <p className="text-sm text-gray-400 mb-6">
                            Completa los datos del producto para publicarlo en el catalogo.
                        </p>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm py-2 px-4 rounded-lg mb-4">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <input
                                type="text"
                                name="name"
                                placeholder="Nombre del producto"
                                value={form.name}
                                onChange={handleChange}
                                required
                                className="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
                            />

                            <textarea
                                name="description"
                                placeholder="Descripcion"
                                value={form.description}
                                onChange={handleChange}
                                rows={3}
                                className="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 resize-none"
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input
                                    type="number"
                                    name="price"
                                    placeholder="Precio ($)"
                                    value={form.price}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    className="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
                                />
                                <input
                                    type="number"
                                    name="stock"
                                    placeholder="Stock"
                                    value={form.stock}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    className="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
                                />
                            </div>

                            <select
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                required
                                className="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
                            >
                                <option value="">Selecciona categoria</option>
                                {categories.map((category) => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700">Imagen del producto</label>
                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition">
                                    <Upload size={24} className="text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-500">Haz clic para subir una imagen</span>
                                    <span className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP</span>
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>

                                {imagePreview && (
                                    <img
                                        src={imagePreview}
                                        alt="preview"
                                        className="w-full h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
                                    />
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-60 mt-1"
                            >
                                {loading ? "Guardando..." : editingId ? "Actualizar producto" : "Agregar producto"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

const StatCard = ({ icon: Icon, label, value, color }) => {
    const colors = {
        orange: "bg-orange-100 text-orange-600",
        blue: "bg-blue-100 text-blue-600",
        yellow: "bg-yellow-100 text-yellow-700",
        red: "bg-red-100 text-red-600",
    }

    return (
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-gray-400 text-sm">{label}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
                </div>
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${colors[color]}`}>
                    <Icon size={22} />
                </div>
            </div>
        </div>
    )
}

const StockBadge = ({ stock }) => {
    const className = stock === 0
        ? "bg-red-100 text-red-700"
        : stock <= 5
            ? "bg-yellow-100 text-yellow-700"
            : "bg-green-100 text-green-700"

    return (
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${className}`}>
            {stock} unidades
        </span>
    )
}

export default AdminProducts
