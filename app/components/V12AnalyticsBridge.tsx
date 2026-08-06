'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ambientCatalog, type AmbientId } from '../ambient-catalog';
import {
  readAmbientMix,
  readAmbientRuntime,
  subscribeToAmbientCommands,
  subscribeToAmbientMix,
  subscribeToAmbientRuntime
} from '../ambient-mixer-store';
import type { AmbientLayerRuntimeState } from '../ambient-runtime';
import { analyticsClient } from '../lib/analytics/analytics-client';
import {
  activeMinutesBucket,
  activeVoyageMilliseconds,
  beginVoyageRuntime,
  clearVoyageRuntime,
  durationBucket,
  elapsedBucket,
  eventOnce,
  getVoyageRuntime,
  incrementThoughtCount,
  markAtmosphereLayerUsed,
  markVoyageAbandoned,
  markVoyageCompleted,
  pauseVoyageRuntime,
  resumeVoyageRuntime
} from '../lib/analytics/analytics-events';

type StateId = 'alpha' | 'gamma' | 'theta' | 'delta' | 'abundance';
type ExitMethod = 'end_session' | 'browser_back' | 'page_hidden' | 'navigation' | 'unknown';

const STATE_IDS: StateId[] = ['alpha', 'gamma', 'theta', 'delta', 'abundance'];
const COMPLETION_SURFACE_SELECTOR = '.v10SessionOverlay, .v10Completion';

function selectedState(): StateId {
  const active = document.querySelector<HTMLElement>('.stateChoice.active');
  return STATE_IDS.find((id) => active?.classList.contains(id)) ?? 'alpha';
}

function selectedDuration(): number {
  const text = document.querySelector<HTMLElement>('.durationRow button.active')?.textContent ?? '25';
  return Number.parseInt(text, 10) || 25;
}

function enabledAtmosphereCount(): number {
  return readAmbientMix().layers.filter((layer) => layer.enabled).length;
}

function layerType(id: AmbientId): 'procedural_noise' | 'field_recording' {
  return ambientCatalog[id].sourceType === 'procedural-noise' ? 'procedural_noise' : 'field_recording';
}

function sourceAttempt(state: AmbientLayerRuntimeState | undefined): 'primary' | 'fallback' {
  return state?.source === 'fallback' ? 'fallback' : 'primary';
}

function failureCode(message: string | undefined): string {
  const value = (message ?? '').toLowerCase();
  if (/network|fetch|offline|connection|timeout/.test(value)) return 'network';
  if (/decode|encoding|media/.test(value)) return 'decode';
  if (/notallowed|gesture|blocked|permission/.test(value)) return 'playback_blocked';
  if (/404|unavailable|source|missing/.test(value)) return 'source_unavailable';
  return 'unknown';
}

function stateFromSavedCard(card: Element | null): StateId {
  return STATE_IDS.find((id) => card?.classList.contains(id)) ?? selectedState();
}

function durationFromSavedCard(card: Element | null): number {
  const values = Array.from(card?.querySelectorAll<HTMLElement>('.evSavedSpaceMeta span') ?? []);
  const duration = values.map((item) => Number.parseInt(item.textContent ?? '', 10)).find(Number.isFinite);
  return duration || selectedDuration();
}

function atmosphereCountFromSavedCard(card: Element | null): number {
  const text = Array.from(card?.querySelectorAll<HTMLElement>('.evSavedSpaceMeta span') ?? [])
    .map((item) => item.textContent ?? '')
    .find((item) => /atmosphere/i.test(item));
  return Number.parseInt(text ?? '0', 10) || 0;
}

function nodeContainsCompletionSurface(node: Node): boolean {
  if (!(node instanceof Element)) return false;
  return node.matches(COMPLETION_SURFACE_SELECTOR) || Boolean(node.querySelector(COMPLETION_SURFACE_SELECTOR));
}

function mutationAffectsCompletion(mutation: MutationRecord): boolean {
  if (mutation.type === 'attributes') {
    return mutation.target instanceof Element && mutation.target.matches('.v10SessionOverlay');
  }

  return [...mutation.addedNodes, ...mutation.removedNodes].some(nodeContainsCompletionSurface);
}

