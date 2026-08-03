import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Everlasting Voyage',
  description: 'An immersive focus, meditation and brainwave sync experience built around calm, clarity and premium brand atmosphere.',
  icons: {
    icon: '/icon.png'
  },
  manifest: '/manifest.webmanifest'
};

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
