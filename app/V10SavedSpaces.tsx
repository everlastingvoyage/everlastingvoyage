'use client';

import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type StateId = 'alpha' | 'gamma' | 'theta' | 'delta' | 'abundance';

type SavedSpace = {
  id: string;
  name: string;
  stateId: StateId;
  durationMinutes: number;
  intention: string;
  volumePercent: number;
  createdAt: number;
  lastUsedAt: number;
};

type BuilderConfig = Pick<SavedSpace, 'stateId' | 'durationMinutes' | 'intention'>;

const STORAGE_KEY = 'ev-v10-saved-spaces';
const VOLUME_STORAGE_KEY = 'ev-v10-precision-volume';
const MAX_SPACES = 8;

const stateMeta: Record<StateId, { frequency: string; hz: string; state: string }> = {
  alpha: { frequency: 'Alpha', hz: '10 Hz', state: 'Calm Focus' },
  gamma: { frequency: 'Gamma', hz: '40 Hz', state: 'Deep Focus' },
  theta: { frequency: 'Theta', hz: '4 Hz', state: 'Creative Flow' },
  delta: { frequency: 'Delta', hz: '2 Hz', state: 'Deep Rest' },
  abundance: { frequency: 'Pure Tone', hz: '888 Hz', state: 'Abundance' }
};

