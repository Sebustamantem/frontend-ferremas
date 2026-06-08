const Hero = () => {
  return (
    <section className="w-full">
      <div className="w-full sm:max-w-[1450px] sm:mx-auto sm:px-6 lg:px-8 xl:px-10 pt-0 md:pt-4">

        <div className="w-full h-[180px] sm:h-[240px] md:h-[320px] lg:h-[400px] xl:h-[450px] rounded-none sm:rounded-3xl shadow-2xl brand-gradient flex items-center justify-center text-white text-center px-4 sm:px-6">

          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold drop-shadow-sm">
              Bienvenido a Ferramas
            </h1>

            <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-white/95">
              Encuentra herramientas, materiales y productos para tu construcción.
            </p>
          </div>

        </div>

      </div>
    </section>
  )
}

export default Hero
