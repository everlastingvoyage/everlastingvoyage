import type { Metadata, Viewport } from 'next';
import './globals.css';
import './v9-1.css';
import './v10-engine.css';
import './v10-polish.css';
import './v10-saved-spaces.css';
import './v10-product-flow.css';
import './v10-iphone-fixes.css';
import './v10-3-polish.css';
import './v10-3-mobile-brand.css';
import './v10-4-desktop-brand.css';
import './v10-5-builder-cta.css';
import './v10-6-completion-flow.css';
import './v10-7-frequency-chamber.css';
import './v10-7-frequency-chamber-safari.css';
import './v10-8-blue-chamber-refinement.css';
import './v10-9-compact-chamber.css';
import './v10-10-mobile-chamber-polish.css';
import './v10-11-mobile-labels-chamber-blend.css';
import './v10-12-mobile-stability.css';
import './v10-13-foundation.css';
import './v11-1-ambient-mixer.css';
import './v11-2-live-session-atmosphere.css';
import './v11-3-precision-audio.css';
import './v11-4-real-field-recordings.css';
import './v11-5-session-ux.css';
import './v11-6-completion-layout.css';
import './v11-7-completion-clarity.css';
import './v11-8-completion-polish.css';
import './v12-0-desktop-session-console.css';
import HumanoidSwap from './HumanoidSwap';
import SignalChamberPolish from './SignalChamberPolish';
import SignalChamberBlend from './SignalChamberBlend';
import FrequencyChamberExperience from './FrequencyChamberExperience';
import IOSAudioReliability from './IOSAudioReliability';
import V10VoyageEngine from './V10VoyageEngine';
import V10SessionPolish from './V10SessionPolish';
import V10SavedSpaces from './V10SavedSpaces';
import V10Notes from './V10Notes';
import EntranceGate from './EntranceGate';
import V10ProductFlow from './V10ProductFlow';
import FrequencyPowerDetails from './FrequencyPowerDetails';
import V10SessionUtilities from './V10SessionUtilities';
import V10CompletionFlow from './V10CompletionFlow';
import V11AmbientMixer from './V11AmbientMixer';
import V11SessionAtmosphere from './V11SessionAtmosphere';
import V11ContinueVoyageBehavior from './V11ContinueVoyageBehavior';
import V11SessionExitGuard from './V11SessionExitGuard';
import V11CompletionSaveSpace from './V11CompletionSaveSpace';

export const metadata: Metadata = {
  title: 'Everlasting Voyage — Pure Frequencies & Focus Sessions',
  description: 'Choose your state, set your time and enter an immersive focus session with pure frequencies, a Pomodoro timer and distraction-free intention.',
  icons: {
    icon: '/icon.png'
  },
  manifest: '/manifest.webmanifest'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#020a17',
  colorScheme: 'dark'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <EntranceGate />
        <HumanoidSwap />
        {children}
        <SignalChamberPolish />
        <SignalChamberBlend />
        <FrequencyChamberExperience />
        <IOSAudioReliability />
        <V10VoyageEngine />
        <V10SessionPolish />
        <V10SavedSpaces />
        <V10Notes />
        <V10ProductFlow />
        <V11AmbientMixer />
        <V11SessionAtmosphere />
        <V11SessionExitGuard />
        <V11ContinueVoyageBehavior />
        <FrequencyPowerDetails />
        <V10SessionUtilities />
        <V11CompletionSaveSpace />
        <V10CompletionFlow />
      </body>
    </html>
  );
}
