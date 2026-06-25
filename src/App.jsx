import { lazy, Suspense } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import Navbar from "./components/layout/Navbar"
import Footer from "./components/layout/Footer"
import { useAuth } from "./context/AuthContext"

const Home = lazy(() => import("./Pages/Home/Home"))
const Login = lazy(() => import("./Pages/Login/Login"))
const Register = lazy(() => import("./Pages/Register/Register"))
const RegisterPro = lazy(() => import("./Pages/Register/RegisterPro"))
const AdminProducts = lazy(() => import("./Pages/Admin/AdminProducts"))
const AdminDashboard = lazy(() => import("./Pages/Admin/AdminDashboard"))
const AdminUsers = lazy(() => import("./Pages/Admin/AdminUsers"))
const AdminCredits = lazy(() => import("./Pages/Admin/AdminCredits"))
const VendedorPanel = lazy(() => import("./Pages/Vendedor/VendedorPanel"))
const BodegueroPanel = lazy(() => import("./Pages/Bodeguero/BodegueroPanel"))
const ContadorPanel = lazy(() => import("./Pages/Contador/ContadorPanel"))
const Products = lazy(() => import("./Pages/Products/Products"))
const ProductDetail = lazy(() => import("./Pages/Products/ProductDetail"))
const Checkout = lazy(() => import("./Pages/Checkout/Checkout"))
const Success = lazy(() => import("./Pages/Checkout/Success"))
const Failure = lazy(() => import("./Pages/Checkout/Failure"))
const Pending = lazy(() => import("./Pages/Checkout/Pending"))
const Welcome = lazy(() => import("./Pages/Pro/Welcome"))
const MyCredit = lazy(() => import("./Pages/Pro/MyCredit"))
const MyServices = lazy(() => import("./Pages/Pro/MyServices"))
const OrderHistory = lazy(() => import("./Pages/Orders/OrderHistory"))
const Profile = lazy(() => import("./Pages/Profile/Profile"))
const Favorites = lazy(() => import("./Pages/Favorites/Favorites"))
const ChangeInitialPassword = lazy(() => import("./Pages/Auth/ChangeInitialPassword"))
const ForgotPassword = lazy(() => import("./Pages/Auth/ForgotPassword"))
const ResetPassword = lazy(() => import("./Pages/Auth/ResetPassword"))

const ProtectedRoute = ({ children }) => {
  const { user, authLoading } = useAuth()
  if (authLoading) return <RouteLoader />
  return user ? children : <Navigate to="/login" />
}

const AdminRoute = ({ children }) => {
  const { user, authLoading } = useAuth()
  if (authLoading) return <RouteLoader />
  if (!user) return <Navigate to="/login" />
  if (user.must_change_password) return <Navigate to="/cambiar-password" />
  if (user.role !== "admin") return <Navigate to="/" />
  return children
}

const RoleRoute = ({ children, roles }) => {
  const { user, authLoading } = useAuth()
  if (authLoading) return <RouteLoader />
  if (!user) return <Navigate to="/login" />
  if (user.must_change_password) return <Navigate to="/cambiar-password" />
  if (!roles.includes(user.role)) return <Navigate to="/" />
  return children
}

const getRoleHomePath = (role) => {
  if (role === "admin") return "/admin/dashboard"
  if (role === "vendedor") return "/vendedor"
  if (role === "bodeguero") return "/bodeguero"
  if (role === "contador") return "/contador"
  return null
}

const HomeRoute = () => {
  const { user } = useAuth()
  const roleHomePath = getRoleHomePath(user?.role)
  return roleHomePath ? <Navigate to={roleHomePath} /> : <Home />
}

const CustomerRoute = ({ children, requireAuth = false }) => {
  const { user, authLoading } = useAuth()
  if (authLoading) return <RouteLoader />
  const roleHomePath = getRoleHomePath(user?.role)
  if (roleHomePath) return <Navigate to={roleHomePath} />
  if (requireAuth && !user) return <Navigate to="/login" />
  return children
}

function AppContent() {
  const { user } = useAuth()
  const location = useLocation()
  const isStaff = ["admin", "vendedor", "bodeguero", "contador"].includes(user?.role)
  const mustChangePassword = user?.must_change_password && location.pathname !== "/cambiar-password"

  return (
    <div className="min-h-screen brand-page">
      <Navbar />
      <main className={isStaff ? "pt-20 sm:pt-24" : "pt-32 sm:pt-44 md:pt-48"}>
        {mustChangePassword && <Navigate to="/cambiar-password" replace />}
        <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/olvide-password" element={<ForgotPassword />} />
          <Route path="/recuperar-password/:token" element={<ResetPassword />} />
          <Route path="/cambiar-password" element={<ProtectedRoute><ChangeInitialPassword /></ProtectedRoute>} />
          <Route path="/register" element={<Register />} />
          <Route path="/registro-pro" element={<RegisterPro />} />
          <Route path="/pro/bienvenida" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
          <Route path="/mi-credito" element={<CustomerRoute requireAuth><MyCredit /></CustomerRoute>} />
          <Route path="/mis-servicios" element={<ProtectedRoute><MyServices /></ProtectedRoute>} />
          <Route path="/productos" element={<CustomerRoute><Products /></CustomerRoute>} />
          <Route path="/productos/:id" element={<CustomerRoute><ProductDetail /></CustomerRoute>} />
          <Route path="/checkout" element={<CustomerRoute requireAuth><Checkout /></CustomerRoute>} />
          <Route path="/checkout/success" element={<Success />} />
          <Route path="/checkout/failure" element={<Failure />} />
          <Route path="/checkout/pending" element={<Pending />} />
          <Route path="/mis-pedidos" element={<CustomerRoute requireAuth><OrderHistory /></CustomerRoute>} />
          <Route path="/favoritos" element={<CustomerRoute requireAuth><Favorites /></CustomerRoute>} />
          <Route path="/perfil" element={<CustomerRoute requireAuth><Profile /></CustomerRoute>} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/credits" element={<AdminRoute><AdminCredits /></AdminRoute>} />
          <Route path="/vendedor" element={<RoleRoute roles={["vendedor"]}><VendedorPanel /></RoleRoute>} />
          <Route path="/bodeguero" element={<RoleRoute roles={["bodeguero"]}><BodegueroPanel /></RoleRoute>} />
          <Route path="/contador" element={<RoleRoute roles={["contador"]}><ContadorPanel /></RoleRoute>} />
        </Routes>
        </Suspense>
      </main>
      {!isStaff && <Footer />}
    </div>
  )
}

const RouteLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
