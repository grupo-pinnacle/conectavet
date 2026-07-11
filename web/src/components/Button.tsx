type ButtonProps = {
  text: string;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  onClick?: () => void;
};

export default function Button({ text, variant = "primary", className = "", onClick }: ButtonProps) {
  const base = "w-full rounded-lg p-3 font-bold text-sm transition-all";
  const variants = {
    primary: "bg-[#2563EB] text-white hover:opacity-90",
    outline: "border border-[#CBD5E1] bg-white text-[#1E293B] hover:bg-gray-50",
    ghost: "bg-transparent text-[#2563EB] hover:underline",
  };

  return (
    <button type="submit" className={`${base} ${variants[variant]} ${className}`} onClick={onClick}>
      {text}
    </button>
  );
}