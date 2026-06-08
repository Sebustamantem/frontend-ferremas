import { useEffect, useRef, useState } from "react"
import { ChevronDown, Download } from "lucide-react"

const ExportMenu = ({ label = "Exportar", items = [], dark = false }) => {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) setOpen(false)
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const buttonClass = dark
        ? "bg-white/10 hover:bg-white/15 border border-white/15 text-white"
        : "bg-white hover:bg-gray-50 border border-gray-200 text-gray-800"

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${buttonClass}`}
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <Download size={16} />
                {label}
                <ChevronDown size={15} />
            </button>

            {open && (
                <div className="absolute right-0 top-11 z-[90] w-64 rounded-xl border border-gray-100 bg-white shadow-xl overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500">Descargas CSV</p>
                    </div>
                    {items.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => {
                                setOpen(false)
                                item.onClick()
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-orange-50 transition"
                        >
                            <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                            {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ExportMenu
