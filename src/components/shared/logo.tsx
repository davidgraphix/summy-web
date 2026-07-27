import Link from "next/link";
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`} aria-label="Summy home">
      <span className="text-xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.03em" }}>SUMMY</span>
      <span className="grid h-6 w-6 place-items-center rounded-full"
        style={{ background: "conic-gradient(from 210deg, hsl(var(--accent)), hsl(var(--primary)))" }}>
        <span className="h-1.5 w-1.5 rotate-45 rounded-[2px] bg-white" />
      </span>
    </Link>
  );
}
