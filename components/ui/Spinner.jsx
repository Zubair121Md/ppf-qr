export default function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizes[size]} border-3 border-farm-green/20 border-t-farm-green rounded-full animate-spin`}
        style={{ borderWidth: '3px' }}
      />
    </div>
  );
}
