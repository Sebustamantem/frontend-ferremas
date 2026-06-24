import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    AlertTriangle,
    Boxes,
    CheckCircle,
    CreditCard,
    History,
    MessageSquareWarning,
    Pencil,
    Plus,
    PackagePlus,
    Search,
    Trash2,
    Upload,
    Users,
    X,
} from "lucide-react"
import api from "../../api/axios"
import { useAuth } from "../../context/AuthContext"
import { downloadCsv } from "../../utils/csv"
import ExportMenu from "../../components/ui/ExportMenu"

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
    const [imageFiles, setImageFiles] = useState([])
    const [imagePreviews, setImagePreviews] = useState([])
    const [existingImageUrls, setExistingImageUrls] = useState([])
    const [editingId, setEditingId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState("")
    const [search, setSearch] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("Todas")
    const [stockFilter, setStockFilter] = useState("all")
    const [reportFilter, setReportFilter] = useState("all")
    const [stockReports, setStockReports] = useState([])
    const [stockMovements, setStockMovements] = useState([])
    const [notice, setNotice] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [restockTarget, setRestockTarget] = useState(null)
    const [restockForm, setRestockForm] = useState({ quantity: "", reason: "" })
    const [restocking, setRestocking] = useState(false)

    useEffect(() => {
        if (!user || user.role !== "admin") {
            navigate("/")
            return
        }
        fetchProducts()
        fetchStockReports()
        fetchStockMovements()
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

    const fetchStockReports = async () => {
        try {
            const res = await api.get("/staff/admin/stock-reports")
            setStockReports(res.data)
        } catch (err) {
            console.error(err)
        }
    }

    const fetchStockMovements = async () => {
        try {
            const res = await api.get("/staff/inventory/stock-movements")
            setStockMovements(res.data || [])
        } catch (err) {
            console.error(err)
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
        const reportedProductIds = new Set(
            stockReports
                .filter((report) => report.status === "pending")
                .map((report) => Number(report.product_id))
        )
        return products.filter((product) => {
            const stock = Number(product.stock || 0)
            const matchesSearch = product.name?.toLowerCase().includes(search.toLowerCase())
                || product.description?.toLowerCase().includes(search.toLowerCase())
            const matchesCategory = categoryFilter === "Todas"
                || normalizeCategory(product.category) === normalizeCategory(categoryFilter)
            const matchesStock = stockFilter === "all"
                || (stockFilter === "available" && stock > 5)
                || (stockFilter === "low" && stock > 0 && stock <= 5)
                || (stockFilter === "out" && stock === 0)
            const matchesReport = reportFilter === "all" || reportedProductIds.has(Number(product.id))
            return matchesSearch && matchesCategory && matchesStock && matchesReport
        })
    }, [products, search, categoryFilter, stockFilter, reportFilter, stockReports])

    const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value })

    const handleImageChange = (event) => {
        const files = Array.from(event.target.files || []).slice(0, Math.max(6 - existingImageUrls.length, 0))
        setImageFiles(files)
        setImagePreviews([...existingImageUrls, ...files.map((file) => URL.createObjectURL(file))])
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
            formData.append("existing_image_urls", JSON.stringify(existingImageUrls))
            imageFiles.forEach((file) => formData.append("images", file))

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
            fetchStockReports()
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
        const productImages = Array.isArray(product.image_urls) && product.image_urls.length
            ? product.image_urls
            : product.image_url ? [product.image_url] : []
        setImagePreviews(productImages)
        setExistingImageUrls(productImages)
        setImageFiles([])
        setEditingId(product.id)
        setShowModal(true)
    }

    const handleEditFromReport = (report) => {
        const product = products.find((item) => item.id === report.product_id)
        if (product) handleEdit(product)
    }

    const handleResolveReport = async (reportId) => {
        try {
            await api.put(`/staff/admin/stock-reports/${reportId}/resolve`)
            setNotice({ type: "success", message: "Aviso de bodega marcado como resuelto." })
            fetchStockReports()
        } catch (err) {
            setNotice({ type: "error", message: err.response?.data?.message || "No se pudo resolver el aviso" })
        }
    }

    const handleDelete = async (id) => {
        setDeleteTarget(products.find((product) => product.id === id))
    }

    const handleOpenRestock = (product) => {
        setRestockTarget(product)
        setRestockForm({ quantity: "", reason: "" })
    }

    const handleRestock = async (event) => {
        event.preventDefault()
        if (!restockTarget) return
        setRestocking(true)
        try {
            await api.post(`/staff/inventory/${restockTarget.id}/restock`, restockForm)
            setNotice({ type: "success", message: "Reposicion de stock registrada correctamente." })
            setRestockTarget(null)
            await Promise.all([fetchProducts(), fetchStockReports(), fetchStockMovements()])
        } catch (err) {
            setNotice({ type: "error", message: err.response?.data?.message || "No se pudo registrar la reposicion" })
        } finally {
            setRestocking(false)
        }
    }

    const confirmDelete = async () => {
        if (!deleteTarget) return
        try {
            await api.delete(`/products/${deleteTarget.id}`)
            setNotice({ type: "success", message: "Producto eliminado correctamente." })
            setDeleteTarget(null)
            fetchProducts()
        } catch (err) {
            setNotice({ type: "error", message: err.response?.data?.message || "No se pudo eliminar el producto" })
        }
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setForm(emptyForm)
        setImageFiles([])
        setImagePreviews([])
        setExistingImageUrls([])
        setEditingId(null)
        setError("")
    }

    const exportProducts = () => {
        downloadCsv("ferremas-productos.csv", filteredProducts.map((product) => ({
            id: product.id,
            nombre: product.name,
            categoria: product.category || "",
            precio: Number(product.price || 0),
            stock: Number(product.stock || 0),
            estado_stock: Number(product.stock || 0) === 0 ? "agotado" : Number(product.stock || 0) <= 5 ? "bajo" : "disponible",
        })))
    }

    const exportStockReports = () => {
        downloadCsv("ferremas-reportes-bodega.csv", stockReports.map((report) => ({
            id: report.id,
            producto: report.product_name,
            estado: report.status,
            stock_registrado: report.stock,
            reportado_por: `${report.reporter_name || ""} ${report.reporter_lastname || ""}`.trim(),
            motivo: report.reason,
            fecha: report.created_at,
        })))
    }

    const exportStockMovements = () => {
        downloadCsv("ferremas-reposiciones-stock.csv", stockMovements.map((movement) => ({
            id: movement.id,
            producto: movement.product_name || "Producto eliminado",
            tipo: movement.movement_type,
            cantidad: Number(movement.quantity || 0),
            stock_anterior: Number(movement.previous_stock || 0),
            stock_nuevo: Number(movement.new_stock || 0),
            usuario: `${movement.user_name || "Sistema"} ${movement.user_lastname || ""}`.trim(),
            motivo: movement.reason || "",
            fecha: movement.created_at,
        })))
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 overflow-visible rounded-lg bg-gray-900 text-white shadow-sm">
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
                                <ExportMenu
                                    dark
                                    items={[
                                        { label: "Catalogo visible", description: "Respeta busqueda y filtros actuales", onClick: exportProducts },
                                        { label: "Reportes de bodega", description: "Pendientes y resueltos", onClick: exportStockReports },
                                        { label: "Reposiciones", description: "Historial de entradas de stock", onClick: exportStockMovements },
                                    ]}
                                />
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

                {notice && (
                    <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${notice.type === "success"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-700"
                        }`}>
                        <div className="flex items-center justify-between gap-4">
                            <span>{notice.message}</span>
                            <button type="button" onClick={() => setNotice(null)} className="font-bold">Cerrar</button>
                        </div>
                    </div>
                )}

                {stockReports.filter((report) => report.status === "pending").length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3 mb-4">
                            <MessageSquareWarning size={20} className="text-amber-700 shrink-0 mt-0.5" />
                            <div>
                                <h2 className="text-sm font-bold text-amber-900">Avisos de bodega pendientes</h2>
                                <p className="text-sm text-amber-800 mt-1">
                                    El bodeguero informa productos no disponibles o con stock que no coincide. Solo el admin ajusta el inventario.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {stockReports.filter((report) => report.status === "pending").map((report) => (
                                <div key={report.id} className="bg-white rounded-lg border border-amber-100 p-4 flex flex-col gap-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 truncate">{report.product_name}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Stock registrado: {report.stock} unidades | Reportado por {report.reporter_name || "Bodega"}
                                            </p>
                                        </div>
                                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-semibold">
                                            Pendiente
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{report.reason}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => handleEditFromReport(report)}
                                            className="inline-flex items-center gap-2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-800 transition"
                                        >
                                            <Pencil size={14} />
                                            Editar producto
                                        </button>
                                        <button
                                            onClick={() => handleResolveReport(report.id)}
                                            className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-green-200 transition"
                                        >
                                            <CheckCircle size={14} />
                                            Marcar resuelto
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
                                <select
                                    value={stockFilter}
                                    onChange={(event) => setStockFilter(event.target.value)}
                                    className="py-2.5 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="all">Todo stock</option>
                                    <option value="available">Disponible</option>
                                    <option value="low">Stock bajo</option>
                                    <option value="out">Agotado</option>
                                </select>
                                <select
                                    value={reportFilter}
                                    onChange={(event) => setReportFilter(event.target.value)}
                                    className="py-2.5 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="all">Todos</option>
                                    <option value="reported">Reportado por bodega</option>
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
                                                            onClick={() => handleOpenRestock(product)}
                                                            className="inline-flex items-center justify-center w-9 h-9 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                            title="Reponer stock"
                                                        >
                                                            <PackagePlus size={16} />
                                                        </button>
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

                <section className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden mt-6">
                    <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <History size={18} className="text-orange-500" />
                                Historial de reposiciones
                            </h2>
                            <p className="text-sm text-gray-400">Ultimas entradas de inventario registradas por admin.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[840px]">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4 text-left">Producto</th>
                                    <th className="px-6 py-4 text-left">Cantidad</th>
                                    <th className="px-6 py-4 text-left">Stock</th>
                                    <th className="px-6 py-4 text-left">Usuario</th>
                                    <th className="px-6 py-4 text-left">Motivo</th>
                                    <th className="px-6 py-4 text-left">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stockMovements.slice(0, 8).map((movement) => (
                                    <tr key={movement.id}>
                                        <td className="px-6 py-4 font-semibold text-gray-800">{movement.product_name || "Producto eliminado"}</td>
                                        <td className="px-6 py-4 text-green-700 font-bold">+{movement.quantity}</td>
                                        <td className="px-6 py-4 text-gray-600">{movement.previous_stock} a {movement.new_stock}</td>
                                        <td className="px-6 py-4 text-gray-600">{`${movement.user_name || "Sistema"} ${movement.user_lastname || ""}`.trim()}</td>
                                        <td className="px-6 py-4 text-gray-500">{movement.reason || "-"}</td>
                                        <td className="px-6 py-4 text-gray-400 text-xs">{new Date(movement.created_at).toLocaleDateString("es-CL")}</td>
                                    </tr>
                                ))}
                                {stockMovements.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Sin reposiciones registradas.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
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
                                <label className="text-sm font-medium text-gray-700">Imágenes del producto</label>
                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition">
                                    <Upload size={24} className="text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-500">Haz clic para subir hasta 6 imágenes</span>
                                    <span className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP. La primera será la portada.</span>
                                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                                </label>

                                {imagePreviews.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {imagePreviews.map((preview, index) => (
                                            <div key={`${preview}-${index}`} className="relative">
                                                <img
                                                    src={preview}
                                                    alt={`preview ${index + 1}`}
                                                    className="w-full h-28 object-contain rounded-lg border border-gray-200 bg-gray-50"
                                                />
                                                {index === 0 && (
                                                    <span className="absolute left-2 top-2 rounded bg-orange-500 px-2 py-0.5 text-[11px] font-bold text-white">
                                                        Portada
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
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

            {deleteTarget && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900">Eliminar producto</h2>
                        <p className="text-sm text-gray-500 mt-2">
                            Esta accion eliminara "{deleteTarget.name}" del catalogo.
                        </p>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {restockTarget && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
                        <h2 className="text-lg font-bold text-gray-900">Reponer stock</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {restockTarget.name} tiene {restockTarget.stock} unidades actuales.
                        </p>
                        <form onSubmit={handleRestock} className="mt-5 space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700">Cantidad que ingresa</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={restockForm.quantity}
                                    onChange={(event) => setRestockForm((current) => ({ ...current, quantity: event.target.value }))}
                                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Ej: 20"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700">Motivo o proveedor</label>
                                <textarea
                                    rows={3}
                                    value={restockForm.reason}
                                    onChange={(event) => setRestockForm((current) => ({ ...current, reason: event.target.value }))}
                                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                    placeholder="Compra a proveedor, ajuste por recepcion, etc."
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setRestockTarget(null)}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={restocking}
                                    className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
                                >
                                    {restocking ? "Registrando..." : "Registrar entrada"}
                                </button>
                            </div>
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
