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
      <rect x="0.5" y="0.5" width="47" height="47" rx="11" fill="#2563EB" />
      <rect x="19" y="8" width="10" height="32" rx="4" fill="white" />
      <rect x="8" y="19" width="32" height="10" rx="4" fill="white" />
      <circle cx="24" cy="24" r="5" fill="#16A34A" />
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
        <span className="text-[#2563EB]">Vet</span>
        <span className="text-[#16A34A]">Connect</span>
      </span>
    </span>
  );
}
