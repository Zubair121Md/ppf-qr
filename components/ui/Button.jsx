const VARIANTS = {
  primary: 'bg-farm-green text-white active:bg-farm-green-dark disabled:opacity-50',
  secondary: 'bg-white text-farm-green border-2 border-farm-green active:bg-surface-muted',
  danger: 'bg-red-600 text-white active:bg-red-700',
  ghost: 'bg-transparent text-farm-green active:bg-surface-muted',
  dark: 'bg-gray-900 text-white active:bg-gray-800',
};

const SIZES = {
  sm: 'h-10 px-4 text-sm rounded-xl',
  md: 'h-touch px-5 text-base rounded-2xl',
  lg: 'h-14 px-6 text-lg rounded-2xl font-semibold',
  xl: 'h-16 px-8 text-xl rounded-2xl font-bold',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  fullWidth = false,
  ...props
}) {
  return (
    <button
      type="button"
      className={`
        touch-target card-press font-medium transition-colors
        ${VARIANTS[variant] || VARIANTS.primary}
        ${SIZES[size] || SIZES.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
