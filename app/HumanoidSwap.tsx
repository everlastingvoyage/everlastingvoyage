'use client';

import { useEffect } from 'react';

export default function HumanoidSwap() {
  useEffect(() => {
    const installHumanoid = () => {
      const current = document.querySelector<HTMLElement>('.signalFigureGraphic');

      if (!current || current.classList.contains('signalFigureAsset')) return;

      const image = document.createElement('img');
      image.src = '/humanoid%20png%20clean!.png';
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      image.className = 'signalFigureGraphic signalFigureAsset';
      image.decoding = 'async';
      image.draggable = false;

      current.replaceWith(image);
    };

    installHumanoid();

    const observer = new MutationObserver(installHumanoid);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <style jsx global>{`
      .signalFigureGraphic:not(.signalFigureAsset) {
        opacity: 0 !important;
      }

      .signalFigureAsset {
        display: block;
        width: min(22rem, 64%) !important;
        height: auto !important;
        object-fit: contain;
        opacity: 1;
        filter: drop-shadow(0 0 24px rgba(86, 194, 255, 0.28))
          drop-shadow(0 0 52px rgba(15, 72, 119, 0.38)) !important;
        animation: signalFloat 6s ease-in-out infinite;
      }

      .signalStage.popupOpen .signalFigureAsset {
        filter: saturate(0.85) brightness(0.78)
          drop-shadow(0 0 24px rgba(86, 194, 255, 0.2)) !important;
      }

      @media (max-width: 720px) {
        .signalFigureAsset {
          width: min(19rem, 72%) !important;
        }
      }

      @media (max-width: 520px) {
        .signalFigureAsset {
          width: min(17rem, 74%) !important;
        }
      }
    `}</style>
  );
}
