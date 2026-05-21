import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../api/axios"
import { useAuth } from "../../context/AuthContext"

const MyServices = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [services, setServices] = useState([])
    const [form, setForm] = useState({ title: "", description: "", category: "", city: "", phone: "" })
    const [error, setError] = useState("")

    useEffect(() => {
        if (!["maestro", "pyme"].includes(user?.user_type)) {
            navigate("/")
            return
        }
        fetchServices()
    }, [user, navigate])

    const fetchServices = async () => {
        const res = await api.get("/services/my")
        setServices(res.data)
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError("")
        try {
            await api.post("/services", form)
            setForm({ title: "", description: "", category: "", city: "", phone: "" })
            fetchServices()
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo publicar el servicio")
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Mis servicios</h1>
                    <p className="text-sm text-gray-500 mt-1">Publica servicios para que clientes puedan contactarte desde la página principal.</p>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-5">{error}</div>}

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <input className="border rounded-xl px-4 py-3 text-sm" placeholder="Titulo del servicio" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                    <input className="border rounded-xl px-4 py-3 text-sm" placeholder="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                    <input className="border rounded-xl px-4 py-3 text-sm" placeholder="Comuna / ciudad" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                    <input className="border rounded-xl px-4 py-3 text-sm" placeholder="Telefono de contacto" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    <textarea className="border rounded-xl px-4 py-3 text-sm md:col-span-2 min-h-28" placeholder="Descripcion" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                    <button className="md:col-span-2 bg-orange-500 text-white rounded-xl py-3 font-semibold hover:bg-orange-600">Publicar servicio</button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => (
                        <article key={service.id} className="bg-white rounded-xl border border-gray-100 p-5">
                            <p className="text-xs text-orange-500 font-semibold">{service.category || "Servicio"}</p>
                            <h2 className="text-lg font-bold text-gray-900 mt-1">{service.title}</h2>
                            <p className="text-sm text-gray-500 mt-2">{service.description}</p>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default MyServices
