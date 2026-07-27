import { Star } from "lucide-react";
export function Rating({ value = 0, count, size = 14 }: { value?: number; count?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <span className="inline-flex">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} width={size} height={size} strokeWidth={0}
            className={i < Math.round(value) ? "fill-accent" : "fill-border"} />
        ))}
      </span>
      {typeof count === "number" && <span>({count})</span>}
    </span>
  );
}
