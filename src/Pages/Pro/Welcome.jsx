import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { CheckCircle, CreditCard, Briefcase, Star } from "lucide-react"

const Welcome = () => {
    const { user } = useAuth()
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
                <div className="flex justify-center mb-6">
                    <CheckCircle size={64} className="text-orange-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Bienvenido, {user?.name}
                </h1>
                <p className="text-gray-400 text-sm mb-6">
                    Tu postulacion {user?.user_type?.includes("pyme") ? "PYME" : "de Maestro"} fue enviada y quedo pendiente de aprobacion.
                </p>

                <div className="flex flex-col gap-3 mb-8">
                    <div className="flex items-center gap-3 bg-orange-50 rounded-xl p-4 text-left">
                        <Star size={20} className="text-orange-500 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Beneficios Maestro/PYME</p>
                            <p className="text-xs text-gray-400">Se activan cuando el admin aprueba tu postulacion</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 text-left">
                        <CreditCard size={20} className="text-gray-700 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-gray-800">FerreCredito en revision</p>
                            <p className="text-xs text-gray-400">El admin decide si aprueba o rechaza tu solicitud</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 text-left">
                        <Briefcase size={20} className="text-gray-700 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Datos recibidos</p>
                            <p className="text-xs text-gray-400">FERREMAS revisara tu informacion profesional</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => navigate("/")}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition"
                >
                    Ir a la tienda
                </button>
            </div>
        </div>
    )
}

export default Welcome
