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
      <rect x="0.5" y="0.5" width="47" height="47" rx="11" fill="#0F766E" />
      <circle cx="24" cy="24" r="16" fill="white" />
      <path d="M16 28c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="18" cy="20" r="2" fill="#0F766E" />
      <circle cx="30" cy="20" r="2" fill="#0F766E" />
      <path d="M20 30c1 1.5 2.5 2 4 2s3-0.5 4-2" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" />
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