export default function V12AnalyticsBridge() {
  const pathname = usePathname();
  const pendingSavedRestoreRef = useRef(false);
  const pendingStateSourceRef = useRef<'builder' | 'chamber' | 'saved_space'>('builder');

  useEffect(() => {
    if (pathname !== '/voyage') return;

    let previousMix = readAmbientMix().layers;
    let previousRuntime = readAmbientRuntime().layers;
    let completionElement: HTMLElement | null = null;
    let completionFrame: number | null = null;

    const captureAbandonment = (exitMethod: ExitMethod) => {
      const active = markVoyageAbandoned();
      if (!active || !eventOnce('voyage_abandoned')) return;
      analyticsClient.capture('voyage_abandoned', {
        voyage_session_id: active.voyageSessionId,
        state: active.state,
        elapsed_bucket: elapsedBucket(activeVoyageMilliseconds()),
        exit_method: exitMethod
      });
    };

    const captureCompletion = () => {
      const active = markVoyageCompleted();
      if (!active || !eventOnce('voyage_completed')) return;
      analyticsClient.capture('voyage_completed', {
        voyage_session_id: active.voyageSessionId,
        state: active.state,
        planned_minutes: active.plannedMinutes,
        active_minutes_bucket: activeMinutesBucket(activeVoyageMilliseconds()),
        thoughts_captured_count: active.thoughtsCapturedCount,
        atmosphere_layers_used_count: active.atmosphereLayersUsed.size
      });
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;

      const stateButton = target.closest<HTMLElement>('.stateChoice');
      if (stateButton) {
        const state = STATE_IDS.find((id) => stateButton.classList.contains(id));
        if (state) {
          const source = stateButton.closest('[class*="Chamber"], [class*="chamber"]') ? 'chamber' : pendingStateSourceRef.current;
          analyticsClient.capture('state_selected', { state, source });
          pendingStateSourceRef.current = 'builder';
        }
      }

      const durationButton = target.closest<HTMLButtonElement>('.durationRow button');
      if (durationButton) {
        const duration = Number.parseInt(durationButton.textContent ?? '', 10);
        if (Number.isFinite(duration)) {
          analyticsClient.capture('duration_selected', {
            duration_minutes: duration,
            duration_bucket: durationBucket(duration)
          });
        }
      }

      const savedAction = target.closest<HTMLButtonElement>('.evSavedSpaceStart, .evSavedSpaceActions button');
      const savedCard = savedAction?.closest('.evSavedSpaceCard') ?? null;
      const isRestore = Boolean(savedAction && (
        savedAction.classList.contains('evSavedSpaceStart') || /^load$/i.test(savedAction.textContent?.trim() ?? '')
      ));
      if (isRestore && savedCard) {
        pendingSavedRestoreRef.current = true;
        pendingStateSourceRef.current = 'saved_space';
        analyticsClient.capture('saved_space_restored', {
          state: stateFromSavedCard(savedCard),
          duration_minutes: durationFromSavedCard(savedCard),
          atmosphere_count: atmosphereCountFromSavedCard(savedCard)
        });
      }

      const saveSpace = target.closest<HTMLButtonElement>('.builderActions .saveButton');
      if (saveSpace) {
        analyticsClient.capture('saved_space_created', {
          state: selectedState(),
          duration_minutes: selectedDuration(),
          atmosphere_count: enabledAtmosphereCount()
        });
      }

      const timerPrimary = target.closest<HTMLButtonElement>('.v10TimerControls .v10PrimaryAction');
      if (timerPrimary) {
        const label = timerPrimary.textContent?.trim().toLowerCase() ?? '';
        if (label.includes('pause')) {
          pauseVoyageRuntime();
        } else if (label.includes('resume')) {
          if (!getVoyageRuntime()?.started) {
            const state = selectedState();
            const duration = selectedDuration();
            const runtime = beginVoyageRuntime(state, duration);
            readAmbientMix().layers.filter((layer) => layer.enabled).forEach((layer) => markAtmosphereLayerUsed(layer.id));
            analyticsClient.capture('voyage_started', {
              voyage_session_id: runtime.voyageSessionId,
              state,
              duration_minutes: duration,
              has_intention: Boolean(document.querySelector<HTMLInputElement>('.intentionField input')?.value.trim()),
              restored_from_saved_space: pendingSavedRestoreRef.current,
              active_atmosphere_count: enabledAtmosphereCount()
            });
            pendingSavedRestoreRef.current = false;
          } else {
            resumeVoyageRuntime();
          }
        } else if (label.includes('begin')) {
          const state = selectedState();
          const duration = selectedDuration();
          const runtime = beginVoyageRuntime(state, duration);
          readAmbientMix().layers.filter((layer) => layer.enabled).forEach((layer) => markAtmosphereLayerUsed(layer.id));
          analyticsClient.capture('voyage_started', {
            voyage_session_id: runtime.voyageSessionId,
            state,
            duration_minutes: duration,
            has_intention: Boolean(document.querySelector<HTMLInputElement>('.intentionField input')?.value.trim()),
            restored_from_saved_space: pendingSavedRestoreRef.current,
            active_atmosphere_count: enabledAtmosphereCount()
          });
          pendingSavedRestoreRef.current = false;
        }
      }

      if (target.closest('.v10TimerControls .v10TextAction')) captureAbandonment('end_session');

      if (target.closest('.v10CloseSession')) {
        const session = document.querySelector<HTMLElement>('.v10SessionOverlay');
        if (session?.classList.contains('running') || session?.classList.contains('paused')) {
          captureAbandonment('navigation');
        }
      }

      if (target.closest('.evCompletionRepeat, .v10CompletionActions .v10PrimaryAction')) {
        clearVoyageRuntime();
      }
    };

    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement | null;
      if (!form?.classList.contains('v10ThoughtCapture')) return;
      const input = form.querySelector<HTMLInputElement>('#v10-thought');
      if (!input?.value.trim()) return;
      const thoughtNumber = incrementThoughtCount();
      const runtime = getVoyageRuntime();
      analyticsClient.capture('thought_captured', {
        voyage_session_id: runtime?.voyageSessionId ?? null,
        thought_number: thoughtNumber
      });
    };

    const syncCompletion = () => {
      const nextCompletion = document.querySelector<HTMLElement>('.v10SessionOverlay.completed .v10Completion');
      if (nextCompletion && nextCompletion !== completionElement) {
        completionElement = nextCompletion;
        captureCompletion();
      }
      if (!nextCompletion) completionElement = null;
    };

    const observer = new MutationObserver((mutations) => {
      if (!mutations.some(mutationAffectsCompletion) || completionFrame !== null) return;
      completionFrame = window.requestAnimationFrame(() => {
        completionFrame = null;
        syncCompletion();
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    const unsubscribeMix = subscribeToAmbientMix((snapshot) => {
      for (const nextLayer of snapshot.layers) {
        const previousLayer = previousMix.find((item) => item.id === nextLayer.id);
        if (!previousLayer || previousLayer.enabled === nextLayer.enabled) continue;
        analyticsClient.capture(nextLayer.enabled ? 'atmosphere_layer_added' : 'atmosphere_layer_removed', {
          layer_id: nextLayer.id,
          layer_type: layerType(nextLayer.id as AmbientId),
          session_active: Boolean(getVoyageRuntime()?.started && !getVoyageRuntime()?.completed)
        });
        if (nextLayer.enabled) markAtmosphereLayerUsed(nextLayer.id);
      }
      previousMix = snapshot.layers;
    });

    const unsubscribeRuntime = subscribeToAmbientRuntime((snapshot) => {
      for (const [id, nextState] of Object.entries(snapshot.layers) as [AmbientId, AmbientLayerRuntimeState][]) {
        const previousState = previousRuntime[id];
        if (nextState.playbackState === 'error' && previousState?.playbackState !== 'error') {
          analyticsClient.capture('audio_load_failed', {
            layer_id: id,
            layer_type: layerType(id),
            failure_code: failureCode(nextState.errorMessage),
            source_attempt: sourceAttempt(nextState),
            audio_context_state: 'unknown'
          });
        }
      }
      previousRuntime = snapshot.layers;
    });

    const unsubscribeCommands = subscribeToAmbientCommands((command) => {
      if (command.type !== 'retry') return;
      const current = readAmbientRuntime().layers[command.id];
      analyticsClient.capture('audio_retry_used', {
        layer_id: command.id,
        layer_type: layerType(command.id),
        source_attempt: sourceAttempt(current),
        audio_context_state: 'unknown'
      });
    });

    const handlePageHide = () => captureAbandonment('page_hidden');
    const handlePopState = () => captureAbandonment('browser_back');
    const handleBeforeUnload = () => captureAbandonment('navigation');

    document.addEventListener('click', handleClick, true);
    document.addEventListener('submit', handleSubmit, true);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);
    syncCompletion();

    return () => {
      observer.disconnect();
      if (completionFrame !== null) window.cancelAnimationFrame(completionFrame);
      unsubscribeMix();
      unsubscribeRuntime();
      unsubscribeCommands();
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('submit', handleSubmit, true);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname]);

  return null;
}
