export function DevelopmentMessage() {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl md:text-6xl font-light tracking-wide">
        RPM
        <span className="block text-2xl md:text-3xl mt-2 text-gray-400">
          Accesorios
        </span>
      </h1>
      
      <div className="space-y-4">
        <p className="text-lg md:text-xl text-gray-300">
          En desarrollo
        </p>
        <p className="text-sm md:text-base text-gray-500 max-w-md mx-auto">
          Estamos trabajando para traerte la mejor experiencia en accesorios.
        </p>
      </div>
      
      <div className="pt-8">
        <div className="inline-flex items-center space-x-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-400">
            Próximamente disponible
          </span>
        </div>
      </div>
    </div>
  );
}
