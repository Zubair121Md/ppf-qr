import Image from 'next/image';

export default function PPFLogo({ size = 64, showText = true, className = '' }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <Image
        src="/ppf-logo.png"
        alt="Purple Patch Farms"
        width={size}
        height={size}
        className="rounded-full shadow-card"
        priority
      />
      {showText && (
        <div className="mt-3 text-center">
          <p className="text-xl font-bold text-ppf-purple tracking-tight">Purple Patch Farms</p>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-0.5">PPF Packing</p>
        </div>
      )}
    </div>
  );
}
