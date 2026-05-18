import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Home from "./Pages/Home/Home"
import Login from "./Pages/Login/Login"
import Register from "./Pages/Register/Register"
import RegisterPro from "./Pages/Register/RegisterPro"
import AdminProducts from "./Pages/Admin/AdminProducts"
import AdminUsers from "./Pages/Admin/AdminUsers"
import Products from "./Pages/Products/Products"
import Checkout from "./Pages/Checkout/Checkout"
import Success from "./Pages/Checkout/Success"
import Failure from "./Pages/Checkout/Failure"
import Pending from "./Pages/Checkout/Pending"
import Welcome from "./Pages/Pro/Welcome"
import Navbar from "./components/layout/Navbar"
import { useAuth } from "./context/AuthContext"

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

const AdminRoute = ({ children }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (user.role !== "admin") return <Navigate to="/" />
  return children
}

function AppContent() {
  return (
    <div>
      <Navbar />
      <main className="pt-44 md:pt-48">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/registro-pro" element={<RegisterPro />} />
          <Route path="/pro/bienvenida" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
          <Route path="/productos" element={<Products />} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/checkout/success" element={<Success />} />
          <Route path="/checkout/failure" element={<Failure />} />
          <Route path="/checkout/pending" element={<Pending />} />
          <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
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