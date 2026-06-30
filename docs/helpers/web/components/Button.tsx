import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  text: string;
  variant?: "primary" | "danger" | "ghost";
};

export default function Button({ text, variant = "primary", disabled, ...props }: ButtonProps) {
  const base = "w-full rounded p-2 text-white font-medium transition-colors";

  const variants = {
    primary: "bg-[#5460c4] hover:bg-[#6D7CFF]",
    danger: "bg-red-500 hover:bg-red-600",
    ghost: "bg-gray-200 text-gray-700 hover:bg-gray-300",
  };

  return (
    <button
      {...props}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {text}
    </button>
  );
}
