import { Search, ShoppingCart, Heart, User, Menu, X, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useCart } from "../../context/CartContext"
import CategoryBar from "./CategoryBar"
import CartDrawer from "../cart/CartDrawer"

const Navbar = () => {
  const [isSearchOpen, SetIsSearchOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [indicators, setIndicators] = useState({})
  const { user, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const menuRef = useRef(null)

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
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false)
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

  const formatCLP = (value) =>
    value ? `$${Number(value).toLocaleString("es-CL")}` : "..."

  return (
    <div className="fixed top-0 left-0 w-full z-50">

      {/* Barra indicadores económicos */}
      <div className="bg-gray-900 text-white text-xs py-1.5 px-4 overflow-x-auto">
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
          <span className="hidden sm:block text-gray-500 text-xs">
            Valores en CLP — fuente: mindicador.cl
          </span>
        </div>
      </div>

      {/* Barra de anuncio */}
      <div className="bg-black text-white text-xs text-center py-2 px-4">
        🚚 Despacho gratis en compras sobre $50.000 —{" "}
        <span className="font-bold text-orange-400">¡Aprovecha ahora!</span>
      </div>

      {/* Navbar principal */}
      <header className="bg-orange-600 shadow-md">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 relative">

            {/* Modo Búsqueda Móvil */}
            {isSearchOpen && (
              <div className="absolute inset-0 z-50 bg-orange-600 flex items-center px-4 sm:hidden">
                <div className="flex-1 flex items-center bg-white rounded-full overflow-hidden h-11 shadow-sm">
                  <input type="text" autoFocus placeholder="Buscar Producto..."
                    className="flex-1 px-5 text-sm outline-none text-gray-700" />
                  <button className="px-4 text-orange-600 hover:text-orange-800 transition-colors cursor-pointer">
                    <Search size={20} />
                  </button>
                </div>
                <button onClick={() => SetIsSearchOpen(false)} className="ml-3 text-white cursor-pointer p-1">
                  <X size={28} />
                </button>
              </div>
            )}

            {/* Lado Izquierdo */}
            <div className="flex items-center gap-3">
              <button className="sm:hidden text-white cursor-pointer hover:bg-orange-700 p-1 rounded-md transition">
                <Menu size={28} />
              </button>
              <Link to="/">
                <img src="/images/Logo.png" alt="Ferremas"
                  className="h-10 sm:h-12 object-contain hover:scale-105 transition" />
              </Link>
            </div>

            {/* Centro - Buscador */}
            <div className="hidden sm:flex flex-1 max-w-2xl mx-6 bg-white rounded-full overflow-hidden h-11 shadow-sm">
              <input type="text" placeholder="Buscar Productos..."
                className="flex-1 px-5 text-sm outline-none text-gray-700" />
              <button className="px-5 bg-black text-white transition-colors cursor-pointer">
                <Search size={20} />
              </button>
            </div>

            {/* Lado Derecho */}
            <div className="flex items-center gap-3">
              <button onClick={() => SetIsSearchOpen(true)}
                className="sm:hidden text-white cursor-pointer hover:opacity-80 transition p-1">
                <Search size={24} />
              </button>

              <button className="hidden sm:block text-white cursor-pointer hover:scale-110 transition p-1">
                <Heart size={24} />
              </button>

              {/* Dropdown Usuario */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
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
                  <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl w-52 py-2 z-50 border border-gray-100">
                    {!user ? (
                      <>
                        <Link to="/login" onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-orange-50 hover:text-orange-600 transition">
                          Inicia sesión
                        </Link>
                        <Link to="/register" onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-5 py-3 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition">
                          Regístrate
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="px-5 py-3 border-b border-gray-100">
                          <p className="text-xs text-gray-400">Hola,</p>
                          <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                        </div>

                        {user.role === "admin" && (
                          <>
                            <Link to="/admin/products" onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center px-5 py-3 text-sm font-semibold text-orange-600 hover:bg-orange-50 transition">
                              ⚙️ Productos
                            </Link>
                            <Link to="/admin/users" onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center px-5 py-3 text-sm font-semibold text-orange-600 hover:bg-orange-50 transition border-b border-gray-100">
                              👥 Usuarios
                            </Link>
                          </>
                        )}

                        <Link to="/perfil" onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-5 py-3 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition">
                          Mi cuenta
                        </Link>
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
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative text-white cursor-pointer hover:scale-110 transition p-1">
                <ShoppingCart size={24} />
                <span className="absolute top-0 right-0 bg-white text-orange-600 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-orange-600">
                  {itemCount}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Barra de categorías */}
      <CategoryBar />

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}

export default Navbar