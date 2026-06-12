'use client';

export default function DistributionTable({ distribution, onRedistribute }) {
  if (!distribution?.length) return null;

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Distribution</h2>
        <button
          type="button"
          onClick={onRedistribute}
          className="px-4 py-2 bg-farm-green text-white rounded-lg text-sm"
        >
          Re-distribute
        </button>
      </div>
      <table className="w-full text-sm border bg-white rounded-xl overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Worker</th>
            <th className="p-3 text-left">Assigned Orders</th>
            <th className="p-3 text-left">Assigned kg</th>
            <th className="p-3 text-left">Packed</th>
            <th className="p-3 text-left">Remaining</th>
          </tr>
        </thead>
        <tbody>
          {distribution.map((d) => (
            <tr key={d.worker_id} className="border-t">
              <td className="p-3">{d.full_name}</td>
              <td className="p-3">{d.order_count}</td>
              <td className="p-3">{d.assigned_kg}</td>
              <td className="p-3">{d.packed_kg}</td>
              <td className="p-3">{d.assigned_kg - d.packed_kg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
