import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { login as loginService } from "../../api/authService"
import { useAuth } from "../../context/AuthContext"

const Login = () => {
    const [form, setForm] = useState({ email: "", password: "" })
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        try {
            const res = await loginService(form)
            login(res.data.user, res.data.token)
            navigate("/")
        } catch (err) {
            setError(err.response?.data?.message || "Error al iniciar sesión")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>
                {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="email"
                        name="email"
                        placeholder="Correo electrónico"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Contraseña"
                        value={form.password}
                        onChange={handleChange}
                        required
                        className="border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition"
                    >
                        {loading ? "Cargando..." : "Iniciar Sesión"}
                    </button>
                </form>
                <p className="text-center text-sm mt-4">
                    ¿No tienes cuenta?{" "}
                    <Link to="/register" className="font-semibold text-orange-500 underline">Regístrate</Link>
                </p>

                <p className="text-center text-sm mt-3 text-gray-500">
                    ¿Eres maestro o PYME?{" "}
                    <Link to="/registro-pro" className="font-semibold text-gray-700 hover:underline">
                        Regístrate aquí
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Login