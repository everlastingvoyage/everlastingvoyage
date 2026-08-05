'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function V11ContinueVoyageBehavior() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/voyage') return;

    let lastY = window.scrollY;
    let ticking = false;

    const showContinue = () => document.body.classList.remove('ev-continue-hidden');

    const update = () => {
      ticking = false;
      const nextY = window.scrollY;
      const delta = nextY - lastY;
      const buttonVisible = Boolean(document.querySelector('.v10ContinueVoyage'));

      if (!buttonVisible || nextY < 160) {
        showContinue();
      } else if (delta > 9) {
        document.body.classList.add('ev-continue-hidden');
      } else if (delta < -7) {
        showContinue();
      }

      lastY = nextY;
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    const handleInteraction = (event: Event) => {
      if ((event.target as Element | null)?.closest('.v10ContinueVoyage')) showContinue();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('pointerdown', handleInteraction, true);
    document.addEventListener('focusin', handleInteraction, true);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('pointerdown', handleInteraction, true);
      document.removeEventListener('focusin', handleInteraction, true);
      document.body.classList.remove('ev-continue-hidden');
    };
  }, [pathname]);

  return null;
}
