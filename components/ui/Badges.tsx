import { cn } from "@/lib/utils";

const platformStyles: Record<string, string> = {
  "PlayStation 5": "bg-blue-600/20 text-blue-400 border-blue-600/30",
  "PlayStation 4": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Xbox Series X/S": "bg-green-600/20 text-green-400 border-green-600/30",
  "Xbox One": "bg-green-500/20 text-green-300 border-green-500/30",
  "Nintendo Switch": "bg-red-500/20 text-red-400 border-red-500/30",
  "PC": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Other": "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const conditionStyles: Record<string, string> = {
  "Brand New": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Like New": "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "Very Good": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Good": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Acceptable": "bg-red-500/20 text-red-400 border-red-500/30",
};

export function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span
      className={cn(
        "badge border",
        platformStyles[platform] ?? platformStyles["Other"]
      )}
    >
      {platform}
    </span>
  );
}

export function ConditionBadge({ condition }: { condition: string }) {
  return (
    <span
      className={cn(
        "badge border",
        conditionStyles[condition] ?? conditionStyles["Good"]
      )}
    >
      {condition}
    </span>
  );
}
