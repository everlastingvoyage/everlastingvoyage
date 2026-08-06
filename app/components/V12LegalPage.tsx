import Link from 'next/link';
import type { ReactNode } from 'react';

export default function V12LegalPage({
  eyebrow,
  title,
  intro,
  notice,
  children
}: {
  eyebrow: string;
  title: string;
  intro: string;
  notice?: string;
  children: ReactNode;
}) {
  return (
    <main className="v12LegalPage">
      <header className="v12LegalHeader">
        <Link href="/voyage" className="v12LegalBack">← Return to the Voyage</Link>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
        {notice ? <strong className="v12LegalNotice">{notice}</strong> : null}
      </header>
      <article className="v12LegalContent">{children}</article>
    </main>
  );
}
