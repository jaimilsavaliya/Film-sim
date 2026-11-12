import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FilmSim - Film Simulation Editor",
  description: "Apply authentic film looks to your photos. 23+ film stocks including Portra, Velvia, Tri-X, CineStill and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
