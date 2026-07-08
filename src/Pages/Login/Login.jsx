import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"
import { login as loginService } from "../../api/authService"
import { useAuth } from "../../context/AuthContext"

const Login = () => {
    const [form, setForm] = useState({ email: "", password: "" })
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleChange = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value })
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setLoading(true)
        setError("")
        try {
            const res = await loginService(form)
            login(res.data.user, res.data.token)
            navigate("/")
        } catch (err) {
            setError(err.response?.data?.message || "Error al iniciar sesion")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center brand-page px-4 py-8">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <img src="/images/Logo.png" alt="Ferremas" className="h-20 object-contain drop-shadow-lg" />
                </div>

                <div className="brand-card rounded-2xl shadow-xl border p-8">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">Iniciar Sesion</h2>
                    <p className="text-center text-gray-500 text-sm mb-6">
                        Entra para comprar, revisar pedidos y usar tus beneficios.
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm text-center py-2 px-4 rounded-xl mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">Correo o usuario</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="email"
                                    placeholder="Correo o usuario"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-teal-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white/80"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-3">
                                <label className="text-xs font-medium text-gray-500">Contraseña</label>
                                <Link to="/olvide-password" className="text-xs font-semibold text-teal-700 hover:underline">
                                    Olvidé mi contraseña
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Ingresa tu contraseña"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-teal-100 rounded-xl pl-11 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white/80"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="brand-button py-3 rounded-xl font-semibold transition disabled:opacity-60 mt-1"
                        >
                            {loading ? "Cargando..." : "Iniciar Sesion"}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-5 text-gray-500">
                        No tienes cuenta?{" "}
                        <Link to="/register" className="font-semibold text-teal-700 hover:underline">
                            Registrate
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
