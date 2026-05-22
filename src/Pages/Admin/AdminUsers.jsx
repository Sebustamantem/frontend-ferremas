import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import api from "../../api/axios"

const AdminUsers = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user || user.role !== "admin") { navigate("/"); return }
        fetchUsers()
    }, [user])

    const fetchUsers = async () => {
        try {
            const res = await api.get("/users")
            setUsers(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleRoleChange = async (id, role) => {
        if (!confirm(`¿Cambiar rol a "${role}"?`)) return
        try {
            await api.put(`/users/${id}/role`, { role })
            fetchUsers()
        } catch (err) {
            console.error(err)
        }
    }

    const roleColors = {
        admin: "bg-orange-100 text-orange-600",
        cliente: "bg-blue-100 text-blue-600",
        vendedor: "bg-purple-100 text-purple-600",
        bodeguero: "bg-green-100 text-green-600",
        contador: "bg-yellow-100 text-yellow-700"
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
                        <p className="text-gray-500 text-sm mt-1">{users.length} usuarios registrados</p>
                    </div>
                    <button onClick={() => navigate("/admin/dashboard")}
                        className="text-sm text-orange-500 hover:underline font-medium">
                        Volver al dashboard
                    </button>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-2xl shadow overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4 text-left">Usuario</th>
                                    <th className="px-6 py-4 text-left">RUT</th>
                                    <th className="px-6 py-4 text-left">Teléfono</th>
                                    <th className="px-6 py-4 text-left">Rol</th>
                                    <th className="px-6 py-4 text-left">Registro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                                                    {u.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{u.name} {u.lastname}</p>
                                                    <p className="text-gray-400 text-xs">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{u.rut || "—"}</td>
                                        <td className="px-6 py-4 text-gray-600">{u.phone || "—"}</td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                disabled={u.id === user.id}
                                                className={`text-xs font-semibold px-3 py-1 rounded-full border-0 cursor-pointer ${roleColors[u.role]}`}
                                            >
                                                {u.role === "admin" && <option value="admin" disabled>admin</option>}
                                                <option value="cliente">cliente</option>
                                                <option value="vendedor">vendedor</option>
                                                <option value="bodeguero">bodeguero</option>
                                                <option value="contador">contador</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-xs">
                                            {new Date(u.created_at).toLocaleDateString("es-CL")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    )
}

export default AdminUsers
