'use client';

import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

type StateId = 'alpha' | 'gamma' | 'theta' | 'delta' | 'abundance';

type StoredSession = {
  config?: { stateId?: StateId; durationMinutes?: number; intention?: string };
  thoughts?: string[];
  updatedAt?: number;
};

type VoyageNote = {
  id: string;
  title: string;
  thoughts: string[];
  stateId: StateId;
  durationMinutes: number;
  intention: string;
  createdAt: number;
  updatedAt: number;
};

type EditDraft = {
  title: string;
  body: string;
};

const STORAGE_KEY = 'ev-v10-notes';
const ACTIVE_SESSION_KEY = 'ev-v10-active-session';
const MAX_NOTES = 60;

const stateMeta: Record<StateId, { frequency: string; hz: string; state: string }> = {
  alpha: { frequency: 'Alpha', hz: '10 Hz', state: 'Calm Focus' },
  gamma: { frequency: 'Gamma', hz: '40 Hz', state: 'Deep Focus' },
  theta: { frequency: 'Theta', hz: '4 Hz', state: 'Creative Flow' },
  delta: { frequency: 'Delta', hz: '2 Hz', state: 'Deep Rest' },
  abundance: { frequency: 'Pure Tone', hz: '888 Hz', state: 'Abundance' }
};

function isStateId(value: unknown): value is StateId {
  return typeof value === 'string' && value in stateMeta;
}

function readNotes(): VoyageNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as VoyageNote[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((note) => note && typeof note.id === 'string' && isStateId(note.stateId) && Number.isFinite(note.durationMinutes))
      .map((note) => ({
        ...note,
        title: typeof note.title === 'string' ? note.title : '',
        intention: typeof note.intention === 'string' ? note.intention : '',
        thoughts: Array.isArray(note.thoughts) ? note.thoughts.filter((thought): thought is string => typeof thought === 'string') : [],
        createdAt: Number.isFinite(note.createdAt) ? note.createdAt : Date.now(),
        updatedAt: Number.isFinite(note.updatedAt) ? note.updatedAt : Date.now()
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_NOTES);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistNotes(notes: VoyageNote[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.slice(0, MAX_NOTES)));
  window.dispatchEvent(new CustomEvent('ev:v10-notes-updated', { detail: notes.length }));
}

function readSession(): StoredSession | null {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_SESSION_KEY) || 'null') as StoredSession | null;
  } catch {
    return null;
  }
}

function makeId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function setReactInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function defaultTitle(stateId: StateId, durationMinutes: number) {
  return `${stateMeta[stateId].state} reflection · ${durationMinutes} min`;
}

