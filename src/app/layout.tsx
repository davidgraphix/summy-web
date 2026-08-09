import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: { default: "Summy Solutions - Shop electronics & appliances in Nigeria", template: "%s · Summy" },
  description: "Genuine TVs, refrigerators, air conditioners and appliances with nationwide delivery. Summy Solution & Technology Ventures.",
  openGraph: { title: "Summy", type: "website", locale: "en_NG" },
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
