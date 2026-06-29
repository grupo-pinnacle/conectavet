import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  text: string;
};

export default function Button({ text, ...props }: ButtonProps) {
  return (
    <button
      type="submit"
      {...props}
      className="w-full rounded bg-[#5460c4] p-2 text-white hover:bg-[#6D7CFF]"
    >
      {text}
    </button>
  );
}
