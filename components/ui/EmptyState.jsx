export default function EmptyState({ icon = '📦', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      {description && <p className="text-gray-500 text-sm max-w-xs">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
