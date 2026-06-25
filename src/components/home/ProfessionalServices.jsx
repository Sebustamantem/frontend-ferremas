import { useEffect, useState } from "react"
import { Briefcase, Mail, MapPin, Phone, ShoppingBag } from "lucide-react"
import { useNavigate } from "react-router-dom"
import api from "../../api/axios"
import { useAuth } from "../../context/AuthContext"
import { useCart } from "../../context/CartContext"

const ProfessionalServices = () => {
    const [services, setServices] = useState([])
    const [notice, setNotice] = useState(null)
    const { user } = useAuth()
    const { addServiceToCart } = useCart()
    const navigate = useNavigate()

    useEffect(() => {
        api.get("/services")
            .then((res) => setServices((res.data.services || res.data || []).slice(0, 6)))
            .catch(() => setServices([]))
    }, [])

    const handleContact = async (serviceId) => {
        if (!user) {
            navigate("/login")
            return
        }
        try {
            const ok = await addServiceToCart(serviceId)
            if (ok) setNotice({ type: "success", message: "Asesoria agregada al carrito por $5.000. El contacto se libera despues del pago." })
        } catch (err) {
            setNotice({ type: "error", message: err.response?.data?.message || "No se pudo solicitar el servicio" })
        }
    }

    const canPublish = ["maestro", "pyme"].includes(user?.user_type)
    const publishAction = () => {
        if (canPublish) {
            navigate("/mis-servicios")
            return
        }
        navigate(user ? "/registro-pro" : "/register")
    }

    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 sm:mb-10">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Productos y servicios de Maestros/PYMEs</h2>
                    <p className="text-gray-500 text-sm mt-2 max-w-2xl">Agrega una asesoria al carrito por $5.000 y recibe los datos de contacto al pagar junto con tus productos Ferremas.</p>
                </div>
                <button
                    onClick={publishAction}
                    className="self-start text-teal-700 text-sm font-semibold hover:underline"
                >
                    {canPublish ? "Publicar servicio" : "Postular para publicar"}
                </button>
            </div>

            {notice && (
                <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${notice.type === "success"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                    }`}>
                    <div className="flex items-center justify-between gap-4">
                        <span>{notice.message}</span>
                        <button type="button" onClick={() => setNotice(null)} className="font-bold">Cerrar</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
                <div className="brand-card rounded-xl border shadow-sm p-6">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-orange-700 flex items-center justify-center mb-4">
                        <ShoppingBag size={20} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Compra mixta</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        El cliente puede comprar materiales y sumar una asesoria profesional como un item adicional.
                    </p>
                </div>
                <div className="brand-card rounded-xl border shadow-sm p-6">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                        <Briefcase size={20} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Confirmacion $5.000</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        Ferremas cobra solo la confirmacion de contacto. El servicio final se paga directo al maestro/PYME.
                    </p>
                </div>
                <div className="brand-card rounded-xl border shadow-sm p-6">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center mb-4">
                        <Mail size={20} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Voucher y correo mixto</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        Al pagar, el voucher muestra los datos del profesional y se prepara el correo para ambos contactos.
                    </p>
                </div>
            </div>

            {services.length === 0 ? (
                <div className="brand-card rounded-xl border border-dashed p-6 text-center">
                    <p className="text-sm font-semibold text-gray-800">Aun no hay servicios publicados.</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Los maestros y PYMEs aprobados pueden publicar sus servicios para que aparezcan aqui.
                    </p>
                    <button
                        onClick={publishAction}
                        className="mt-4 bg-gray-900 text-white rounded-xl px-5 py-3 text-sm font-semibold hover:bg-gray-800 transition"
                    >
                        {canPublish ? "Publicar mi primer servicio" : "Postular como Maestro/PYME"}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <article key={service.id} className="brand-card rounded-xl border shadow-sm p-6 flex flex-col min-h-[330px]">
                            <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                                <Briefcase size={20} />
                            </div>
                            <p className="text-xs text-teal-700 font-semibold">{service.category || "Servicio"}</p>
                            <h3 className="text-lg font-bold text-gray-900 mt-1">{service.title}</h3>
                            <p className="text-sm text-gray-500 mt-3 leading-6 line-clamp-3 min-h-[72px]">{service.description}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-5 pt-4 border-t border-gray-100">
                                {service.city && <span className="inline-flex items-center gap-1"><MapPin size={13} />{service.city}</span>}
                                {service.phone && <span className="inline-flex items-center gap-1"><Phone size={13} />{service.phone}</span>}
                                {service.email && <span className="inline-flex items-center gap-1"><Mail size={13} />Correo al pagar</span>}
                            </div>
                            <div className="mt-5 rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-xs leading-5 text-orange-800">
                                El servicio final se acuerda y paga directo con el maestro/PYME.
                            </div>
                            <button
                                onClick={() => handleContact(service.id)}
                                className="w-full mt-auto brand-button-dark rounded-xl py-3 text-sm font-semibold transition"
                            >
                                Solicitar contacto $5.000
                            </button>
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}

export default ProfessionalServices
