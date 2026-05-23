import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import Home from "./Pages/Home/Home"
import Login from "./Pages/Login/Login"
import Register from "./Pages/Register/Register"
import RegisterPro from "./Pages/Register/RegisterPro"
import AdminProducts from "./Pages/Admin/AdminProducts"
import AdminDashboard from "./Pages/Admin/AdminDashboard"
import AdminUsers from "./Pages/Admin/AdminUsers"
import AdminCredits from "./Pages/Admin/AdminCredits"
import VendedorPanel from "./Pages/Vendedor/VendedorPanel"
import BodegueroPanel from "./Pages/Bodeguero/BodegueroPanel"
import ContadorPanel from "./Pages/Contador/ContadorPanel"
import Products from "./Pages/Products/Products"
import Checkout from "./Pages/Checkout/Checkout"
import Success from "./Pages/Checkout/Success"
import Failure from "./Pages/Checkout/Failure"
import Pending from "./Pages/Checkout/Pending"
import Welcome from "./Pages/Pro/Welcome"
import MyCredit from "./Pages/Pro/MyCredit"
import MyServices from "./Pages/Pro/MyServices"
import OrderHistory from "./Pages/Orders/OrderHistory"
import Profile from "./Pages/Profile/Profile"
import Favorites from "./Pages/Favorites/Favorites"
import ChangeInitialPassword from "./Pages/Auth/ChangeInitialPassword"
import Navbar from "./components/layout/Navbar"
import { useAuth } from "./context/AuthContext"

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

const AdminRoute = ({ children }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (user.must_change_password) return <Navigate to="/cambiar-password" />
  if (user.role !== "admin") return <Navigate to="/" />
  return children
}

const RoleRoute = ({ children, roles }) => {
  const { user } = useAuth()
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
  const { user } = useAuth()
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
    <div>
      <Navbar />
      <main className={isStaff ? "pt-20 sm:pt-24" : "pt-32 sm:pt-44 md:pt-48"}>
        {mustChangePassword && <Navigate to="/cambiar-password" replace />}
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cambiar-password" element={<ProtectedRoute><ChangeInitialPassword /></ProtectedRoute>} />
          <Route path="/register" element={<Register />} />
          <Route path="/registro-pro" element={<RegisterPro />} />
          <Route path="/pro/bienvenida" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
          <Route path="/mi-credito" element={<CustomerRoute requireAuth><MyCredit /></CustomerRoute>} />
          <Route path="/mis-servicios" element={<ProtectedRoute><MyServices /></ProtectedRoute>} />
          <Route path="/productos" element={<CustomerRoute><Products /></CustomerRoute>} />
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
          <Route path="/vendedor" element={<RoleRoute roles={["admin", "vendedor"]}><VendedorPanel /></RoleRoute>} />
          <Route path="/bodeguero" element={<RoleRoute roles={["admin", "bodeguero"]}><BodegueroPanel /></RoleRoute>} />
          <Route path="/contador" element={<RoleRoute roles={["admin", "contador"]}><ContadorPanel /></RoleRoute>} />
        </Routes>
      </main>
    </div>
  )
}

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
