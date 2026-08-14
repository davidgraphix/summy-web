import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The Summy wordmark, sized by CSS rather than by its intrinsic dimensions.
 *
 * <p>
 * The <code>width</code>/<code>height</code> props are the image's real aspect
 * ratio and exist so Next can reserve space and avoid layout shift — they are
 * <em>not</em> the rendered size. That distinction matters: this previously
 * rendered a fixed 150&times;150 box inside a 64px-tall header, which on a 320px
 * phone claimed nearly half the header width and pushed the icon buttons into a
 * cramped strip. The height is now capped and the width follows the aspect
 * ratio, so the mark scales with the header instead of dictating it.
 * </p>
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Summy home"
      className={cn("flex shrink-0 items-center gap-2", className)}
    >
      <Image
        src="/summy-logo.png"
        alt="Summy Solutions & Technology"
        width={150}
        height={150}
        // Eager + high priority: the logo is above the fold on every page, and
        // lazy-loading it produces a visible pop-in on the first paint.
        priority
        className="h-8 w-auto sm:h-9"
      />
    </Link>
  );
}
