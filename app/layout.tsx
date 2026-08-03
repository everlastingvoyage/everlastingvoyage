import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Everlasting Voyage",
  description: "A calmer way to plan, adapt and focus.",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#020814",
  colorScheme: "dark"
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
