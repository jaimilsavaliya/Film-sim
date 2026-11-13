import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FILMSIM // 35MM OPTICAL ARCHIVE & DARKROOM STUDIO",
  description: "Brutalist photographic darkroom & silver halide emulation engine. Authentic 3D-LUT film profiles, Camera RAW matrix decoding, and millimeter-accurate instant and exhibition prints.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=JetBrains+Mono:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700;800&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-black text-white antialiased font-mono selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
