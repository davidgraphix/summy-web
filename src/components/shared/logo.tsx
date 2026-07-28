import Link from "next/link";
import Image from "next/image";
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`} aria-label="Summy home">
    <Image
  src="/summy-logo.png"
  alt="Summy logo"
  width={150}
  height={150}
/>
    
    </Link>
  );
}
