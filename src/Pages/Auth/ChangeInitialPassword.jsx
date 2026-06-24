import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LockKeyhole } from "lucide-react"
import api from "../../api/axios"
import { useAuth } from "../../context/AuthContext"
import { passwordRequirements, validateStrongPassword } from "../../utils/passwordValidation"

const getRoleHomePath = (role) => {
    if (role === "admin") return "/admin/products"
    if (role === "vendedor") return "/vendedor"
    if (role === "bodeguero") return "/bodeguero"
    if (role === "contador") return "/contador"
    return "/"
}

const ChangeInitialPassword = () => {
    const { user, login } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ password: "", confirm: "" })
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError("")

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
            const res = await api.put("/users/me/password", { password: form.password })
            login(res.data, localStorage.getItem("token"))
            navigate(getRoleHomePath(res.data.role), { replace: true })
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo cambiar la contraseña")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen brand-page flex items-center justify-center px-4 py-10">
            <div className="brand-card rounded-2xl border shadow-xl w-full max-w-md p-8">
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-5">
                    <LockKeyhole size={24} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Cambia tu contraseña inicial</h1>
                <p className="text-sm text-gray-500 mt-2">
                    {user?.name}, por seguridad debes reemplazar la contraseña temporal antes de entrar al panel.
                </p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mt-5">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <label className="block">
                        <span className="text-sm text-gray-600">Nueva contraseña</span>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="mt-2 w-full rounded-xl border border-teal-100 bg-white/80 px-4 py-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                            required
                        />
                        <div className="grid grid-cols-2 gap-1 mt-2">
                            {passwordRequirements.map((req) => (
                                <p key={req} className="text-xs text-gray-400 flex items-center gap-1">
                                    <span className="text-teal-600">•</span> {req}
                                </p>
                            ))}
                        </div>
                    </label>
                    <label className="block">
                        <span className="text-sm text-gray-600">Confirmar contraseña</span>
                        <input
                            type="password"
                            value={form.confirm}
                            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                            className="mt-2 w-full rounded-xl border border-teal-100 bg-white/80 px-4 py-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                            required
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full brand-button-dark disabled:opacity-60 py-3 rounded-xl font-semibold transition"
                    >
                        {loading ? "Guardando..." : "Guardar nueva contraseña"}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default ChangeInitialPassword
