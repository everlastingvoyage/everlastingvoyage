'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { analyticsClient } from '../lib/analytics/analytics-client';
import {
  commentLengthBucket,
  ensureVoyageSessionId
} from '../lib/analytics/analytics-events';

type Rating = 'great' | 'okay' | 'problem';
type IssueArea = 'audio' | 'timer' | 'layout' | 'saving' | 'navigation' | 'other';

const issueOptions: { id: IssueArea; label: string }[] = [
  { id: 'audio', label: 'Audio' },
  { id: 'timer', label: 'Timer' },
  { id: 'layout', label: 'Layout' },
  { id: 'saving', label: 'Saving' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'other', label: 'Other' }
];
const submittedSessions = new Set<string>();

function cleanComment(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

export default function V12CompletionFeedback({ textFeedbackEnabled }: { textFeedbackEnabled: boolean }) {
  const pathname = usePathname();
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [rating, setRating] = useState<Rating | null>(null);
  const [issueArea, setIssueArea] = useState<IssueArea | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const completionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (pathname !== '/voyage') return;

    const syncMount = () => {
      const completion = document.querySelector<HTMLElement>('.v10Completion');
      const actions = completion?.querySelector<HTMLElement>('.v10CompletionActions');
      if (!completion || !actions) {
        completionRef.current = null;
        setMount(null);
        return;
      }

      let root = completion.querySelector<HTMLElement>('#ev-v12-completion-feedback-root');
      if (!root) {
        root = document.createElement('div');
        root.id = 'ev-v12-completion-feedback-root';
        actions.insertAdjacentElement('beforebegin', root);
      }

      if (completionRef.current !== completion) {
        completionRef.current = completion;
        setRating(null);
        setIssueArea(null);
        setComment('');
        setSubmitted(false);
        setMessage('');
      }
      setMount(root);
    };

    syncMount();
    const observer = new MutationObserver(syncMount);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  const submit = async (nextRating: Rating) => {
    const cleaned = cleanComment(comment);
    if (nextRating === 'problem' && !issueArea && !cleaned) {
      setMessage('Choose what happened or add a short note.');
      return;
    }

    const voyageSessionId = ensureVoyageSessionId();
    if (submittedSessions.has(voyageSessionId)) {
      setSubmitted(true);
      setMessage('Feedback already received for this Voyage.');
      return;
    }

    setRating(nextRating);
    submittedSessions.add(voyageSessionId);
    analyticsClient.capture('feedback_submitted', {
      voyage_session_id: voyageSessionId,
      rating: nextRating,
      issue_area: issueArea,
      has_comment: Boolean(cleaned),
      comment_length_bucket: commentLengthBucket(cleaned.length)
    });

    let writtenFeedbackDelivered = true;
    if (cleaned && textFeedbackEnabled) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 4500);
      try {
        const response = await fetch('/api/beta-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voyage_session_id: voyageSessionId,
            rating: nextRating,
            issue_area: issueArea,
            comment: cleaned,
            app_version: '12.2.0'
          }),
          signal: controller.signal
        });
        writtenFeedbackDelivered = response.ok;
      } catch {
        writtenFeedbackDelivered = false;
      } finally {
        window.clearTimeout(timeout);
      }
    }

    setSubmitted(true);
    setMessage(
      writtenFeedbackDelivered
        ? 'Thank you — this helps improve Everlasting Voyage.'
        : 'Your rating was recorded. The optional written note could not be delivered.'
    );
  };

  if (pathname !== '/voyage' || !mount) return null;

  return createPortal(
    <section className="v12CompletionFeedback" aria-labelledby="v12-feedback-title">
      <span>Private beta feedback</span>
      <h3 id="v12-feedback-title">How was this Voyage?</h3>

      {submitted ? (
        <p className="v12FeedbackThanks" role="status">{message}</p>
      ) : (
        <>
          <div className="v12FeedbackRating">
            <button type="button" onClick={() => void submit('great')}>Great</button>
            <button type="button" onClick={() => void submit('okay')}>Okay</button>
            <button type="button" className={rating === 'problem' ? 'selected' : ''} onClick={() => { setRating('problem'); setMessage(''); }}>
              Something went wrong
            </button>
          </div>

          {rating === 'problem' ? (
            <div className="v12FeedbackProblem">
              <p>What happened?</p>
              <div className="v12FeedbackIssues">
                {issueOptions.map((option) => (
                  <button
                    type="button"
                    className={issueArea === option.id ? 'selected' : ''}
                    aria-pressed={issueArea === option.id}
                    onClick={() => { setIssueArea(option.id); setMessage(''); }}
                    key={option.id}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {textFeedbackEnabled ? (
                <label>
                  <span>Anything else?</span>
                  <textarea
                    value={comment}
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setComment(event.target.value.slice(0, 500))}
                    maxLength={500}
                    placeholder="Please do not include private or sensitive information."
                  />
                  <small>{comment.length}/500</small>
                </label>
              ) : null}

              {message ? <p className="v12FeedbackMessage" role="alert">{message}</p> : null}
              <button type="button" className="v12FeedbackSubmit" onClick={() => void submit('problem')}>
                Send feedback
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>,
    mount
  );
}