function formatNoteText(note: VoyageNote) {
  const meta = stateMeta[note.stateId];
  return [
    note.title || defaultTitle(note.stateId, note.durationMinutes),
    '',
    `State: ${meta.state}`,
    `Signal: ${meta.frequency} · ${meta.hz}`,
    `Duration: ${note.durationMinutes} minutes`,
    note.intention ? `Intention: ${note.intention}` : 'Intention: Open focus',
    `Saved: ${new Date(note.createdAt).toLocaleString()}`,
    '',
    'Captured thoughts:',
    ...(note.thoughts.length ? note.thoughts.map((thought) => `• ${thought}`) : ['• No thoughts captured'])
  ].join('\n');
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

export default function V10Notes() {
  const pathname = usePathname();
  const enabled = pathname === '/voyage';
  const [buttonMount, setButtonMount] = useState<HTMLElement | null>(null);
  const [saveMount, setSaveMount] = useState<HTMLElement | null>(null);
  const [notes, setNotes] = useState<VoyageNote[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'empty'>('idle');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>({ title: '', body: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    setNotes(readNotes());

    const header = document.querySelector<HTMLElement>('.builderHeader');
    if (!header) return;

    let controls = header.querySelector<HTMLElement>('#ev-builder-library-controls');
    const savedSpacesRoot = header.querySelector<HTMLElement>('#ev-saved-spaces-button-root');

    if (!controls) {
      controls = document.createElement('div');
      controls.id = 'ev-builder-library-controls';
      if (savedSpacesRoot) header.insertBefore(controls, savedSpacesRoot);
      else header.appendChild(controls);
    }

    if (savedSpacesRoot && savedSpacesRoot.parentElement !== controls) controls.appendChild(savedSpacesRoot);

    const root = document.createElement('div');
    root.id = 'ev-notes-button-root';
    controls.appendChild(root);
    setButtonMount(root);

    return () => {
      const parent = root.parentElement;
      const savedRoot = parent?.querySelector<HTMLElement>('#ev-saved-spaces-button-root');
      if (savedRoot && header.isConnected) header.appendChild(savedRoot);
      root.remove();
      if (parent && parent.childElementCount === 0) parent.remove();
      setButtonMount(null);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const syncMount = () => {
      const actions = document.querySelector<HTMLElement>('.v10CompletionActions');
      if (!actions) {
        setSaveMount(null);
        setSaveState('idle');
        return;
      }

      let mount = actions.querySelector<HTMLElement>('#ev-save-notes-root');
      if (!mount) {
        mount = document.createElement('div');
        mount.id = 'ev-save-notes-root';
        actions.appendChild(mount);
      }
      setSaveMount(mount);
    };

    syncMount();
    const observer = new MutationObserver(syncMount);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [enabled]);

  useEffect(() => {
    if (!panelOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setPanelOpen(false);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [panelOpen]);

  const commitNotes = useCallback((nextNotes: VoyageNote[]) => {
    const ordered = [...nextNotes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_NOTES);
    setNotes(ordered);
    persistNotes(ordered);
  }, []);

  const saveCurrentSession = useCallback(() => {
    const session = readSession();
    const rawStateId = session?.config?.stateId;
    const stateId = isStateId(rawStateId) ? rawStateId : 'alpha';
    const durationMinutes = Number.isFinite(session?.config?.durationMinutes)
      ? Math.max(1, Number(session?.config?.durationMinutes))
      : 25;
    const intention = session?.config?.intention?.trim() || '';
    const thoughts = Array.isArray(session?.thoughts)
      ? session.thoughts.map((thought) => String(thought).trim()).filter(Boolean)
      : [];

    if (!intention && thoughts.length === 0) {
      setSaveState('empty');
      window.setTimeout(() => setSaveState('idle'), 2200);
      return;
    }

    const now = Date.now();
    const note: VoyageNote = {
      id: makeId(),
      title: defaultTitle(stateId, durationMinutes),
      thoughts,
      stateId,
      durationMinutes,
      intention,
      createdAt: now,
      updatedAt: now
    };

    commitNotes([note, ...notes]);
    setSaveState('saved');
  }, [commitNotes, notes]);

  const deleteNote = (id: string) => {
    commitNotes(notes.filter((note) => note.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const beginEdit = (note: VoyageNote) => {
    setEditingId(note.id);
    setEditDraft({ title: note.title, body: note.thoughts.join('\n') });
  };

  const saveEdit = (event: FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault();
    const title = editDraft.title.trim();
    const thoughts = editDraft.body
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    commitNotes(notes.map((note) => note.id === id ? {
      ...note,
      title: title || defaultTitle(note.stateId, note.durationMinutes),
      thoughts,
      updatedAt: Date.now()
    } : note));
    setEditingId(null);
  };

  const copyNote = async (note: VoyageNote) => {
    try {
      await copyText(formatNoteText(note));
      setCopiedId(note.id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setCopiedId(null);
    }
  };

  const repeatNote = (note: VoyageNote) => {
    document.querySelector<HTMLButtonElement>(`.stateChoice.${note.stateId}`)?.click();
    Array.from(document.querySelectorAll<HTMLButtonElement>('.durationRow button'))
      .find((button) => Number.parseInt(button.textContent || '', 10) === note.durationMinutes)?.click();

    const intentionInput = document.querySelector<HTMLInputElement>('.intentionField input');
    if (intentionInput) setReactInputValue(intentionInput, note.intention);

    setPanelOpen(false);
    window.setTimeout(() => {
      document.querySelector<HTMLButtonElement>('.builderActions .primaryButton')?.click();
    }, 160);
  };

  const visibleNotes = useMemo(() => notes.slice(0, MAX_NOTES), [notes]);
  if (!enabled) return null;

  return (
    <>
      {buttonMount && createPortal(
        <button type="button" className="evLibraryTrigger evNotesTrigger" onClick={() => setPanelOpen(true)}>
          <span>Notes</span>
          <strong>{visibleNotes.length}</strong>
        </button>,
        buttonMount
      )}

      {saveMount && createPortal(
        <button type="button" className="v10SecondaryAction evSaveNotesButton" onClick={saveCurrentSession} disabled={saveState === 'saved'}>
          {saveState === 'saved' ? 'Saved to Notes ✓' : saveState === 'empty' ? 'Add a thought first' : 'Save to Notes'}
        </button>,
        saveMount
      )}

      {panelOpen && typeof document !== 'undefined' && createPortal(
        <div className="evNotesBackdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setPanelOpen(false)}>
          <aside className="evNotesPanel" role="dialog" aria-modal="true" aria-labelledby="ev-notes-title">
            <header>
              <div>
                <p className="eyebrow">Notes library</p>
                <h2 id="ev-notes-title">Thoughts worth returning to.</h2>
              </div>
              <button type="button" className="evNotesClose" onClick={() => setPanelOpen(false)} aria-label="Close notes">×</button>
            </header>

            {visibleNotes.length === 0 ? (
              <div className="evNotesEmpty">
                <strong>No notes saved yet.</strong>
                <p>Capture thoughts during a voyage, then choose Save to Notes when the session ends.</p>
              </div>
            ) : (
              <div className="evNotesList">
                {visibleNotes.map((note) => {
                  const meta = stateMeta[note.stateId];
                  const date = new Intl.DateTimeFormat(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  }).format(new Date(note.createdAt));

                  return (
                    <article className={`evNoteCard ${note.stateId}`} key={note.id}>
                      <div className="evNoteTopline">
                        <span>{meta.frequency} · {meta.hz}</span>
                        <time dateTime={new Date(note.createdAt).toISOString()}>{date}</time>
                      </div>

                      {editingId === note.id ? (
                        <form className="evNoteEditor" onSubmit={(event) => saveEdit(event, note.id)}>
                          <label>
                            <span>Title</span>
                            <input value={editDraft.title} onChange={(event) => setEditDraft((draft) => ({ ...draft, title: event.target.value }))} maxLength={70} autoFocus />
                          </label>
                          <label>
                            <span>Captured thoughts</span>
                            <textarea value={editDraft.body} onChange={(event) => setEditDraft((draft) => ({ ...draft, body: event.target.value }))} rows={5} />
                          </label>
                          <div>
                            <button type="submit" className="evNotePrimary">Save changes</button>
                            <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <h3>{note.title || defaultTitle(note.stateId, note.durationMinutes)}</h3>
                          <div className="evNoteContext">
                            <span>{meta.state}</span>
                            <span>{note.durationMinutes} min</span>
                          </div>
                          {note.intention && <p className="evNoteIntention"><span>Intention</span>{note.intention}</p>}
                          <div className="evNoteThoughts">
                            {note.thoughts.length ? note.thoughts.map((thought, index) => <p key={`${note.id}-${index}`}>{thought}</p>) : <p>No thoughts were captured.</p>}
                          </div>
                          <div className="evNoteActions">
                            <button type="button" className="evNotePrimary" onClick={() => repeatNote(note)}>Start this voyage <span aria-hidden="true">→</span></button>
                            <button type="button" onClick={() => copyNote(note)}>{copiedId === note.id ? 'Copied ✓' : 'Copy'}</button>
                            <button type="button" onClick={() => beginEdit(note)}>Edit</button>
                            <button type="button" className="evNoteDelete" onClick={() => deleteNote(note.id)}>Delete</button>
                          </div>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </aside>
        </div>,
        document.body
      )}
    </>
  );
}
