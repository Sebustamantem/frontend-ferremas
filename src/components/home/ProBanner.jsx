import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { Hammer, Building, ChevronRight, Star, CreditCard, Briefcase } from "lucide-react"

const ProBanner = () => {
    const { user } = useAuth()
    const navigate = useNavigate()

    if (user?.user_type === "maestro" || user?.user_type === "pyme") return null

    if (["maestro_pending", "pyme_pending"].includes(user?.user_type)) {
        return (
            <section className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl sm:rounded-3xl p-5 sm:p-6">
                    <p className="text-sm font-bold text-yellow-800">Postulacion FerreCredito en revision</p>
                    <p className="text-sm text-yellow-700 mt-1">
                        El administrador debe aprobar tu solicitud antes de activar los beneficios Maestro/PYME.
                    </p>
                </div>
            </section>
        )
    }

    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="bg-gray-900 rounded-xl sm:rounded-3xl p-5 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">

                {/* Lado izquierdo */}
                <div className="flex flex-col gap-4 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            NUEVO
                        </span>
                        <span className="text-gray-400 text-sm">Para profesionales</span>
                    </div>

                    <h2 className="text-xl sm:text-3xl font-bold text-white">
                        ¿Eres Maestro o tienes una PYME?
                    </h2>
                    <p className="text-gray-400 text-sm max-w-lg">
                        Accede a beneficios exclusivos diseñados para profesionales de la construcción y mejoras del hogar.
                    </p>

                    {/* Beneficios */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-2">
                        <div className="flex items-center gap-2 text-white">
                            <Star size={16} className="text-orange-400 shrink-0" />
                            <span className="text-sm">30% dcto. primera compra</span>
                        </div>
                        <div className="flex items-center gap-2 text-white">
                            <CreditCard size={16} className="text-orange-400 shrink-0" />
                            <span className="text-sm">FerreCredito a cuotas</span>
                        </div>
                        <div className="flex items-center gap-2 text-white">
                            <Briefcase size={16} className="text-orange-400 shrink-0" />
                            <span className="text-sm">Publica tus servicios</span>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        <button
                            onClick={() => navigate("/registro-pro?type=maestro")}
                            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition"
                        >
                            <Hammer size={18} />
                            Soy Maestro
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={() => navigate("/registro-pro?type=pyme")}
                            className="flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-xl font-semibold transition"
                        >
                            <Building size={18} />
                            Tengo una PYME
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>


            </div>
        </section>
    )
}

export default ProBanner
