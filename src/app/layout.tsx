import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { BRAND_NAME, BRAND_TAGLINE, LEGAL_NAME, SITE_URL } from "@/lib/brand";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  // metadataBase is only set when the domain is actually known. Next warns and
  // falls back to a relative base without it, which is correct while the new
  // domain is pending — a guessed absolute URL would be worse than none.
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title: {
    default: `${BRAND_NAME} - ${BRAND_TAGLINE}`,
    template: `%s · ${BRAND_NAME}`,
  },
  description:
    "Genuine TVs, refrigerators, air conditioners and appliances with nationwide delivery. "
    + `${LEGAL_NAME}.`,
  openGraph: {
    title: BRAND_NAME,
    description: `Genuine electronics and appliances with nationwide delivery. ${LEGAL_NAME}.`,
    siteName: BRAND_NAME,
    type: "website",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_NAME,
    description: `Genuine electronics and appliances with nationwide delivery. ${LEGAL_NAME}.`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
