import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Briefcase, CheckCircle2, Edit3, Eye, EyeOff, Mail, MapPin, Phone, Trash2, Users } from "lucide-react"
import api from "../../api/axios"
import { useAuth } from "../../context/AuthContext"
import { regions } from "../../data/chileRegions"

const categories = [
    "Gasfiteria",
    "Electricidad",
    "Construccion",
    "Pintura",
    "Jardineria",
    "Carpinteria",
    "Cerrajeria",
    "Instalaciones",
    "Reparaciones",
    "Otros",
]

const emptyForm = {
    title: "",
    description: "",
    category: "",
    region: "",
    city: "",
    phone: "",
    availability: "",
    reference_price: "",
}

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString("es-CL")}`

const formatDate = (value) => {
    if (!value) return "Sin fecha"
    return new Date(value).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}

const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"

const MyServices = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [services, setServices] = useState([])
    const [requests, setRequests] = useState([])
    const [summary, setSummary] = useState({ total_requests: 0, paid_requests: 0, confirmation_total: 0 })
    const [form, setForm] = useState(emptyForm)
    const [editingId, setEditingId] = useState(null)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleteDraft, setDeleteDraft] = useState(null)

    const selectedRegion = regions.find((region) => region.name === form.region)

    useEffect(() => {
        if (!user) return
        if (!["maestro", "pyme"].includes(user.user_type)) {
            navigate("/")
            return
        }
        fetchPanel()
    }, [user, navigate])

    const fetchPanel = async () => {
        setLoading(true)
        try {
            const [servicesRes, requestsRes] = await Promise.all([
                api.get("/services/my"),
                api.get("/services/my/requests"),
            ])
            setServices(servicesRes.data)
            setRequests(requestsRes.data.requests || [])
            setSummary(requestsRes.data.summary || { total_requests: 0, paid_requests: 0, confirmation_total: 0 })
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo cargar el panel profesional")
        } finally {
            setLoading(false)
        }
    }

    const stats = useMemo(() => {
        const activeServices = services.filter((service) => service.is_active).length
        return {
            activeServices,
            totalServices: services.length,
            contacts: Number(summary.paid_requests || 0),
            confirmationTotal: Number(summary.confirmation_total || 0),
        }
    }, [services, summary])

    const handleChange = (event) => {
        const { name, value } = event.target
        setForm((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "region" ? { city: "" } : {}),
        }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setSaving(true)
        setError("")
        setSuccess("")
        try {
            if (editingId) {
                await api.put(`/services/${editingId}`, form)
                setSuccess("Servicio actualizado correctamente")
            } else {
                await api.post("/services", form)
                setSuccess("Servicio publicado correctamente")
            }
            setForm(emptyForm)
            setEditingId(null)
            await fetchPanel()
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo guardar el servicio")
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (service) => {
        setEditingId(service.id)
        setForm({
            title: service.title || "",
            description: service.description || "",
            category: service.category || "",
            region: service.region || "",
            city: service.city || "",
            phone: service.phone || "",
            availability: service.availability || "",
            reference_price: service.reference_price || "",
        })
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setForm(emptyForm)
        setError("")
        setSuccess("")
    }

    const toggleService = async (service) => {
        try {
            await api.put(`/services/${service.id}/status`, { is_active: !service.is_active })
            setSuccess(service.is_active ? "Servicio pausado correctamente" : "Servicio activado correctamente")
            await fetchPanel()
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo cambiar el estado")
        }
    }

    const deleteService = async (service) => {
        setDeleteDraft(service)
    }

    const confirmDeleteService = async () => {
        if (!deleteDraft) return
        try {
            await api.delete(`/services/${deleteDraft.id}`)
            setSuccess("Servicio eliminado correctamente")
            setDeleteDraft(null)
            await fetchPanel()
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo eliminar el servicio")
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 overflow-hidden rounded-lg bg-gray-900 text-white shadow-sm">
                    <div className="p-6 sm:p-8">
                        <p className="text-sm font-semibold text-orange-300">Panel profesional</p>
                        <h1 className="text-3xl font-bold mt-1">Mis servicios y contactos</h1>
                        <p className="text-gray-300 text-sm mt-2">
                            Publica servicios, revisa clientes interesados y mide tus confirmaciones de contacto.
                        </p>
                    </div>
                </div>

                {error && <Alert type="error" text={error} />}
                {success && <Alert type="success" text={success} />}

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                    <StatCard icon={Briefcase} label="Servicios activos" value={stats.activeServices} note={`${stats.totalServices} publicados`} color="orange" />
                    <StatCard icon={Users} label="Contactos confirmados" value={stats.contacts} note="Clientes que pagaron contacto" color="blue" />
                    <StatCard icon={CheckCircle2} label="Monto confirmaciones" value={formatCurrency(stats.confirmationTotal)} note="$5.000 por contacto" color="green" />
                    <StatCard icon={Mail} label="Solicitudes totales" value={summary.total_requests || 0} note="Incluye pendientes/canceladas" color="purple" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <section className="xl:col-span-1 bg-white rounded-lg border border-gray-100 shadow-sm p-5">
                        <h2 className="text-lg font-bold text-gray-900">{editingId ? "Editar servicio" : "Publicar servicio"}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Completa datos claros para que el cliente sepa que esta contratando un contacto inicial.
                        </p>

                        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                            <Field label="Titulo del servicio">
                                <input name="title" value={form.title} onChange={handleChange} required placeholder="Ej: Electricista domiciliario certificado" className={inputClass} />
                            </Field>

                            <Field label="Categoria">
                                <select name="category" value={form.category} onChange={handleChange} required className={inputClass}>
                                    <option value="">Selecciona categoria</option>
                                    {categories.map((category) => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </Field>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Field label="Region">
                                    <select name="region" value={form.region} onChange={handleChange} required className={inputClass}>
                                        <option value="">Region</option>
                                        {regions.map((region) => (
                                            <option key={region.name} value={region.name}>{region.name}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Comuna">
                                    <select name="city" value={form.city} onChange={handleChange} disabled={!selectedRegion} required className={`${inputClass} disabled:bg-gray-100`}>
                                        <option value="">Comuna</option>
                                        {selectedRegion?.communes.map((commune) => (
                                            <option key={commune} value={commune}>{commune}</option>
                                        ))}
                                    </select>
                                </Field>
                            </div>

                            <Field label="Telefono de contacto">
                                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+569 1234 5678" className={inputClass} />
                            </Field>

                            <Field label="Disponibilidad">
                                <input name="availability" value={form.availability} onChange={handleChange} placeholder="Ej: Lunes a sabado, 09:00 a 18:00" className={inputClass} />
                            </Field>

                            <Field label="Precio referencial opcional">
                                <input type="number" min="0" name="reference_price" value={form.reference_price} onChange={handleChange} placeholder="Ej: 25000" className={inputClass} />
                            </Field>

                            <Field label="Descripcion">
                                <textarea name="description" value={form.description} onChange={handleChange} required placeholder="Describe experiencia, tipo de trabajos y cobertura." className={`${inputClass} min-h-28 resize-none`} />
                            </Field>

                            <div className="rounded-lg bg-orange-50 border border-orange-100 p-3 text-xs text-orange-700">
                                Ferremas cobrara $5.000 solo por liberar el contacto. El servicio final se acuerda y paga directamente con el cliente.
                            </div>

                            <div className="flex gap-2">
                                {editingId && (
                                    <button type="button" onClick={handleCancelEdit} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-3 font-semibold hover:bg-gray-50">
                                        Cancelar
                                    </button>
                                )}
                                <button disabled={saving} className="flex-1 bg-orange-500 text-white rounded-lg py-3 font-semibold hover:bg-orange-600 disabled:opacity-60">
                                    {saving ? "Guardando..." : editingId ? "Actualizar" : "Publicar"}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="xl:col-span-2 space-y-6">
                        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                            <SectionHeader title="Servicios publicados" subtitle={`${services.length} servicios creados`} />
                            {loading ? (
                                <Loading />
                            ) : services.length === 0 ? (
                                <Empty text="Aun no tienes servicios publicados." />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                                    {services.map((service) => (
                                        <article key={service.id} className="border border-gray-100 rounded-lg p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-semibold text-orange-600">{service.category || "Servicio"}</p>
                                                    <h3 className="font-bold text-gray-900 mt-1">{service.title}</h3>
                                                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{service.description}</p>
                                                </div>
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${service.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                                    {service.is_active ? "Activo" : "Pausado"}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-4">
                                                {service.city && <span className="inline-flex items-center gap-1"><MapPin size={13} />{service.city}</span>}
                                                {service.phone && <span className="inline-flex items-center gap-1"><Phone size={13} />{service.phone}</span>}
                                                {service.reference_price && <span>Desde {formatCurrency(service.reference_price)}</span>}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                                                <div className="rounded-lg bg-gray-50 p-2">
                                                    <p className="text-gray-400">Contactos</p>
                                                    <p className="font-bold text-gray-800">{service.request_count || 0}</p>
                                                </div>
                                                <div className="rounded-lg bg-orange-50 p-2">
                                                    <p className="text-orange-500">Confirmaciones</p>
                                                    <p className="font-bold text-orange-700">{formatCurrency(service.confirmation_total)}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-4">
                                                <IconButton icon={Edit3} label="Editar" onClick={() => handleEdit(service)} />
                                                <IconButton icon={service.is_active ? EyeOff : Eye} label={service.is_active ? "Pausar" : "Activar"} onClick={() => toggleService(service)} />
                                                <IconButton icon={Trash2} label="Eliminar" danger onClick={() => deleteService(service)} />
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                            <SectionHeader title="Contactos adquiridos por clientes" subtitle="Clientes que pagaron la confirmacion de $5.000" />
                            {loading ? (
                                <Loading />
                            ) : requests.length === 0 ? (
                                <Empty text="Todavia no hay contactos comprados." />
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm min-w-[780px]">
                                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                            <tr>
                                                <th className="px-5 py-3 text-left">Cliente</th>
                                                <th className="px-5 py-3 text-left">Servicio</th>
                                                <th className="px-5 py-3 text-left">Contacto</th>
                                                <th className="px-5 py-3 text-left">Monto</th>
                                                <th className="px-5 py-3 text-left">Fecha</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {requests.map((request) => (
                                                <tr key={request.id}>
                                                    <td className="px-5 py-4">
                                                        <p className="font-semibold text-gray-800">{request.customer_name || "Cliente"}</p>
                                                        <p className="text-xs text-gray-400">{request.customer_email}</p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <p className="text-gray-800">{request.title}</p>
                                                        <p className="text-xs text-gray-400">{request.category} · {request.city}</p>
                                                    </td>
                                                    <td className="px-5 py-4 text-gray-600">{request.customer_phone || "-"}</td>
                                                    <td className="px-5 py-4 font-bold text-orange-600">{formatCurrency(request.amount || 5000)}</td>
                                                    <td className="px-5 py-4 text-gray-500">{formatDate(request.created_at)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {deleteDraft && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900">Eliminar servicio</h2>
                        <p className="text-sm text-gray-500 mt-2">Eliminar el servicio "{deleteDraft.title}"?</p>
                        <div className="flex justify-end gap-2 mt-6">
                            <button type="button" onClick={() => setDeleteDraft(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">
                                Cancelar
                            </button>
                            <button type="button" onClick={confirmDeleteService} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700">
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const Alert = ({ type, text }) => (
    <div className={`${type === "error" ? "bg-red-50 border-red-200 text-red-600" : "bg-green-50 border-green-200 text-green-700"} border rounded-xl px-4 py-3 text-sm mb-5`}>
        {text}
    </div>
)

const Field = ({ label, children }) => (
    <label className="block">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <div className="mt-1">{children}</div>
    </label>
)

const StatCard = ({ icon: Icon, label, value, note, color }) => {
    const colors = {
        orange: "bg-orange-100 text-orange-600",
        blue: "bg-blue-100 text-blue-600",
        green: "bg-green-100 text-green-600",
        purple: "bg-purple-100 text-purple-600",
    }

    return (
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-gray-400 text-sm">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    <p className="text-xs text-gray-400 mt-1">{note}</p>
                </div>
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${colors[color]}`}>
                    <Icon size={22} />
                </div>
            </div>
        </div>
    )
}

const SectionHeader = ({ title, subtitle }) => (
    <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
)

const IconButton = ({ icon: Icon, label, onClick, danger = false }) => (
    <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition ${danger ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
    >
        <Icon size={14} />
        {label}
    </button>
)

const Loading = () => (
    <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
)

const Empty = ({ text }) => (
    <div className="text-center py-12 text-sm text-gray-400">{text}</div>
)

export default MyServices
