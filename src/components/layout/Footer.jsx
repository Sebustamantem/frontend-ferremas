import { Camera, Mail, MapPin, MessageCircle, Phone, Play, ShieldCheck } from "lucide-react"

const social = [
    { icon: MessageCircle, label: "Comunidad" },
    { icon: Camera, label: "Galeria" },
    { icon: Play, label: "Videos" },
    { icon: Mail, label: "Correo" },
]

const Footer = () => {
    return (
        <footer className="bg-slate-900 text-white">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-slate-700 pb-6">
                    <div className="flex items-center gap-3">
                        {social.map(({ icon: Icon, label }) => (
                            <button
                                key={label}
                                className="w-9 h-9 rounded-full bg-slate-700 text-slate-100 flex items-center justify-center hover:bg-orange-500 transition"
                                title={label}
                            >
                                <Icon size={17} />
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs font-semibold">
                        <button className="hover:text-orange-300 transition">Terminos y condiciones</button>
                        <button className="hover:text-orange-300 transition">Politicas de privacidad</button>
                        <button className="hover:text-orange-300 transition">Politica de cookies</button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 pt-5 text-xs text-slate-200">
                    <div className="space-y-2">
                        <p className="font-bold text-white">FERREMAS - Todos los derechos reservados</p>
                        <p className="inline-flex items-center gap-2"><MapPin size={14} /> Casa matriz: Santiago, Chile</p>
                        <p className="inline-flex items-center gap-2 sm:ml-4"><Phone size={14} /> Atencion comercial y soporte online</p>
                    </div>

                    <div className="inline-flex items-center gap-2 font-semibold text-white">
                        <ShieldCheck size={17} className="text-orange-300" />
                        Compra 100% segura
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
