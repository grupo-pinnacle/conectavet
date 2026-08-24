interface LogoProps {
  size?: "sm" | "md" | "lg";
  layout?: "horizontal" | "vertical";
  showIcon?: boolean;
}

const sizes = {
  sm: { icon: 28, text: "text-lg", gap: "gap-2" },
  md: { icon: 36, text: "text-xl", gap: "gap-2.5" },
  lg: { icon: 48, text: "text-3xl", gap: "gap-3" },
};

function LogoIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <rect width="48" height="48" rx="10" fill="#0F766E" />
      <path
        d="M24 15C24 15 19 9 14 9C9.5 9 7 12 7 17C7 23 24 39 24 39C24 39 41 23 41 17C41 12 38.5 9 34 9C29 9 24 15 24 15Z"
        fill="white"
      />
    </svg>
  );
}

export default function Logo({
  size = "md",
  layout = "horizontal",
  showIcon = true,
}: LogoProps) {
  const s = sizes[size];

  return (
    <span
      className={`inline-flex items-center ${s.gap} ${layout === "vertical" ? "flex-col" : "flex-row"}`}
    >
      {showIcon && <LogoIcon size={s.icon} />}
      <span
        className={`font-extrabold ${s.text}`}
        style={{ letterSpacing: "-0.02em", fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <span className="text-[#0F766E]">Vet</span>
        <span className="text-[#16A34A]">Connect</span>
      </span>
    </span>
  );
}
