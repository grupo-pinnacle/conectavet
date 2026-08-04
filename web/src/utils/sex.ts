export function formatSex(sex?: string | null): string {
  if (!sex) return "—";
  const s = String(sex).toLowerCase();
  if (s === "male" || s === "macho") return "Macho";
  if (s === "female" || s === "hembra") return "Hembra";
  return "—";
}