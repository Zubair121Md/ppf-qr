export default function Input({
  label,
  error,
  className = '',
  inputClassName = '',
  ...props
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        className={`
          w-full h-touch px-4 rounded-2xl border border-gray-200 bg-white
          focus:outline-none focus:ring-2 focus:ring-farm-green focus:border-transparent
          placeholder:text-gray-400
          ${error ? 'border-red-400' : ''}
          ${inputClassName}
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
