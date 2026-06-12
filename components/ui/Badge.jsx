const STATUS_STYLES = {
  PENDING: 'bg-gray-100 text-gray-700',
  ASSIGNED: 'bg-blue-50 text-blue-700',
  PACKING: 'bg-amber-50 text-amber-800',
  PACKED: 'bg-green-50 text-green-700',
  ERROR: 'bg-red-50 text-red-700',
};

export default function Badge({ children, status, className = '' }) {
  const style = status ? STATUS_STYLES[status] || STATUS_STYLES.PENDING : 'bg-gray-100 text-gray-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${style} ${className}`}>
      {children}
    </span>
  );
}
