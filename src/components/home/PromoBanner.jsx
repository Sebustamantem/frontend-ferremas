const PromoBanner = () => {
    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">

                <div className="bg-orange-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white flex flex-col justify-between min-h-[100px] sm:min-h-[120px]">
                    <p className="text-sm font-medium opacity-80">Envío Express</p>
                    <div>
                        <h3 className="text-xl font-bold">Despacho en 24hrs</h3>
                        <p className="text-xs opacity-70 mt-1">En productos seleccionados</p>
                    </div>
                </div>

                <div className="bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white flex flex-col justify-between min-h-[100px] sm:min-h-[120px]">
                    <p className="text-sm font-medium opacity-80">Ofertas Especiales</p>
                    <div>
                        <h3 className="text-xl font-bold">Hasta 40% OFF</h3>
                        <p className="text-xs opacity-70 mt-1">En herramientas seleccionadas</p>
                    </div>
                </div>

                <div className="bg-orange-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-orange-800 flex flex-col justify-between min-h-[100px] sm:min-h-[120px]">
                    <p className="text-sm font-medium opacity-80">Compra Segura</p>
                    <div>
                        <h3 className="text-xl font-bold">Pago con Transbank</h3>
                        <p className="text-xs opacity-70 mt-1">100% seguro y protegido</p>
                    </div>
                </div>

            </div>
        </section>
    )
}

export default PromoBanner
