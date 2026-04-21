import { cn } from "~/lib/utils";

interface FinancialDisplayProps {
  amount: number | string;
  currency?: string;
  type?: "income" | "expense" | "neutral" | "auto";
  className?: string;
  showSign?: boolean;
}

export function FinancialDisplay({
  amount,
  currency = "Rp",
  type = "neutral",
  className,
  showSign = true,
}: FinancialDisplayProps) {
  const numValue = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  const absValue = Math.abs(numValue);
  
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(absValue);

  let sign = "";
  let finalType = type;
  
  if (type === "auto") {
      finalType = numValue >= 0 ? "income" : "expense";
  }

  if (showSign) {
    if (numValue > 0) sign = "+";
    if (numValue < 0) sign = "-";
  }

  return (
    <span
      className={cn(
        "font-semibold tracking-tight font-mono",
        finalType === "income" && "text-emerald-600 dark:text-emerald-500",
        finalType === "expense" && "text-destructive",
        finalType === "neutral" && "text-foreground",
        className
      )}
    >
      {sign} {currency} {formatted}
    </span>
  );
}
