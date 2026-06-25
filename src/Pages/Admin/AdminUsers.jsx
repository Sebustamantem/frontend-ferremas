import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { Plus, X } from "lucide-react"
import api from "../../api/axios"
import { formatRut, isRutLengthValid } from "../../utils/rut"
import { downloadCsv } from "../../utils/csv"
import ExportMenu from "../../components/ui/ExportMenu"

const emptyForm = {
    name: "",
    lastname: "",
    email: "",
    rut: "",
    phone: "",
    role: "vendedor",
    password: "",
}

const staffRoles = [
    { value: "vendedor", label: "Vendedor" },
    { value: "bodeguero", label: "Bodeguero" },
    { value: "contador", label: "Contador" },
]

const AdminUsers = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState("")
    const [saving, setSaving] = useState(false)
    const [createdCredentials, setCreatedCredentials] = useState(null)
    const [notice, setNotice] = useState(null)
    const [roleDraft, setRoleDraft] = useState(null)

    useEffect(() => {
        if (!user || user.role !== "admin") {
            navigate("/")
            return
        }
        fetchUsers()
    }, [user, navigate])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await api.get("/users")
            setUsers(res.data.users || res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleRoleChange = (id, role) => {
        setRoleDraft({ id, role })
    }

    const confirmRoleChange = async () => {
        if (!roleDraft) return
        try {
            const res = await api.put(`/users/${roleDraft.id}/role`, { role: roleDraft.role })
            setNotice({ type: "success", message: res.data.message || "Rol actualizado correctamente." })
            setRoleDraft(null)
            fetchUsers()
        } catch (err) {
            setNotice({ type: "error", message: err.response?.data?.message || "No se pudo cambiar el rol" })
        }
    }

    const handleChange = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value })
    }

    const handleRutChange = (event) => {
        setForm({ ...form, rut: formatRut(event.target.value) })
    }

    const handleCreateStaff = async (event) => {
        event.preventDefault()
        setSaving(true)
        setError("")
        setCreatedCredentials(null)

        if (form.rut && !isRutLengthValid(form.rut)) {
            setError("Ingresa un RUT valido")
            setSaving(false)
            return
        }

        try {
            const payload = {
                ...form,
                password: form.password || undefined,
            }
            const res = await api.post("/users/staff", payload)
            setCreatedCredentials({
                email: res.data.user.email,
                role: res.data.user.role,
                password: res.data.temporary_password,
            })
            setForm(emptyForm)
            await fetchUsers()
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo crear el usuario interno")
        } finally {
            setSaving(false)
        }
    }

    const closeModal = () => {
        setShowModal(false)
        setForm(emptyForm)
        setError("")
        setCreatedCredentials(null)
    }

    const roleColors = {
        admin: "bg-orange-100 text-orange-600",
        cliente: "bg-blue-100 text-blue-600",
        maestro: "bg-orange-100 text-orange-600",
        pyme: "bg-cyan-100 text-cyan-700",
        vendedor: "bg-purple-100 text-purple-600",
        bodeguero: "bg-green-100 text-green-600",
        contador: "bg-yellow-100 text-yellow-700",
    }

    const exportUsers = () => {
        downloadCsv("ferremas-usuarios.csv", users.map((item) => ({
            id: item.id,
            nombre: item.name,
            apellido: item.lastname || "",
            email: item.email,
            rut: item.rut || "",
            telefono: item.phone || "",
            rol: item.role,
            tipo_usuario: item.user_type,
            creado: item.created_at,
        })))
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Gestion de Usuarios</h1>
                        <p className="text-gray-500 text-sm mt-1">{users.length} usuarios registrados</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition"
                        >
                            <Plus size={16} />
                            Nuevo usuario interno
                        </button>
                        <ExportMenu
                            items={[
                                { label: "Usuarios", description: "Clientes, staff y roles", onClick: exportUsers },
                            ]}
                        />
                        <button
                            onClick={() => navigate("/admin/dashboard")}
                            className="text-sm text-orange-500 hover:underline font-medium px-3 py-2"
                        >
                            Volver al dashboard
                        </button>
                    </div>
                </div>

                {notice && (
                    <div className={`rounded-xl px-4 py-3 text-sm mb-6 border ${notice.type === "success"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-700"
                        }`}>
                        <div className="flex items-center justify-between gap-4">
                            <span>{notice.message}</span>
                            <button type="button" onClick={() => setNotice(null)} className="font-bold">Cerrar</button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[760px]">
                                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Usuario</th>
                                        <th className="px-6 py-4 text-left">RUT</th>
                                        <th className="px-6 py-4 text-left">Telefono</th>
                                        <th className="px-6 py-4 text-left">Rol</th>
                                        <th className="px-6 py-4 text-left">Registro</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                                                        {item.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{item.name} {item.lastname}</p>
                                                        <p className="text-gray-400 text-xs">{item.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{item.rut || "-"}</td>
                                            <td className="px-6 py-4 text-gray-600">{item.phone || "-"}</td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={item.role}
                                                    onChange={(event) => handleRoleChange(item.id, event.target.value)}
                                                    disabled={item.id === user.id}
                                                    className={`text-xs font-semibold px-3 py-1 rounded-full border-0 cursor-pointer ${roleColors[item.role]}`}
                                                >
                                                    {item.role === "admin" && <option value="admin" disabled>admin</option>}
                                                    <option value="cliente">cliente</option>
                                                    <option value="maestro">maestro</option>
                                                    <option value="pyme">pyme</option>
                                                    <option value="vendedor">vendedor</option>
                                                    <option value="bodeguero">bodeguero</option>
                                                    <option value="contador">contador</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-xs">
                                                {new Date(item.created_at).toLocaleDateString("es-CL")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={22} />
                        </button>

                        <h2 className="text-xl font-bold text-gray-900">Crear usuario interno</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Crea cuentas para vendedor, bodeguero o contador. Se pedira cambiar la contraseña al primer ingreso.
                        </p>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mt-5">
                                {error}
                            </div>
                        )}

                        {createdCredentials && (
                            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mt-5">
                                <p className="font-bold">Usuario creado correctamente</p>
                                <p className="mt-1">Email: {createdCredentials.email}</p>
                                <p>Rol: {createdCredentials.role}</p>
                                <p>Clave temporal: <span className="font-bold">{createdCredentials.password}</span></p>
                            </div>
                        )}

                        <form onSubmit={handleCreateStaff} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Nombre"
                                required
                                className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <input
                                name="lastname"
                                value={form.lastname}
                                onChange={handleChange}
                                placeholder="Apellido"
                                className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="Correo"
                                required
                                className="sm:col-span-2 border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <input
                                name="rut"
                                value={form.rut}
                                onChange={handleRutChange}
                                placeholder="RUT"
                                maxLength={12}
                                className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <input
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="Telefono"
                                className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <select
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                className="sm:col-span-2 border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                {staffRoles.map((role) => (
                                    <option key={role.value} value={role.value}>{role.label}</option>
                                ))}
                            </select>
                            <input
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Clave temporal opcional"
                                className="sm:col-span-2 border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <button
                                type="submit"
                                disabled={saving}
                                className="sm:col-span-2 bg-orange-500 text-white rounded-xl py-3 font-semibold hover:bg-orange-600 transition disabled:opacity-60"
                            >
                                {saving ? "Creando..." : "Crear usuario interno"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {roleDraft && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900">Cambiar rol</h2>
                        <p className="text-sm text-gray-500 mt-2">Cambiar rol a "{roleDraft.role}"?</p>
                        <div className="flex justify-end gap-2 mt-6">
                            <button type="button" onClick={() => setRoleDraft(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">
                                Cancelar
                            </button>
                            <button type="button" onClick={confirmRoleChange} className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600">
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminUsers
