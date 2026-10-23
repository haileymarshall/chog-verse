import type { Metadata, Viewport } from "next";
import { Anton, Archivo, JetBrains_Mono, Lilita_One, Manrope, Nunito, Pixelify_Sans, Space_Mono, VT323 } from "next/font/google";
import { Providers } from "@/components/verse/providers";
import { SKIN_BOOT } from "@/lib/verse/skin";
import "./globals.css";
import "./skins.css";

const display = Lilita_One({
  variable: "--font-lilita",
  subsets: ["latin"],
  weight: "400",
});

const mono = Space_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const body = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

// Arcade skin
const pixel = Pixelify_Sans({ variable: "--font-pixel", subsets: ["latin"], preload: false });
const crt = VT323({ variable: "--font-crt", subsets: ["latin"], weight: "400", preload: false });

// Cinematic skin
const anton = Anton({ variable: "--font-anton", subsets: ["latin"], weight: "400", preload: false });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], preload: false });
const jet = JetBrains_Mono({ variable: "--font-jet", subsets: ["latin"], preload: false });

export const metadata: Metadata = {
  title: "Chog Verse",
  description: "The Bank holds the $CHOG. Team up with 3 other Chogs and get it out.",
};

export const viewport: Viewport = {
  themeColor: "#07061a",
};

const fonts = [display, body, mono, pixel, crt, anton, archivo, manrope, jet].map((f) => f.variable).join(" ");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fonts} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SKIN_BOOT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
        <div className="skin-fx" aria-hidden />
      </body>
    </html>
  );
}
