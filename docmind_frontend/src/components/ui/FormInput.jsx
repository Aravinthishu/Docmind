export default function FormInput({ icon: Icon, error, className = '', ...props }) {
  return (
    <div>
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-500" />}
        <input
          {...props}
          className={`w-full bg-forest-800/60 border rounded-lg py-2.5 text-white placeholder-forest-500 focus:outline-none focus:ring-2 focus:ring-gold-500 transition ${Icon ? 'pl-10 pr-4' : 'px-4'} ${error ? 'border-red-500/50' : 'border-forest-700'} ${className}`}
        />
      </div>
      {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
    </div>
  )
}