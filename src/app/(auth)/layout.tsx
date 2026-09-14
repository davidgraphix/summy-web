import { LEGAL_NAME } from "@/lib/brand";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between px-4 sm:px-8">
        <Logo />
        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Back to shop
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
      {/*
        The old line carried "BN-3217879", the previous entity's Business Name
        registration. Mega Dealers Global Limited is a limited company, so that
        number does not carry over — it would have an RC number instead, which
        has not been supplied. Showing the old BN against the new name would be a
        false registration claim, so only the legal name is displayed until the
        RC number is provided.
      */}
      <footer className="py-6 text-center text-xs text-muted-foreground">
        {LEGAL_NAME}
      </footer>
    </div>
  );
}
