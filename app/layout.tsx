import type { Metadata, Viewport } from 'next';
import './globals.css';
import './v9-1.css';
import './v10-engine.css';
import './v10-polish.css';
import './v10-saved-spaces.css';
import HumanoidSwap from './HumanoidSwap';
import SignalChamberPolish from './SignalChamberPolish';
import SignalChamberBlend from './SignalChamberBlend';
import V10VoyageEngine from './V10VoyageEngine';
import V10SessionPolish from './V10SessionPolish';
import V10SavedSpaces from './V10SavedSpaces';

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
      <body>
        <HumanoidSwap />
        {children}
        <SignalChamberPolish />
        <SignalChamberBlend />
        <V10VoyageEngine />
        <V10SessionPolish />
        <V10SavedSpaces />
      </body>
    </html>
  );
}
