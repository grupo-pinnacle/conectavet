import { View, Text, ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export function Card({ children, className = "", ...props }: ViewProps & { children: React.ReactNode }) {
  return (
    <View
      className={cn("bg-white border border-border rounded-lg p-4 shadow-sm", className)}
      {...props}
    >
      {children}
    </View>
  );
}

export function StatCard({
  label,
  value,
  icon,
  className = "",
}: { label: string; value: string | number; icon?: React.ReactNode; className?: string }) {
  return (
    <View className={cn("bg-white border border-border rounded-lg p-4 flex-1", className)}>
      <View className="flex-row items-start justify-between mb-2">
        <Text className="text-xs text-ink-soft font-medium flex-1">{label}</Text>
        {icon && <View className="w-7 h-7 rounded-full bg-surface items-center justify-center">{icon}</View>}
      </View>
      <Text className="text-2xl font-bold text-ink">{value}</Text>
    </View>
  );
}