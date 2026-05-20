import { Link } from "react-router-dom"
import { Hammer, HardHat, Zap, Pipette, Paintbrush, Trees, Wrench, ShoppingBag } from "lucide-react"

const categories = [
    { name: "Herramientas", icon: <Hammer size={28} />, path: "/productos?categoria=herramientas", color: "bg-orange-100 text-orange-600" },
    { name: "Construcción", icon: <HardHat size={28} />, path: "/productos?categoria=construccion", color: "bg-yellow-100 text-yellow-600" },
    { name: "Electricidad", icon: <Zap size={28} />, path: "/productos?categoria=electricidad", color: "bg-blue-100 text-blue-600" },
    { name: "Plomería", icon: <Pipette size={28} />, path: "/productos?categoria=plomeria", color: "bg-cyan-100 text-cyan-600" },
    { name: "Pintura", icon: <Paintbrush size={28} />, path: "/productos?categoria=pintura", color: "bg-pink-100 text-pink-600" },
    { name: "Jardín", icon: <Trees size={28} />, path: "/productos?categoria=jardin", color: "bg-green-100 text-green-600" },
    { name: "Fijaciones", icon: <Wrench size={28} />, path: "/productos?categoria=fijaciones", color: "bg-purple-100 text-purple-600" },
    { name: "Ofertas", icon: <ShoppingBag size={28} />, path: "/productos", color: "bg-red-100 text-red-600" },
]

const Categories = () => {
    return (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Comprar por Categoría</h2>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {categories.map((cat) => (
                    <Link key={cat.name} to={cat.path}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:shadow-md transition group cursor-pointer bg-white border border-gray-100">
                        <div className={`p-3 rounded-xl ${cat.color} group-hover:scale-110 transition`}>
                            {cat.icon}
                        </div>
                        <span className="text-xs font-medium text-gray-700 text-center">{cat.name}</span>
                    </Link>
                ))}
            </div>
        </section>
    )
}

export default Categories
