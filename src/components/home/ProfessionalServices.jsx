import { useEffect, useState } from "react"
import { Briefcase, MapPin, Phone } from "lucide-react"
import { useNavigate } from "react-router-dom"
import api from "../../api/axios"
import { useAuth } from "../../context/AuthContext"

const ProfessionalServices = () => {
    const [services, setServices] = useState([])
    const { user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        api.get("/services")
            .then((res) => setServices(res.data.slice(0, 6)))
            .catch(() => setServices([]))
    }, [])

    const handleContact = async (serviceId) => {
        if (!user) {
            navigate("/login")
            return
        }
        try {
            await api.post(`/services/${serviceId}/contact`)
            alert("Solicitud registrada. FERREMAS debe enviar el correo de contacto al cliente y al maestro/PYME.")
        } catch (err) {
            alert(err.response?.data?.message || "No se pudo solicitar el servicio")
        }
    }

    if (services.length === 0) return null

    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Servicios de Maestros y PYMEs</h2>
                    <p className="text-gray-400 text-sm mt-1">Contacta profesionales aprobados por FERREMAS</p>
                </div>
                {["maestro", "pyme"].includes(user?.user_type) && (
                    <button
                        onClick={() => navigate("/mis-servicios")}
                        className="text-orange-500 text-sm font-semibold hover:underline"
                    >
                        Publicar servicio
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                    <article key={service.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                            <Briefcase size={20} />
                        </div>
                        <p className="text-xs text-orange-500 font-semibold">{service.category || "Servicio"}</p>
                        <h3 className="text-lg font-bold text-gray-900 mt-1">{service.title}</h3>
                        <p className="text-sm text-gray-500 mt-2 line-clamp-3">{service.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-4">
                            {service.city && <span className="inline-flex items-center gap-1"><MapPin size={13} />{service.city}</span>}
                            {service.phone && <span className="inline-flex items-center gap-1"><Phone size={13} />{service.phone}</span>}
                        </div>
                        <button
                            onClick={() => handleContact(service.id)}
                            className="w-full mt-5 bg-gray-900 text-white rounded-xl py-3 text-sm font-semibold hover:bg-gray-800 transition"
                        >
                            Solicitar contacto $5.000
                        </button>
                    </article>
                ))}
            </div>
        </section>
    )
}

export default ProfessionalServices
