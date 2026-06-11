import { useState } from "react"
import { Link } from "react-router-dom"
import { Mail } from "lucide-react"
import { forgotPassword } from "../../api/authService"

const ForgotPassword = () => {
    const [email, setEmail] = useState("")
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setMessage("")
        setError("")
        setLoading(true)

        try {
            const res = await forgotPassword({ email })
            setMessage(res.data.message || "Revisa tu correo para continuar")
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo solicitar la recuperación")
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
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">Recuperar contraseña</h2>
                    <p className="text-center text-gray-500 text-sm mb-6">
                        Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
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
                            <label className="text-xs font-medium text-gray-500">Correo</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="correo@ejemplo.cl"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
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
                            {loading ? "Enviando..." : "Enviar enlace"}
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

export default ForgotPassword
