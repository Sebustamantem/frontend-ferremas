const PromoBanner = () => {
    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">

                <div className="brand-gradient rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white flex flex-col justify-between min-h-[100px] sm:min-h-[120px] shadow-md">
                    <p className="text-sm font-medium">Envío Express</p>
                    <div>
                        <h2 className="text-xl font-bold">Despacho en 24hrs</h2>
                        <p className="text-xs mt-1">En productos seleccionados</p>
                    </div>
                </div>

                <div className="brand-gradient rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white flex flex-col justify-between min-h-[100px] sm:min-h-[120px] shadow-md">
                    <p className="text-sm font-medium">Ofertas Especiales</p>
                    <div>
                        <h2 className="text-xl font-bold">Hasta 40% OFF</h2>
                        <p className="text-xs text-gray-200 mt-1">En herramientas seleccionadas</p>
                    </div>
                </div>

                <div className="brand-gradient rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white flex flex-col justify-between min-h-[100px] sm:min-h-[120px] shadow-md">
                    <p className="text-sm font-medium">Compra Segura</p>
                    <div>
                        <h2 className="text-xl font-bold">Pago con Transbank</h2>
                        <p className="text-xs mt-1">100% seguro y protegido</p>
                    </div>
                </div>

            </div>
        </section>
    )
}

export default PromoBanner
