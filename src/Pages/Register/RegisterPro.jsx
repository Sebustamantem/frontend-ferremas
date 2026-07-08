import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { register as registerService } from "../../api/authService"
import api from "../../api/axios"
import { useAuth } from "../../context/AuthContext"
import { Eye, EyeOff, User, Mail, Lock, Phone, CreditCard, Briefcase, Building } from "lucide-react"
import { formatRut, isRutLengthValid } from "../../utils/rut"
import { validateStrongPassword } from "../../utils/passwordValidation"

const RegisterPro = () => {
    const [searchParams] = useSearchParams()
    const [userType, setUserType] = useState(searchParams.get("type") || "maestro")
    const [form, setForm] = useState({
        name: "", lastname: "", email: "", password: "",
        rut: "", phone: "", business_name: "", profession: ""
    })
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { user, login } = useAuth()
    const navigate = useNavigate()
    const isUpgrade = Boolean(user && user.user_type === "cliente")
    const title = isUpgrade ? "Postula tu cuenta a Maestro/PYME" : "Postulacion Profesional"
    const subtitle = isUpgrade
        ? "El administrador revisara tu solicitud antes de activar FerreCredito y beneficios exclusivos"
        : "Solicita acceso a FerreCredito y beneficios exclusivos"

    useEffect(() => {
        if (!user) return
        if (user.user_type !== "cliente") {
            navigate("/pro/bienvenida")
            return
        }

        setUserType(searchParams.get("type") || "maestro")
        setForm({
            name: user.name || "",
            lastname: user.lastname || "",
            email: user.email || "",
            password: "",
            rut: user.rut || "",
            phone: user.phone?.replace(/^\+56/, "") || "",
            business_name: user.business_name || "",
            profession: user.profession || ""
        })
    }, [user, searchParams, navigate])

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleRutChange = (e) => setForm({ ...form, rut: formatRut(e.target.value) })

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 9)
        setForm({ ...form, phone: value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        if (!form.phone.startsWith("9")) {
            setError("El celular debe comenzar con 9")
            setLoading(false)
            return
        }

        if (!isRutLengthValid(form.rut)) {
            setError("Ingresa un RUT valido")
            setLoading(false)
            return
        }

        if (!user && !form.password) {
            setError("La contraseña es obligatoria para crear una cuenta")
            setLoading(false)
            return
        }

        const passwordError = form.password ? validateStrongPassword(form.password) : null
        if (passwordError) {
            setError(passwordError)
            setLoading(false)
            return
        }

        const payload = {
            ...form,
            phone: `+56${form.phone}`,
            user_type: userType,
        }

        try {
            let res
            if (user) {
                res = await api.put("/users/me", payload)
            } else {
                res = await registerService(payload)
            }
            login(res.data.user, localStorage.getItem("token") || res.data.token)
            navigate("/pro/bienvenida")
        } catch (err) {
            setError(err.response?.data?.message || "Error al registrarse")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center brand-page px-4 py-8">
            <div className="w-full max-w-lg">

                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <img src="/images/Logo.png" alt="Ferremas" className="h-20 object-contain drop-shadow-lg" />
                </div>

                {/* Card */}
                <div className="brand-card rounded-2xl shadow-xl border p-8">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">{title}</h2>
                    <p className="text-center text-gray-400 text-sm mb-6">
                        {subtitle}
                    </p>

                    {/* Selector tipo */}
                    <div className="flex gap-3 mb-6">
                        <button
                            type="button"
                            onClick={() => setUserType("maestro")}
                            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${userType === "maestro"
                                ? "brand-button-dark text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            Maestro
                        </button>
                        <button
                            type="button"
                            onClick={() => setUserType("pyme")}
                            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${userType === "pyme"
                                ? "brand-button-dark text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            PYME
                        </button>
                    </div>

                    {/* Beneficios */}
                    <div className="bg-amber-50 border border-teal-100 rounded-2xl p-4 mb-6">
                        <p className="text-xs font-bold text-teal-700 mb-2">Beneficios exclusivos:</p>
                        <ul className="text-xs text-gray-700 flex flex-col gap-1">
                            <li>30% de descuento en tu primera compra</li>
                            <li>Acceso a FerreCredito (compra a cuotas)</li>
                            <li>Publica tus servicios en Ferremas</li>
                        </ul>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm text-center py-2 px-4 rounded-xl mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                        {/* Nombre y Apellido */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-gray-500">Nombre</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" name="name" placeholder="Nombre"
                                        value={form.name} onChange={handleChange} required
                                        className="w-full border border-teal-100 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white/80" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-gray-500">Apellidos</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" name="lastname" placeholder="Apellidos"
                                        value={form.lastname} onChange={handleChange} required
                                        className="w-full border border-teal-100 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white/80" />
                                </div>
                            </div>
                        </div>

                        {/* Nombre empresa/oficio */}
                        {userType === "pyme" ? (
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-gray-500">Nombre de la empresa</label>
                                <div className="relative">
                                    <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" name="business_name" placeholder="Razón social o nombre empresa"
                                        value={form.business_name} onChange={handleChange} required
                                        className="w-full border border-teal-100 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white/80" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-gray-500">Profesión u oficio</label>
                                <div className="relative">
                                    <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" name="profession" placeholder="Ej: Gasfiter, Electricista, Albañil"
                                        value={form.profession} onChange={handleChange} required
                                        className="w-full border border-teal-100 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white/80" />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">Correo</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="email" name="email" placeholder="correo@ejemplo.com"
                                    value={form.email} onChange={handleChange} required
                                    className="w-full border border-teal-100 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white/80" />
                            </div>
                        </div>

                        {/* RUT */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">RUT</label>
                            <div className="relative">
                                <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" name="rut" placeholder="12.345.678-9"
                                    value={form.rut} onChange={handleRutChange} required
                                    maxLength={12}
                                    className="w-full border border-teal-100 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white/80" />
                            </div>
                        </div>

                        {/* Celular */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">Celular</label>
                            <div className="flex gap-2">
                                <div className="flex items-center bg-white/80 border border-teal-100 rounded-xl px-3 text-sm font-medium text-gray-600">
                                    +56
                                </div>
                                <div className="relative flex-1">
                                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" name="phone" placeholder="9XXXXXXXX"
                                        value={form.phone} onChange={handlePhoneChange} required
                                        className="w-full border border-teal-100 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white/80" />
                                </div>
                            </div>
                        </div>

                        {/* Contraseña */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">Contraseña</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type={showPassword ? "text" : "password"} name="password"
                                    placeholder="Contraseña segura"
                                    value={form.password} onChange={handleChange} required={!user}
                                    className="w-full border border-teal-100 rounded-xl pl-9 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white/80" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 px-1">Mín. 12 caracteres, mayúscula, minúscula, número, símbolo permitido y sin secuencias.</p>
                        </div>

                        <button type="submit" disabled={loading}
                            className="brand-button-dark py-3 rounded-xl font-semibold transition disabled:opacity-60 mt-1">
                            {loading
                                ? "Procesando..."
                                : isUpgrade
                                    ? "Enviar postulacion"
                                    : `Postular como ${userType === "maestro" ? "Maestro" : "PYME"}`
                            }
                        </button>
                    </form>

                </div>
            </div>
        </div>
    )
}

export default RegisterPro
