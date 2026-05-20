import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import api from "../../api/axios"
import { regions } from "../../data/chileRegions"

const Profile = () => {
    const { user, login } = useAuth()
    const [form, setForm] = useState({
        name: "",
        lastname: "",
        email: "",
        phone: "",
        password: "",
        address: {
            region: "",
            city: "",
            street: "",
            number: "",
            zip: "",
            phone: "",
        },
    })
    const [loading, setLoading] = useState(true)

    const normalizePhone = (value) => {
        const digits = value.replace(/\D/g, "")
        if (!digits) return ""
        if (digits.startsWith("569")) return `+${digits}`
        if (digits.startsWith("56")) return `+${digits}`
        if (digits.startsWith("9")) return `+56${digits}`
        return `+569${digits}`
    }

    const selectedRegion = regions.find((region) => region.name === form.address.region)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get("/users/me")
                const addressData = res.data.address && typeof res.data.address === "object"
                    ? res.data.address
                    : res.data.address ? JSON.parse(res.data.address) : null
                setForm({
                    name: res.data.name || "",
                    lastname: res.data.lastname || "",
                    email: res.data.email || "",
                    phone: normalizePhone(res.data.phone || ""),
                    password: "",
                    address: {
                        region: addressData?.region || "",
                        city: addressData?.city || "",
                        street: addressData?.street || "",
                        number: addressData?.number || "",
                        zip: addressData?.zip || "",
                        phone: normalizePhone(addressData?.phone || ""),
                    },
                })
            } catch (err) {
                setError("No pudimos cargar tu perfil. Inténtalo de nuevo.")
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [])

    const handleSubmit = async (event) => {
        event.preventDefault()
        setSaving(true)
        setError("")
        setMessage("")

        try {
            const payload = {
                name: form.name,
                lastname: form.lastname,
                email: form.email,
                phone: form.phone,
                address: form.address,
            }
            if (form.password) payload.password = form.password

            const res = await api.put("/users/me", payload)
            login(res.data, localStorage.getItem("token"))
            setMessage("Perfil actualizado correctamente.")
            setForm((prev) => ({ ...prev, password: "" }))
        } catch (err) {
            setError(err.response?.data?.message || "Error al actualizar tu perfil.")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-10">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Mi cuenta</h1>
                <p className="text-gray-500 mt-1">Revisa y actualiza tus datos personales.</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm py-3 px-4 rounded-xl mb-6">
                    {error}
                </div>
            )}

            {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm py-3 px-4 rounded-xl mb-6">
                    {message}
                </div>
            )}

            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <p className="text-xs text-gray-400 uppercase tracking-[.2em]">Rol</p>
                        <p className="text-sm font-semibold text-gray-700 capitalize">{user?.role || "cliente"}</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs text-gray-400 uppercase tracking-[.2em]">Usuario</p>
                        <p className="text-sm font-semibold text-gray-700">{user?.name} {user?.lastname}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="block">
                            <span className="text-sm text-gray-600">Nombre</span>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm text-gray-600">Apellidos</span>
                            <input
                                type="text"
                                value={form.lastname}
                                onChange={(e) => setForm({ ...form, lastname: e.target.value })}
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="block">
                            <span className="text-sm text-gray-600">Email</span>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm text-gray-600">Teléfono</span>
                            <input
                                type="text"
                                placeholder="+569 1234 5678"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: normalizePhone(e.target.value) })}
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                            />
                        </label>
                    </div>

                    <div className="bg-gray-50 rounded-3xl border border-gray-200 p-6">
                        <h2 className="text-base font-semibold text-gray-800 mb-4">Dirección de envío</h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <label className="block">
                                <span className="text-sm text-gray-600">Región</span>
                                <select
                                    value={form.address.region}
                                    onChange={(e) => setForm({ ...form, address: { ...form.address, region: e.target.value, city: "" } })}
                                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                                >
                                    <option value="">Selecciona región</option>
                                    {regions.map((region) => (
                                        <option key={region.name} value={region.name}>{region.name}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className="text-sm text-gray-600">Comuna</span>
                                <select
                                    value={form.address.city}
                                    onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })}
                                    disabled={!selectedRegion}
                                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                                >
                                    <option value="">Selecciona comuna</option>
                                    {selectedRegion?.communes.map((commune) => (
                                        <option key={commune} value={commune}>{commune}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <label className="block mt-4">
                            <span className="text-sm text-gray-600">Dirección</span>
                            <input
                                type="text"
                                value={form.address.street}
                                onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })}
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                            />
                        </label>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
                            <label className="block">
                                <span className="text-sm text-gray-600">Número / Depto</span>
                                <input
                                    type="text"
                                    value={form.address.number}
                                    onChange={(e) => setForm({ ...form, address: { ...form.address, number: e.target.value } })}
                                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm text-gray-600">Código postal</span>
                                <input
                                    type="text"
                                    value={form.address.zip}
                                    onChange={(e) => setForm({ ...form, address: { ...form.address, zip: e.target.value } })}
                                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                                />
                            </label>
                        </div>
                        <label className="block mt-4">
                            <span className="text-sm text-gray-600">Teléfono de entrega</span>
                            <input
                                type="text"
                                value={form.address.phone}
                                onChange={(e) => setForm({ ...form, address: { ...form.address, phone: e.target.value } })}
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                            />
                        </label>
                    </div>

                    <label className="block">
                        <span className="text-sm text-gray-600">Nueva contraseña (opcional)</span>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder="Deja vacío si no cambias tu contraseña"
                            className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                    >
                        {saving ? "Guardando..." : "Guardar cambios"}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Profile
