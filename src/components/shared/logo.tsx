import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Mega Dealers home"
      className={cn(
        "group flex shrink-0 items-center justify-center",
        className,
      )}
    >
      <Image
        src="/mega-dealers-logo.PNG"
        alt="Mega Dealers"
        width={380}
        height={380}
        priority
        className="
          h-[105px] w-[285px]
          object-contain
          transition-transform duration-200
          group-hover:scale-[1.02]
          sm:h-[115px] sm:w-[315px]
          md:h-[125px] md:w-[350px]
          lg:h-[140px] lg:w-[390px]
        "
      />
    </Link>
  );
}
