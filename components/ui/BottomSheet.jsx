'use client';

export default function BottomSheet({ open, onClose, children }) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-sheet safe-bottom max-h-[90dvh] overflow-y-auto">
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2" />
        {children}
      </div>
    </>
  );
}
