import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Eye, EyeOff, Lock } from "lucide-react"
import { resetPassword } from "../../api/authService"
import { passwordRequirements, validateStrongPassword } from "../../utils/passwordValidation"

const formatApiError = (err, fallback) => {
    const data = err.response?.data || {}
    return data.code ? `${data.message || fallback} (${data.code})` : data.message || fallback
}

const ResetPassword = () => {
    const { token } = useParams()
    const navigate = useNavigate()
    const [form, setForm] = useState({ password: "", confirm: "" })
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError("")
        setMessage("")

        const passwordError = validateStrongPassword(form.password)
        if (passwordError) {
            setError(passwordError)
            return
        }

        if (form.password !== form.confirm) {
            setError("Las contraseñas no coinciden")
            return
        }

        setLoading(true)
        try {
            const res = await resetPassword(token, { password: form.password })
            setMessage(res.data.message || "Contraseña actualizada correctamente")
            setTimeout(() => navigate("/login"), 1200)
        } catch (err) {
            setError(formatApiError(err, "No se pudo cambiar la contraseña"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center brand-page px-4 py-10">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <img src="/images/Logo.png" alt="Ferremas" className="h-20 object-contain drop-shadow-lg" />
                </div>

                <div className="brand-card rounded-2xl shadow-xl border p-8">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">Nueva contraseña</h2>
                    <p className="text-center text-gray-500 text-sm mb-6">
                        Crea una contraseña segura para volver a entrar a tu cuenta.
                    </p>

                    {message && (
                        <div className="bg-teal-50 border border-teal-200 text-teal-700 text-sm text-center py-2 px-4 rounded-xl mb-4">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm text-center py-2 px-4 rounded-xl mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">Nueva contraseña</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Ingresa tu nueva contraseña"
                                    value={form.password}
                                    onChange={(event) => setForm({ ...form, password: event.target.value })}
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
                            <div className="grid grid-cols-2 gap-1 mt-2">
                                {passwordRequirements.map((req) => (
                                    <p key={req} className="text-xs text-gray-400 flex items-center gap-1">
                                        <span className="text-teal-600">•</span> {req}
                                    </p>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">Confirmar contraseña</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="confirm"
                                    placeholder="Repite tu nueva contraseña"
                                    value={form.confirm}
                                    onChange={(event) => setForm({ ...form, confirm: event.target.value })}
                                    required
                                    className="w-full border border-teal-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white/80"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="brand-button py-3 rounded-xl font-semibold transition disabled:opacity-60 mt-1"
                        >
                            {loading ? "Guardando..." : "Guardar contraseña"}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-5 text-gray-500">
                        <Link to="/login" className="font-semibold text-teal-700 hover:underline">
                            Volver al inicio de sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ResetPassword
