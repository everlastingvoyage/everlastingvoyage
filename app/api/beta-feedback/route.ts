import { NextResponse } from 'next/server';
import { APP_VERSION } from '../../lib/app-version';

const allowedFields = new Set([
  'voyage_session_id',
  'rating',
  'issue_area',
  'comment',
  'app_version'
]);
const ratings = new Set(['great', 'okay', 'problem']);
const issueAreas = new Set(['audio', 'timer', 'layout', 'saving', 'navigation', 'other']);
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const attempts = new Map<string, number[]>();

function sanitizeComment(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

function validSessionId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9-]{12,80}$/.test(value);
}

function rateLimited(sessionId: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(sessionId) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) return true;
  recent.push(now);
  attempts.set(sessionId, recent);
  if (attempts.size > 500) {
    for (const [key, timestamps] of attempts) {
      if (!timestamps.some((timestamp) => now - timestamp < WINDOW_MS)) attempts.delete(key);
    }
  }
  return false;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const source = body as Record<string, unknown>;
  if (Object.keys(source).some((key) => !allowedFields.has(key))) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!validSessionId(source.voyage_session_id) || !ratings.has(String(source.rating))) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const issueArea = source.issue_area === null || source.issue_area === undefined
    ? null
    : String(source.issue_area);
  if (issueArea !== null && !issueAreas.has(issueArea)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const rawComment = typeof source.comment === 'string' ? source.comment : '';
  if (rawComment.length > 500) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const comment = sanitizeComment(rawComment);
  if (!comment) return NextResponse.json({ ok: false }, { status: 400 });
  if (rateLimited(source.voyage_session_id)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const endpoint = process.env.BETA_FEEDBACK_ENDPOINT;
  const secret = process.env.BETA_FEEDBACK_SECRET;
  if (!endpoint || !secret) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`
      },
      body: JSON.stringify({
        voyage_session_id: source.voyage_session_id,
        rating: source.rating,
        issue_area: issueArea,
        comment,
        app_version: APP_VERSION,
        submitted_at: new Date().toISOString()
      }),
      signal: controller.signal,
      cache: 'no-store'
    });

    if (!response.ok) return NextResponse.json({ ok: false }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
