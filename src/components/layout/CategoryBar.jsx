import { Link } from "react-router-dom"
import {
    Hammer, Wrench, HardHat, Zap, Paintbrush, Pipette, Trees, ShoppingBag
} from "lucide-react"

const categories = [
    { name: "Herramientas", icon: <Hammer size={18} />, path: "/productos?categoria=herramientas" },
    { name: "Construcción", icon: <HardHat size={18} />, path: "/productos?categoria=construccion" },
    { name: "Electricidad", icon: <Zap size={18} />, path: "/productos?categoria=electricidad" },
    { name: "Plomería", icon: <Pipette size={18} />, path: "/productos?categoria=plomeria" },
    { name: "Pintura", icon: <Paintbrush size={18} />, path: "/productos?categoria=pintura" },
    { name: "Jardín", icon: <Trees size={18} />, path: "/productos?categoria=jardin" },
    { name: "Fijaciones", icon: <Wrench size={18} />, path: "/productos?categoria=fijaciones" },
    { name: "Ofertas", icon: <ShoppingBag size={18} />, path: "/productos" },
]

const CategoryBar = () => {
    return (
        <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-[1400px] mx-auto px-2 sm:px-6 lg:px-8">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1 touch-pan-x">
                    {categories.map((cat) => (
                        <Link
                            key={cat.name}
                            to={cat.path}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition whitespace-nowrap"
                        >
                            <span className="text-orange-500">{cat.icon}</span>
                            {cat.name}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default CategoryBar
