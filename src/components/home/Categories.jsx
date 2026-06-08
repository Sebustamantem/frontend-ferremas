import { Link } from "react-router-dom"
import { Hammer, HardHat, Zap, Pipette, Paintbrush, Trees, Wrench, ShoppingBag } from "lucide-react"

const categories = [
    { name: "Herramientas", icon: <Hammer size={28} />, path: "/productos?categoria=herramientas", color: "bg-orange-100 text-orange-700" },
    { name: "Construccion", icon: <HardHat size={28} />, path: "/productos?categoria=construccion", color: "bg-yellow-100 text-yellow-600" },
    { name: "Electricidad", icon: <Zap size={28} />, path: "/productos?categoria=electricidad", color: "bg-blue-100 text-blue-600" },
    { name: "Plomeria", icon: <Pipette size={28} />, path: "/productos?categoria=plomeria", color: "bg-teal-100 text-teal-700" },
    { name: "Pintura", icon: <Paintbrush size={28} />, path: "/productos?categoria=pintura", color: "bg-pink-100 text-pink-600" },
    { name: "Jardin", icon: <Trees size={28} />, path: "/productos?categoria=jardin", color: "bg-green-100 text-green-600" },
    { name: "Fijaciones", icon: <Wrench size={28} />, path: "/productos?categoria=fijaciones", color: "bg-purple-100 text-purple-600" },
    { name: "Ofertas", icon: <ShoppingBag size={28} />, path: "/productos", color: "bg-red-100 text-red-700" },
]

const Categories = () => {
    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Comprar por Categoria</h2>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
                {categories.map((cat) => (
                    <Link
                        key={cat.name}
                        to={cat.path}
                        className="flex flex-col items-center gap-2 p-2 sm:p-4 rounded-xl sm:rounded-2xl hover:shadow-lg hover:-translate-y-0.5 transition group cursor-pointer brand-card border min-w-0"
                    >
                        <div className={`p-2 sm:p-3 rounded-xl ${cat.color} group-hover:scale-110 transition`}>
                            {cat.icon}
                        </div>
                        <span className="text-[11px] sm:text-xs font-medium text-gray-700 text-center leading-tight">{cat.name}</span>
                    </Link>
                ))}
            </div>
        </section>
    )
}

export default Categories
