import { Star } from "lucide-react";

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: string;
}

export default function StarRatingInput({ value, onChange, size = "h-7 w-7" }: StarRatingInputProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5" role="radiogroup" aria-label="Calificación de 1 a 5">
      {[1, 2, 3, 4, 5].map((i) => {
        const active = i <= value;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className="rounded p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            aria-label={`${i} ${i === 1 ? "estrella" : "estrellas"} de 5`}
            aria-checked={active}
            role="radio"
          >
            <Star className={`${size} ${active ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
          </button>
        );
      })}
    </div>
  );
}