function readSpaces(): SavedSpace[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as SavedSpace[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((space) => space && stateMeta[space.stateId] && Number.isFinite(space.durationMinutes))
      .slice(0, MAX_SPACES);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistSpaces(spaces: SavedSpace[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(spaces.slice(0, MAX_SPACES)));
}

function readBuilderConfig(): BuilderConfig {
  const ids: StateId[] = ['alpha', 'gamma', 'theta', 'delta', 'abundance'];
  const activeState = document.querySelector<HTMLElement>('.stateChoice.active');
  const stateId = ids.find((id) => activeState?.classList.contains(id)) ?? 'alpha';
  const durationText = document.querySelector<HTMLElement>('.durationRow button.active')?.textContent ?? '25';
  const durationMinutes = Number.parseInt(durationText, 10) || 25;
  const intention = (document.querySelector<HTMLInputElement>('.intentionField input')?.value ?? '').trim();
  return { stateId, durationMinutes, intention };
}

function setReactInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function defaultName(config: BuilderConfig) {
  return `${stateMeta[config.stateId].state} · ${config.durationMinutes} min`;
}

function makeId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `space-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function V10SavedSpaces() {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [spaces, setSpaces] = useState<SavedSpace[]>([]);
  const [savedPulse, setSavedPulse] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  useEffect(() => {
    setSpaces(readSpaces());

    const hero = document.querySelector<HTMLElement>('.heroSection');
    if (!hero) return;

    const existing = document.getElementById('v10-saved-spaces-root');
    const root = existing ?? document.createElement('div');
    root.id = 'v10-saved-spaces-root';
    if (!existing) hero.insertAdjacentElement('afterend', root);
    setMountNode(root);

    return () => {
      if (!existing) root.remove();
    };
  }, []);

  const commitSpaces = useCallback((nextSpaces: SavedSpace[]) => {
    const ordered = [...nextSpaces]
      .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
      .slice(0, MAX_SPACES);
    setSpaces(ordered);
    persistSpaces(ordered);
  }, []);

  const saveCurrentSpace = useCallback(() => {
    const config = readBuilderConfig();
    const now = Date.now();
    const rawVolume = Number(localStorage.getItem(VOLUME_STORAGE_KEY));
    const volumePercent = Number.isFinite(rawVolume) && rawVolume >= 0 && rawVolume <= 100 ? rawVolume : 35;
    const signature = `${config.stateId}|${config.durationMinutes}|${config.intention.trim().toLowerCase()}`;
    const existingSpace = spaces.find(
      (space) => `${space.stateId}|${space.durationMinutes}|${space.intention.trim().toLowerCase()}` === signature
    );

    const nextSpace: SavedSpace = existingSpace
      ? { ...existingSpace, volumePercent, lastUsedAt: now }
      : {
          id: makeId(),
          name: defaultName(config),
          ...config,
          volumePercent,
          createdAt: now,
          lastUsedAt: now
        };

    commitSpaces([nextSpace, ...spaces.filter((space) => space.id !== nextSpace.id)]);
    setSavedPulse(true);
    window.setTimeout(() => setSavedPulse(false), 1700);
  }, [commitSpaces, spaces]);

  useEffect(() => {
    const handleSaveClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const button = target?.closest<HTMLButtonElement>('.builderActions .saveButton');
      if (!button) return;
      window.setTimeout(saveCurrentSpace, 0);
    };

    document.addEventListener('click', handleSaveClick, true);
    return () => document.removeEventListener('click', handleSaveClick, true);
  }, [saveCurrentSpace]);

  const applySpaceToBuilder = useCallback((space: SavedSpace, startImmediately: boolean) => {
    document.querySelector<HTMLButtonElement>(`.stateChoice.${space.stateId}`)?.click();

    const durationButton = Array.from(document.querySelectorAll<HTMLButtonElement>('.durationRow button')).find(
      (button) => Number.parseInt(button.textContent || '', 10) === space.durationMinutes
    );
    durationButton?.click();

    const intentionInput = document.querySelector<HTMLInputElement>('.intentionField input');
    if (intentionInput) setReactInputValue(intentionInput, space.intention);

    localStorage.setItem(VOLUME_STORAGE_KEY, String(space.volumePercent));
    const now = Date.now();
    commitSpaces(spaces.map((item) => (item.id === space.id ? { ...item, lastUsedAt: now } : item)));

    if (startImmediately) {
      window.setTimeout(() => {
        document.querySelector<HTMLButtonElement>('.builderActions .primaryButton')?.click();
      }, 90);
    } else {
      document.getElementById('session-builder')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [commitSpaces, spaces]);

  const deleteSpace = (id: string) => {
    commitSpaces(spaces.filter((space) => space.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const beginRename = (space: SavedSpace) => {
    setEditingId(space.id);
    setDraftName(space.name);
  };

  const saveRename = (event: FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault();
    const cleanName = draftName.trim();
    if (!cleanName) return;
    commitSpaces(spaces.map((space) => (space.id === id ? { ...space, name: cleanName } : space)));
    setEditingId(null);
  };

  const visibleSpaces = useMemo(() => spaces.slice(0, MAX_SPACES), [spaces]);

  if (!mountNode || visibleSpaces.length === 0) return null;

  return createPortal(
    <section className={`v10SavedSpacesSection ${savedPulse ? 'savedPulse' : ''}`} aria-labelledby="v10-saved-spaces-title">
      <div className="v10SavedSpacesInner">
        <header className="v10SavedSpacesHeader">
          <div>
            <p className="eyebrow">Saved spaces</p>
            <h2 id="v10-saved-spaces-title">Your next voyage, already prepared.</h2>
          </div>
          <p>Return to a frequency, duration, intention and listening level in one tap.</p>
        </header>

        <div className="v10SavedSpacesGrid">
          {visibleSpaces.map((space) => {
            const meta = stateMeta[space.stateId];
            return (
              <article className={`v10SavedSpaceCard ${space.stateId}`} key={space.id}>
                <div className="v10SavedSpaceTopline">
                  <span>{meta.frequency} · {meta.hz}</span>
                  <button type="button" onClick={() => deleteSpace(space.id)} aria-label={`Delete ${space.name}`}>×</button>
                </div>

                {editingId === space.id ? (
                  <form className="v10SavedSpaceRename" onSubmit={(event) => saveRename(event, space.id)}>
                    <input
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      maxLength={48}
                      autoFocus
                      aria-label="Saved space name"
                    />
                    <div>
                      <button type="submit">Save name</button>
                      <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h3>{space.name}</h3>
                    <p>{space.intention || 'No default intention — enter with an open focus.'}</p>
                    <div className="v10SavedSpaceMeta">
                      <span>{space.durationMinutes} min</span>
                      <span>Volume {space.volumePercent}%</span>
                    </div>
                    <div className="v10SavedSpaceActions">
                      <button type="button" className="v10SavedSpaceStart" onClick={() => applySpaceToBuilder(space, true)}>
                        Start voyage <span aria-hidden="true">→</span>
                      </button>
                      <button type="button" onClick={() => applySpaceToBuilder(space, false)}>Load</button>
                      <button type="button" onClick={() => beginRename(space)}>Rename</button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>,
    mountNode
  );
}
