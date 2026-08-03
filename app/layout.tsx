import type { Metadata, Viewport } from 'next';
import './globals.css';
import './v9-1.css';

export const metadata: Metadata = {
  title: 'Everlasting Voyage — Pure Frequencies & Focus Sessions',
  description: 'Choose your state, set your time and enter an immersive focus session with pure frequencies, a Pomodoro timer and distraction-free intention.',
  icons: {
    icon: '/icon.png'
  },
  manifest: '/manifest.webmanifest'
};

export const viewport: Viewport = {
  themeColor: '#020a17',
  colorScheme: 'dark'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
