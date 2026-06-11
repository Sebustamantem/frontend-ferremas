import { Bell, Search, ShoppingCart, Heart, User, Menu, X, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useCart } from "../../context/CartContext"
import CategoryBar from "./CategoryBar"
import CartDrawer from "../cart/CartDrawer"
import api from "../../api/axios"

const Navbar = () => {
  const [isSearchOpen, SetIsSearchOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [indicators, setIndicators] = useState({})
  const [searchTerm, setSearchTerm] = useState("")
  const [products, setProducts] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [notifications, setNotifications] = useState({ total: 0, items: [], counts: {} })
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isClearingNotifications, setIsClearingNotifications] = useState(false)
  const { user, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const notificationsRef = useRef(null)
  const isStaff = ["admin", "vendedor", "bodeguero", "contador"].includes(user?.role)
  const isProfessional = ["maestro", "pyme"].includes(user?.user_type) || ["maestro", "pyme"].includes(user?.role)
  const isStoreUser = Boolean(user) && !isStaff
  const roleHomePath = user?.role === "admin"
    ? "/admin/dashboard"
    : user?.role === "vendedor"
      ? "/vendedor"
      : user?.role === "bodeguero"
        ? "/bodeguero"
        : user?.role === "contador"
          ? "/contador"
          : "/"

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const res = await fetch("https://mindicador.cl/api")
        const data = await res.json()
        setIndicators({
          dolar: data.dolar?.valor,
          euro: data.euro?.valor,
          uf: data.uf?.valor,
          utm: data.utm?.valor,
        })
      } catch (err) {
        console.error("Error cargando indicadores:", err)
      }
    }
    fetchIndicators()
  }, [])

  useEffect(() => {
    if (isStaff) return
    api.get("/products")
      .then((res) => setProducts(res.data || []))
      .catch(() => setProducts([]))
  }, [isStaff])

  useEffect(() => {
    if (user?.role !== "admin") return
    let active = true
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/staff/admin/notifications")
        if (active) setNotifications(res.data || { total: 0, items: [], counts: {} })
      } catch {
        if (active) setNotifications({ total: 0, items: [], counts: {} })
      }
    }
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 45000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [user?.role])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setIsNotificationsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    navigate("/")
  }

  const handleClearNotifications = async () => {
    if (!notifications.total || isClearingNotifications) return
    setIsClearingNotifications(true)
    try {
      await api.post("/staff/admin/notifications/clear")
      setNotifications({
        total: 0,
        items: [],
        counts: {
          stock_reports: 0,
          credit_applications: 0,
          pending_orders: 0,
          transfer_pending: 0,
          out_of_stock: 0,
        },
      })
    } catch (err) {
      console.error("Error vaciando notificaciones:", err)
    } finally {
      setIsClearingNotifications(false)
    }
  }

  const handleSearch = (event) => {
    event.preventDefault()
    const query = searchTerm.trim()
    if (!query) {
      navigate("/productos")
      SetIsSearchOpen(false)
      return
    }
    navigate(`/productos?buscar=${encodeURIComponent(query)}`)
    setShowSuggestions(false)
    SetIsSearchOpen(false)
  }

  const suggestions = searchTerm.trim()
    ? products
      .filter((product) => {
        const query = searchTerm.trim().toLowerCase()
        return product.name?.toLowerCase().includes(query)
          || product.category?.toLowerCase().includes(query)
          || product.description?.toLowerCase().includes(query)
      })
      .slice(0, 6)
    : []

  const handleSuggestionClick = (productId) => {
    setShowSuggestions(false)
    SetIsSearchOpen(false)
    navigate(`/productos/${productId}`)
  }

  const SearchSuggestions = ({ mobile = false }) => {
    if (!showSuggestions || !searchTerm.trim()) return null

    return (
      <div className={`${mobile ? "absolute left-4 right-14 top-14" : "absolute left-0 right-0 top-12"} bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[70]`}>
        {suggestions.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-500">No hay productos sugeridos</div>
        ) : (
          <>
            {suggestions.map((product) => (
              <button
                key={product.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSuggestionClick(product.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-orange-50 transition"
              >
                <div className="w-11 h-11 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-1.5" />
                  ) : (
                    <Search size={17} className="text-gray-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500 truncate">{product.category || "Producto"} · ${Number(product.price || 0).toLocaleString("es-CL")}</p>
                </div>
              </button>
            ))}
            <button
              type="submit"
              className="w-full px-4 py-3 text-left text-sm font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 transition"
            >
              Ver todos los resultados para "{searchTerm.trim()}"
            </button>
          </>
        )}
      </div>
    )
  }

  const formatCLP = (value) =>
    value ? `$${Number(value).toLocaleString("es-CL")}` : "..."

  return (
    <div className="fixed top-0 left-0 w-full z-50 brand-gradient-x">

      {/* Barra indicadores económicos */}
      {!isStaff && (
        <>
      <div className="hidden sm:block bg-teal-950 text-white text-xs py-1.5 px-4 overflow-x-auto">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-6 whitespace-nowrap">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <span className="text-gray-400">USD</span>
              <span className="font-semibold text-green-400">{formatCLP(indicators.dolar)}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-gray-400">EUR</span>
              <span className="font-semibold text-blue-400">{formatCLP(indicators.euro)}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-gray-400">UF</span>
              <span className="font-semibold text-yellow-400">{formatCLP(indicators.uf)}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-gray-400">UTM</span>
              <span className="font-semibold text-orange-400">{formatCLP(indicators.utm)}</span>
            </span>
          </div>
          <span className="hidden sm:block text-gray-300 text-xs">
            Valores en CLP — fuente: mindicador.cl
          </span>
        </div>
      </div>

      {/* Barra de anuncio */}
      <div className="bg-transparent text-white text-[11px] sm:text-xs text-center py-1.5 sm:py-2 px-3 sm:px-4">
        🚚 Despacho gratis en compras sobre $50.000 —{" "}
        <span className="font-bold text-white">¡Aprovecha ahora!</span>
      </div>
        </>
      )}

      {/* Navbar principal */}
      <header className="bg-transparent">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 relative">

            {/* Modo Búsqueda Móvil */}
            {!isStaff && isSearchOpen && (
              <form onSubmit={handleSearch} className="absolute inset-0 z-50 brand-gradient-x flex items-center px-4 sm:hidden">
                <div className="flex-1 flex items-center bg-white rounded-full overflow-hidden h-11 shadow-sm">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Buscar Producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                    className="flex-1 px-5 text-sm outline-none text-gray-700" />
                  <button type="submit" aria-label="Buscar productos" className="px-4 text-orange-700 hover:text-orange-800 transition-colors cursor-pointer">
                    <Search size={20} />
                  </button>
                </div>
                <SearchSuggestions mobile />
                <button type="button" onClick={() => SetIsSearchOpen(false)} aria-label="Cerrar buscador" className="ml-3 text-white cursor-pointer p-1">
                  <X size={28} />
                </button>
              </form>
            )}

            {/* Lado Izquierdo */}
            <div className="flex items-center gap-3">
              <button type="button" aria-label="Abrir menu de categorias" className={`${isStaff ? "hidden" : "sm:hidden"} text-white cursor-pointer hover:bg-white/15 p-1 rounded-md transition`}>
                <Menu size={28} />
              </button>
              <Link to={roleHomePath}>
                <img src="/images/Logo.png" alt="Ferremas"
                  className="h-8 sm:h-12 object-contain hover:scale-105 transition" />
              </Link>
            </div>

            {/* Centro - Buscador */}
            <form onSubmit={handleSearch} className={`${isStaff ? "hidden" : "hidden sm:flex"} relative flex-1 max-w-2xl mx-6 bg-white rounded-full h-11 shadow-sm`}>
              <input
                type="text"
                placeholder="Buscar Productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                className="flex-1 px-5 text-sm outline-none text-gray-700 rounded-l-full" />
              <button type="submit" aria-label="Buscar productos" className="px-5 bg-black text-white transition-colors cursor-pointer rounded-r-full">
                <Search size={20} />
              </button>
              <SearchSuggestions />
            </form>

            {/* Lado Derecho */}
            <div className="flex items-center gap-3">
              {!isStaff && <button type="button" onClick={() => SetIsSearchOpen(true)} aria-label="Abrir buscador"
                className="sm:hidden text-white cursor-pointer hover:opacity-80 transition p-1">
                <Search size={24} />
              </button>}

              {!isStaff && <button type="button" onClick={() => user ? navigate("/favoritos") : navigate("/login")} aria-label="Ver favoritos" className="hidden sm:block text-white cursor-pointer hover:scale-110 transition p-1">
                <Heart size={24} />
              </button>}

              {user?.role === "admin" && (
                <div className="relative" ref={notificationsRef}>
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen((value) => !value)}
                    aria-label={`Abrir notificaciones, ${notifications.total || 0} pendientes`}
                    aria-expanded={isNotificationsOpen}
                    className="relative text-white cursor-pointer hover:bg-white/15 rounded-lg transition p-2"
                  >
                    <Bell size={22} />
                    {notifications.total > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-bold flex items-center justify-center">
                        {notifications.total > 99 ? "99+" : notifications.total}
                      </span>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl w-[min(22rem,calc(100vw-1.5rem))] z-50 border border-gray-100 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-gray-900">Notificaciones internas</p>
                          <p className="text-xs text-gray-500">{notifications.total || 0} pendientes por revisar</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearNotifications}
                          disabled={!notifications.total || isClearingNotifications}
                          className="shrink-0 rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-white transition"
                        >
                          {isClearingNotifications ? "Vaciando..." : "Vaciar"}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 p-3 border-b border-gray-100 bg-gray-50">
                        <NotificationCount label="Bodega" value={notifications.counts?.stock_reports} />
                        <NotificationCount label="Creditos" value={notifications.counts?.credit_applications} />
                        <NotificationCount label="Pedidos" value={notifications.counts?.pending_orders} />
                        <NotificationCount label="Agotados" value={notifications.counts?.out_of_stock} />
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.items?.length ? notifications.items.map((item, index) => (
                          <button
                            key={`${item.type}-${index}`}
                            type="button"
                            onClick={() => {
                              setIsNotificationsOpen(false)
                              navigate(item.target || "/admin/dashboard")
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-orange-50 transition border-b border-gray-50 last:border-0"
                          >
                            <p className="text-xs font-semibold text-orange-700">{item.label}</p>
                            <p className="text-sm text-gray-800 truncate">{item.text}</p>
                          </button>
                        )) : (
                          <div className="px-4 py-8 text-center text-sm text-gray-400">
                            No hay pendientes.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dropdown Usuario */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-label={user ? "Abrir menu de usuario" : "Abrir opciones de ingreso"}
                  aria-expanded={isUserMenuOpen}
                  className="flex items-center gap-1 text-white cursor-pointer hover:opacity-80 transition p-1"
                >
                  <User size={24} />
                  {user ? (
                    <>
                      <span className="hidden sm:block text-sm font-semibold max-w-[80px] truncate">
                        {user.name.split(" ")[0]}
                      </span>
                      <ChevronDown size={14} />
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:block text-sm font-semibold">Hola, Ingresa</span>
                      <ChevronDown size={14} className="hidden sm:block" />
                    </>
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-11 sm:top-12 bg-white rounded-2xl shadow-xl w-[min(14rem,calc(100vw-1.5rem))] py-2 z-50 border border-gray-100">
                    {!user ? (
                      <>
                        <Link to="/login" onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-orange-50 hover:text-orange-700 transition">
                          Inicia sesión
                        </Link>
                        <Link to="/register" onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-5 py-3 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-700 transition">
                          Regístrate
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="px-5 py-3 border-b border-gray-100">
                          <p className="text-xs text-gray-500">Hola,</p>
                          <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                          {["maestro", "pyme"].includes(user.user_type) && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                              {user.user_type === "maestro" ? "Maestro" : "PYME"}
                            </span>
                          )}
                        </div>

                        {/* Link Admin */}
                        {user.role === "admin" && (
                          <Link to="/admin/dashboard" onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-5 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-50 transition border-b border-gray-100">
                            Panel admin
                          </Link>
                        )}

                        {/* Links Admin */}
                        {false && user.role === "admin" && (
                          <>
                            <Link to="/admin/products" onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center px-5 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-50 transition">
                              Productos
                            </Link>
                            <Link to="/admin/users" onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center px-5 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-50 transition">
                              Usuarios
                            </Link>
                            <Link to="/admin/credits" onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center px-5 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-50 transition border-b border-gray-100">
                              FerreCredito
                            </Link>
                          </>
                        )}

                        {/* Links Maestro/PYME */}
                        {isProfessional && (
                          <Link to="/mi-credito" onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-5 py-3 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-700 transition">
                            Mi FerreCredito
                          </Link>
                        )}

                        <Link to="/mis-pedidos" onClick={() => setIsUserMenuOpen(false)}
                          className={`${!isStoreUser ? "hidden" : "flex"} items-center px-5 py-3 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-700 transition`}>
                          Mis pedidos
                        </Link>

                        <Link to="/perfil" onClick={() => setIsUserMenuOpen(false)}
                          className={`${!isStoreUser || isProfessional ? "hidden" : "flex"} items-center px-5 py-3 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-700 transition border-b border-gray-100`}>
                          Mi cuenta
                        </Link>

                        {isProfessional && (
                          <Link to="/mis-servicios" onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-5 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-50 transition border-b border-gray-100">
                            Panel profesional
                          </Link>
                        )}

                          {/* Links Vendedor */}
                          {user.role === "vendedor" && (
                            <Link to="/vendedor" onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center px-5 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition border-b border-gray-100">
                              Panel Vendedor
                            </Link>
                          )}

                          {/* Links Bodeguero */}
                          {user.role === "bodeguero" && (
                            <Link to="/bodeguero" onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center px-5 py-3 text-sm font-semibold text-green-600 hover:bg-green-50 transition border-b border-gray-100">
                              Panel Bodeguero
                            </Link>
                          )}

                          {user.role === "contador" && (
                            <Link to="/contador" onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center px-5 py-3 text-sm font-semibold text-yellow-700 hover:bg-yellow-50 transition border-b border-gray-100">
                              Panel Contador
                            </Link>
                          )}

                        <button onClick={handleLogout}
                          className="w-full text-left px-5 py-3 text-sm text-red-500 hover:bg-red-50 transition">
                          Cerrar sesión
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Carrito */}
              {!isStaff && <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                aria-label={`Abrir carrito, ${itemCount} productos`}
                className="relative text-white cursor-pointer hover:scale-110 transition p-1">
                <ShoppingCart size={24} />
                <span className="absolute top-0 right-0 bg-white text-orange-700 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-orange-700">
                  {itemCount}
                </span>
              </button>}
            </div>
          </div>
        </div>
      </header>

      {/* Barra de categorías */}
      {!isStaff && <CategoryBar />}

      {/* Cart Drawer */}
      {!isStaff && <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
    </div>
  )
}

const NotificationCount = ({ label, value = 0 }) => (
  <div className="rounded-lg bg-white border border-gray-100 px-3 py-2">
    <p className="text-[11px] text-gray-500">{label}</p>
    <p className="text-sm font-bold text-gray-900">{Number(value || 0)}</p>
  </div>
)

export default Navbar
