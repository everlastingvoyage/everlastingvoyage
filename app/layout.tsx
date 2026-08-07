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
import './v12-0-1-desktop-footer-spacing.css';
import './v12-0-2-readable-sounds-session-brand.css';
import './v12-1-audio-reliability.css';
import './v12-1-1-readability-chamber-ocean.css';
import './v12-1-2-chamber-rectangle-removal.css';
import './v12-1-3-popup-motion-polish.css';
import './v12-1-4-session-layout-navigation.css';
import './v12-1-5-session-footer-cleanup.css';
import './v12-5-3-surgical.css';
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
import V12SessionBrandFooter from './V12SessionBrandFooter';
import V12SessionHistoryNavigation from './V12SessionHistoryNavigation';
import V12DesktopAtmosphereFlow from './V12DesktopAtmosphereFlow';
import V1253Surgical from './V1253Surgical';

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
        <V12SessionHistoryNavigation />
        <V10VoyageEngine />
        <V10SessionPolish />
        <V10SavedSpaces />
        <V10Notes />
        <V10ProductFlow />
        <V1253Surgical />
        <V11AmbientMixer />
        <V11SessionAtmosphere />
        <V12DesktopAtmosphereFlow />
        <V12SessionBrandFooter />
        <V11SessionExitGuard />
        <V11ContinueVoyageBehavior />
        <FrequencyPowerDetails />
        <V10SessionUtilities />
        <V11CompletionSaveSpace />
        <V10CompletionFlow />
        <style id="v12-3-premium-tier-colors">{`
          .evPremiumSignalCard.free {
            border-color: rgba(76, 216, 255, .54) !important;
            background: radial-gradient(circle at 82% 8%, rgba(41, 190, 255, .18), transparent 34%), linear-gradient(155deg, rgba(7, 40, 67, .96), rgba(3, 15, 31, .98)) !important;
            box-shadow: inset 0 1px 0 rgba(171, 239, 255, .08), 0 14px 36px rgba(0, 116, 177, .08);
          }
          .evPremiumSignalCard.free:hover {
            border-color: rgba(96, 226, 255, .8) !important;
            box-shadow: 0 20px 46px rgba(0, 153, 219, .16), inset 0 0 34px rgba(55, 199, 255, .07) !important;
          }
          .evPremiumSignalCard.free .evSignalCardTopline {
            color: #8be8ff !important;
          }
          .evPremiumSignalCard.free .evSignalCardTopline > span {
            padding: 5px 8px;
            border-radius: 999px;
            border: 1px solid rgba(91, 221, 255, .32);
            background: rgba(22, 155, 205, .13);
          }
          .evPremiumSignalCard.free .evSignalCardTopline i {
            color: #c7f7ff !important;
            border-color: rgba(95, 225, 255, .46) !important;
            background: rgba(31, 181, 224, .12);
          }
          .evPremiumSignalCard.free .evSignalPurpose,
          .evPremiumSignalCard.free .evSignalAction {
            color: #80e6ff !important;
          }
          .evPremiumSignalCard.premium {
            border-color: rgba(235, 193, 105, .48) !important;
            background: radial-gradient(circle at 84% 7%, rgba(247, 195, 91, .18), transparent 35%), linear-gradient(155deg, rgba(29, 23, 24, .97), rgba(7, 9, 20, .99)) !important;
            box-shadow: inset 0 1px 0 rgba(255, 238, 199, .065), 0 16px 42px rgba(128, 84, 16, .11);
          }
          .evPremiumSignalCard.premium:hover {
            border-color: rgba(255, 219, 142, .74) !important;
            box-shadow: 0 22px 52px rgba(175, 119, 25, .20), inset 0 0 36px rgba(245, 191, 83, .065) !important;
          }
          .evPremiumSignalCard.premium .evSignalCardTopline {
            color: #ffe0a4 !important;
          }
          .evPremiumSignalCard.premium .evSignalCardTopline > span {
            padding: 5px 8px;
            border-radius: 999px;
            border: 1px solid rgba(239, 196, 126, .34);
            color: #ffdca0;
            background: linear-gradient(135deg, rgba(155, 96, 37, .16), rgba(230, 172, 66, .10));
          }
          .evPremiumSignalCard.premium .evSignalCardTopline i {
            color: #ffd99a !important;
            border-color: rgba(236, 190, 109, .42) !important;
            background: rgba(146, 91, 44, .12);
            box-shadow: 0 0 18px rgba(214, 151, 70, .09);
          }
          .evPremiumSignalCard.premium > b {
            color: #f7f0ff !important;
          }
          .evPremiumSignalCard.premium .evSignalPurpose {
            color: #ffe1a4 !important;
          }
          .evPremiumSignalCard.premium .evSignalAction {
            color: #ffd99a !important;
          }
          .evPremiumSignalCard.premium:after {
            background: linear-gradient(135deg, #f4c362, #d79631) !important;
            opacity: .24 !important;
          }
          .evPremiumSignalCard.premium.futuristic:after {
            background: linear-gradient(135deg, #f6cb6f, #55cdf4) !important;
          }
          .evPremiumSignalCard.premium.ritual:after {
            background: linear-gradient(135deg, #f7d27d, #e5a33e) !important;
            opacity: .3 !important;
          }
        `}</style>
      </body>
    </html>
  );
}
