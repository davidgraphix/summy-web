import { LEGAL_NAME } from "@/lib/brand";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* =========================================================
          AUTH HEADER
      ========================================================= */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Compact Auth Logo */}
          <Logo
            className="
              [&_img]:h-[54px]
              [&_img]:w-[155px]
              sm:[&_img]:h-[58px]
              sm:[&_img]:w-[170px]
            "
          />

          {/* Back to Shop */}
          <Link
            href="/"
            className="
              inline-flex
              items-center
              rounded-lg
              border border-border/70
              bg-background
              px-3.5
              py-2
              text-sm
              font-medium
              text-muted-foreground
              shadow-sm
              transition-all
              duration-200
              hover:border-primary/30
              hover:bg-muted
              hover:text-foreground
              hover:shadow-md
              active:scale-[0.98]
              sm:px-4
            "
          >
            Back to shop
          </Link>
        </div>
      </header>

      {/* =========================================================
          AUTH CONTENT
      ========================================================= */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="border-t border-border/60 px-4 py-5 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {LEGAL_NAME}
        </p>
      </footer>
    </div>
  );
}