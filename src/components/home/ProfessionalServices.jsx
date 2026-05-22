import { useEffect, useState } from "react"
import { Briefcase, Mail, MapPin, Phone, ShoppingBag } from "lucide-react"
import { useNavigate } from "react-router-dom"
import api from "../../api/axios"
import { useAuth } from "../../context/AuthContext"
import { useCart } from "../../context/CartContext"

const ProfessionalServices = () => {
    const [services, setServices] = useState([])
    const { user } = useAuth()
    const { addServiceToCart } = useCart()
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
            const ok = await addServiceToCart(serviceId)
            if (ok) alert("Asesoria agregada al carrito por $5.000. El contacto se libera despues del pago.")
        } catch (err) {
            alert(err.response?.data?.message || "No se pudo solicitar el servicio")
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
        <section className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Productos y servicios de Maestros/PYMEs</h2>
                    <p className="text-gray-400 text-sm mt-1">Agrega una asesoria al carrito por $5.000 y recibe los datos de contacto al pagar.</p>
                </div>
                <button
                    onClick={publishAction}
                    className="text-orange-500 text-sm font-semibold hover:underline"
                >
                    {canPublish ? "Publicar servicio" : "Postular para publicar"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                        <ShoppingBag size={20} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Compra mixta</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        El cliente puede comprar materiales y sumar una asesoria profesional como un item adicional.
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                        <Briefcase size={20} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Confirmacion $5.000</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        Ferremas cobra solo la confirmacion de contacto. El servicio final se paga directo al maestro/PYME.
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                        <Mail size={20} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Voucher y correo mixto</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        Al pagar, el voucher muestra los datos del profesional y se prepara el correo para ambos contactos.
                    </p>
                </div>
            </div>

            {services.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-orange-200 p-6 text-center">
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
                                {service.email && <span className="inline-flex items-center gap-1"><Mail size={13} />Correo al pagar</span>}
                            </div>
                            <div className="mt-4 rounded-lg bg-orange-50 border border-orange-100 px-3 py-2 text-xs text-orange-700">
                                El servicio final se acuerda y paga directo con el maestro/PYME.
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
            )}
        </section>
    )
}

export default ProfessionalServices
