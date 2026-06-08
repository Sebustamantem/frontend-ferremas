import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { register as registerService } from "../../api/authService"
import { useAuth } from "../../context/AuthContext"
import { Eye, EyeOff, User, Mail, Lock, Phone, CreditCard } from "lucide-react"
import { formatRut, isRutLengthValid } from "../../utils/rut"

const Register = () => {
    const [form, setForm] = useState({
        name: "", lastname: "", email: "", password: "", rut: "", phone: ""
    })
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleRutChange = (e) => {
        const formatted = formatRut(e.target.value)
        setForm({ ...form, rut: formatted })
    }

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 9)
        setForm({ ...form, phone: value })
    }

    const validatePassword = (password) => {
        if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres"
        if (!/[A-Z]/.test(password)) return "Debe tener al menos una mayúscula"
        if (!/[a-z]/.test(password)) return "Debe tener al menos una minúscula"
        if (!/[0-9]/.test(password)) return "Debe tener al menos un número"
        if (/[\s¡¿`~çñÑ]/.test(password)) return "No usar espacios ni caracteres especiales (¡¿`~çñÑ)"
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        if (!form.phone.startsWith("9"))
            return setError("El celular debe comenzar con 9"), setLoading(false)

        if (!isRutLengthValid(form.rut))
            return setError("Ingresa un RUT valido"), setLoading(false)

        const passwordError = validatePassword(form.password)
        if (passwordError) {
            setError(passwordError)
            setLoading(false)
            return
        }

        try {
            const res = await registerService({
                ...form,
                phone: `+56${form.phone}`
            })
            login(res.data.user, res.data.token)
            navigate("/")
        } catch (err) {
            setError(err.response?.data?.message || "Error al registrarse")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center brand-page px-4 py-10">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <img src="/images/Logo.png" alt="Ferremas" className="h-20 object-contain drop-shadow-lg" />
                </div>

                {/* Card */}
                <div className="brand-card rounded-2xl shadow-xl border p-8">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">Crear Cuenta</h2>
                    <p className="text-center text-gray-400 text-sm mb-6">Regístrate para comenzar a comprar</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm text-center py-2 px-4 rounded-xl mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                        {/* Correo */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">Correo</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="email" name="email" placeholder="Ingresa un correo"
                                    value={form.email} onChange={handleChange} required
                                    className="w-full border border-teal-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white/80" />
                            </div>
                        </div>

                        {/* Nombre */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">Nombre</label>
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" name="name" placeholder="Ingresa un nombre"
                                    value={form.name} onChange={handleChange} required
                                    className="w-full border border-teal-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white/80" />
                            </div>
                        </div>

                        {/* Apellidos */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">Apellidos</label>
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" name="lastname" placeholder="Ingresa apellidos"
                                    value={form.lastname} onChange={handleChange} required
                                    className="w-full border border-teal-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white/80" />
                            </div>
                        </div>

                        {/* RUT */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">Tipo de documento</label>
                            <div className="flex gap-2">
                                <div className="flex items-center bg-white/80 border border-teal-100 rounded-xl px-3 text-sm font-medium text-gray-600">
                                    RUT
                                </div>
                                <div className="relative flex-1">
                                    <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" name="rut" placeholder="Ingresa un documento de identidad"
                                        value={form.rut} onChange={handleRutChange} required
                                        maxLength={12}
                                        className="w-full border border-teal-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white/80" />
                                </div>
                            </div>
                        </div>

                        {/* Celular */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">Celular</label>
                            <div className="flex gap-2">
                                <div className="flex items-center bg-white/80 border border-teal-100 rounded-xl px-3 text-sm font-medium text-gray-600 whitespace-nowrap">
                                    +56
                                </div>
                                <div className="relative flex-1">
                                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" name="phone" placeholder="Ingresa un celular"
                                        value={form.phone} onChange={handlePhoneChange} required
                                        className="w-full border border-teal-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white/80" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 px-1">Comienza con 9.</p>
                        </div>

                        {/* Contraseña */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">Contraseña</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type={showPassword ? "text" : "password"} name="password"
                                    placeholder="Ingresa una contraseña"
                                    value={form.password} onChange={handleChange} required
                                    className="w-full border border-teal-100 rounded-xl pl-11 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white/80" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-1 mt-1">
                                {[
                                    "Mín. 8 caracteres", "1 número", "1 mayúscula",
                                    "1 minúscula", "Sin espacio", "Sin usar \\¡¿`~çñÑ"
                                ].map((req) => (
                                    <p key={req} className="text-xs text-gray-400 flex items-center gap-1">
                                        <span className="text-teal-600">•</span> {req}
                                    </p>
                                ))}
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="brand-button py-3 rounded-xl font-semibold transition disabled:opacity-60 mt-1">
                            {loading ? "Registrando..." : "Registrarse"}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-5 text-gray-500">
                        ¿Ya tienes cuenta?{" "}
                        <Link to="/login" className="font-semibold text-teal-700 hover:underline">
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Register
