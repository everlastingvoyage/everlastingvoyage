'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { requestAmbientRestore } from './ambient-mixer-store';

type AudioWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
  __evAudioContexts?: Set<AudioContext>;
  __evNativeAudioContext?: typeof AudioContext;
  __evWrappedAudioContext?: typeof AudioContext;
};

type AudioNavigator = Navigator & {
  audioSession?: { type: string };
};

const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAgICA';

function primeContext(context: AudioContext) {
  if (context.state === 'closed') return;

  try {
    if (context.state !== 'running') {
      void context.resume().catch(() => undefined);
    }

    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = context.createBuffer(1, 1, context.sampleRate || 44100);
    gain.gain.setValueAtTime(0.000001, context.currentTime);
    source.connect(gain);
    gain.connect(context.destination);
    source.addEventListener('ended', () => {
      source.disconnect();
      gain.disconnect();
    });
    source.start(context.currentTime);
  } catch {
    // The real session button remains the final audio activation gesture.
  }
}

export default function IOSAudioReliability() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/voyage') return;

    const audioWindow = window as AudioWindow;
    const NativeAudioContext =
      audioWindow.__evNativeAudioContext ??
      audioWindow.AudioContext ??
      audioWindow.webkitAudioContext;

    if (!NativeAudioContext) return;

    const contexts = audioWindow.__evAudioContexts ?? new Set<AudioContext>();
    audioWindow.__evAudioContexts = contexts;
    audioWindow.__evNativeAudioContext = NativeAudioContext;

    if (!audioWindow.__evWrappedAudioContext) {
      const WrappedAudioContext = function AudioContext(
        options?: AudioContextOptions
      ) {
        const context = new NativeAudioContext(options);
        contexts.add(context);
        primeContext(context);
        context.addEventListener('statechange', () => {
          if (context.state === 'closed') {
            contexts.delete(context);
            return;
          }
          if (context.state === 'suspended' && document.querySelector('.v10SessionOverlay.running')) {
            requestAmbientRestore();
          }
        });
        return context;
      } as unknown as typeof AudioContext;

      Object.setPrototypeOf(WrappedAudioContext, NativeAudioContext);
      WrappedAudioContext.prototype = NativeAudioContext.prototype;
      audioWindow.__evWrappedAudioContext = WrappedAudioContext;
      audioWindow.AudioContext = WrappedAudioContext;
      audioWindow.webkitAudioContext = WrappedAudioContext;
    }

    let silentMedia: HTMLAudioElement | null = null;
    let lastPrime = 0;

    const primeMediaSession = () => {
      const audioNavigator = navigator as AudioNavigator;
      try {
        if (audioNavigator.audioSession) audioNavigator.audioSession.type = 'playback';
      } catch {
        // Older iOS versions do not expose Audio Session controls.
      }

      if (!silentMedia) {
        silentMedia = document.createElement('audio');
        silentMedia.src = SILENT_WAV;
        silentMedia.preload = 'auto';
        silentMedia.setAttribute('playsinline', '');
        silentMedia.setAttribute('webkit-playsinline', '');
        silentMedia.volume = 0.01;
        silentMedia.setAttribute('aria-hidden', 'true');
        silentMedia.style.position = 'fixed';
        silentMedia.style.width = '1px';
        silentMedia.style.height = '1px';
        silentMedia.style.opacity = '0';
        silentMedia.style.pointerEvents = 'none';
        document.body.appendChild(silentMedia);
      }

      const playback = silentMedia.play();
      if (playback) {
        void playback
          .then(() => {
            window.setTimeout(() => {
              silentMedia?.pause();
              if (silentMedia) silentMedia.currentTime = 0;
            }, 80);
          })
          .catch(() => undefined);
      }
    };

    const primeEverything = () => {
      const now = Date.now();
      if (now - lastPrime < 180) return;
      lastPrime = now;
      primeMediaSession();
      contexts.forEach(primeContext);
    };

    const handleActivation = (event: Event) => {
      const target = event.target as Element | null;
      if (!target) return;
      const relevantControl = target.closest(
        '.v10PrimaryAction, .builderActions .primaryButton, .v10AudioControls button, .signalNode, .signalPopupAction, .evSessionAtmosphereToggle, .evSessionAtmosphereLevels, .evAtmosphereSheetActions button, .evAtmosphereRestoreNotice button'
      );
      if (relevantControl) primeEverything();
    };

    const markRestoreIfNeeded = () => {
      if (!document.querySelector('.v10SessionOverlay.running')) return;
      if (Array.from(contexts).some((context) => context.state !== 'running')) requestAmbientRestore();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') markRestoreIfNeeded();
    };

    document.addEventListener('pointerdown', handleActivation, true);
    document.addEventListener('touchend', handleActivation, true);
    document.addEventListener('click', handleActivation, true);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', markRestoreIfNeeded);
    window.addEventListener('focus', markRestoreIfNeeded);

    return () => {
      document.removeEventListener('pointerdown', handleActivation, true);
      document.removeEventListener('touchend', handleActivation, true);
      document.removeEventListener('click', handleActivation, true);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', markRestoreIfNeeded);
      window.removeEventListener('focus', markRestoreIfNeeded);
      silentMedia?.remove();
    };
  }, [pathname]);

  return null;
}
