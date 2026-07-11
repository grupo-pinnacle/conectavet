type InputProps = {
  type: string;
  placeholder: string;
  label?: string;
  className?: string;
};

export default function Input({ type, placeholder, label, className = "" }: InputProps) {
  return (
    <div className="w-full">
      {label && <label className="mb-1 block text-xs font-bold text-[#475569] uppercase tracking-wider">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${className}`}
      />
    </div>
  );
}