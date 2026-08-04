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
      :root {
        --ev-midnight: #020816;
        --ev-panel: #071426;
        --ev-panel-raised: #0b1b31;
        --ev-border: #1b3a59;
        --ev-border-bright: #69cfff;
        --ev-ice: #bfeaff;
        --ev-signal: #57bfff;
        --ev-electric: #356dff;
        --ev-text: #f3f7fb;
        --ev-muted: #9eb0c6;
        --ev-gold: #d7be7a;
        --ev-gold-border: #8f6a2b;
        --ev-gold-dark: #2a2113;
      }

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

      /* Primary actions — electric blue instead of pale generic cyan. */
      .primaryButton {
        color: #f8fcff !important;
        border: 1px solid rgba(166, 230, 255, 0.62) !important;
        background: linear-gradient(135deg, #55c9ff 0%, #357cf4 54%, #315ee8 100%) !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.34),
          0 12px 30px rgba(36, 111, 222, 0.24),
          0 0 0 1px rgba(33, 105, 211, 0.12) !important;
        text-shadow: 0 1px 1px rgba(0, 20, 55, 0.24);
        transition: transform 180ms ease, filter 180ms ease, box-shadow 180ms ease !important;
      }

      .primaryButton:hover {
        transform: translateY(-2px);
        filter: brightness(1.08) saturate(1.04);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.42),
          0 18px 38px rgba(36, 111, 222, 0.34),
          0 0 24px rgba(74, 190, 255, 0.18) !important;
      }

      .primaryButton:active {
        transform: translateY(0) scale(0.99);
      }

      /* Secondary actions inherit the restrained language of the lower cards. */
      .secondaryButton,
      .navCta {
        color: #e1f1ff !important;
        border-color: #315878 !important;
        background: linear-gradient(180deg, rgba(12, 29, 49, 0.96), rgba(6, 18, 33, 0.98)) !important;
        box-shadow: inset 0 0 0 1px rgba(125, 196, 239, 0.04) !important;
      }

      .secondaryButton:hover,
      .navCta:hover {
        border-color: #68cfff !important;
        background: linear-gradient(180deg, rgba(18, 43, 70, 0.98), rgba(8, 23, 41, 0.99)) !important;
        box-shadow: 0 14px 30px rgba(9, 37, 65, 0.26) !important;
      }

      /* Saved space is now deep indigo/steel blue instead of unrelated purple. */
      .saveButton {
        color: #edf6ff !important;
        border-color: #4d6e9f !important;
        background: linear-gradient(180deg, #1d3155 0%, #121f3a 100%) !important;
        box-shadow:
          inset 0 1px 0 rgba(165, 205, 255, 0.12),
          0 14px 30px rgba(9, 25, 55, 0.26) !important;
        transition: transform 180ms ease, border-color 180ms ease, background 180ms ease !important;
      }

      .saveButton:hover {
        transform: translateY(-2px);
        border-color: #78a6e1 !important;
        background: linear-gradient(180deg, #263f6c 0%, #172847 100%) !important;
      }

      /* Time controls: clearer inactive and selected contrast. */
      .durationRow button {
        color: #c9d9e9 !important;
        border-color: #264663 !important;
        background: linear-gradient(180deg, rgba(9, 24, 41, 0.98), rgba(5, 16, 30, 0.99)) !important;
        box-shadow: inset 0 0 0 1px rgba(151, 213, 251, 0.025) !important;
      }

      .durationRow button:hover {
        color: #f3f9ff !important;
        border-color: #4f86b1 !important;
        background: linear-gradient(180deg, rgba(18, 45, 72, 0.98), rgba(7, 22, 39, 0.99)) !important;
      }

      .durationRow button.active {
        color: #ffffff !important;
        border-color: #a7dcff !important;
        background: linear-gradient(180deg, #6688ad 0%, #365574 100%) !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.28),
          0 10px 24px rgba(30, 83, 128, 0.25),
          0 0 0 1px rgba(150, 222, 255, 0.12) !important;
      }

      /* Frequency cards — stronger separation between surface, type and active state. */
      .stateChoice {
        color: var(--ev-text) !important;
        border-color: #1c3957 !important;
        background: linear-gradient(180deg, rgba(8, 22, 39, 0.98), rgba(4, 13, 25, 0.99)) !important;
        box-shadow: inset 0 0 0 1px rgba(131, 202, 244, 0.025) !important;
        transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease !important;
      }

      .stateChoice > span,
      .stateChoice > small {
        color: #98abc1 !important;
      }

      .stateChoice > strong {
        color: #f3f7fb !important;
      }

      .stateChoice:hover {
        transform: translateY(-2px);
        border-color: #3e6f99 !important;
        background: linear-gradient(180deg, rgba(14, 35, 58, 0.99), rgba(5, 17, 31, 0.99)) !important;
      }

      .stateChoice.active {
        border-color: #9adfff !important;
        background: linear-gradient(180deg, #294b6d 0%, #172d46 100%) !important;
        box-shadow:
          inset 0 0 0 1px rgba(191, 235, 255, 0.12),
          0 16px 34px rgba(8, 36, 63, 0.26),
          0 0 24px rgba(75, 182, 255, 0.08) !important;
      }

      .stateChoice.active > span,
      .stateChoice.active > small {
        color: #aee5ff !important;
      }

      .stateChoice.alpha.active {
        border-color: #76e0ff !important;
        background: linear-gradient(180deg, #235976 0%, #123249 100%) !important;
      }

      .stateChoice.gamma.active {
        border-color: #78abff !important;
        background: linear-gradient(180deg, #244a88 0%, #142b55 100%) !important;
      }

      .stateChoice.theta.active {
        border-color: #9e91ff !important;
        background: linear-gradient(180deg, #353574 0%, #20234f 100%) !important;
      }

      .stateChoice.delta.active {
        border-color: #9bd8ff !important;
        background: linear-gradient(180deg, #315475 0%, #1b314d 100%) !important;
      }

      .stateChoice.abundance.active {
        border-color: #d7be7a !important;
        background: linear-gradient(180deg, #4b3b1e 0%, #241b0d 100%) !important;
        box-shadow:
          inset 0 0 0 1px rgba(255, 235, 187, 0.1),
          0 16px 34px rgba(34, 23, 5, 0.3),
          0 0 24px rgba(215, 190, 122, 0.08) !important;
      }

      .stateChoice.abundance.active > span,
      .stateChoice.abundance.active > small {
        color: #ecd69b !important;
      }

      .stateChoice.alpha.active .selectionMark,
      .stateChoice.delta.active .selectionMark {
        background: #a9e6ff !important;
        border-color: #dbf5ff !important;
      }

      .stateChoice.gamma.active .selectionMark {
        background: #8db8ff !important;
        border-color: #c6dcff !important;
      }

      .stateChoice.theta.active .selectionMark {
        background: #aa9eff !important;
        border-color: #ded8ff !important;
      }

      .stateChoice.abundance.active .selectionMark {
        background: #d7be7a !important;
        border-color: #f5e5b5 !important;
      }

      /* Selected-state surface has clearer contrast and frequency identity. */
      .selectedSummary {
        border-color: #31587c !important;
        background: linear-gradient(135deg, #10243c 0%, #08172b 100%) !important;
        box-shadow:
          inset 0 0 0 1px rgba(163, 218, 255, 0.05),
          0 18px 42px rgba(2, 10, 22, 0.22) !important;
      }

      .selectedSummary strong {
        color: #f5f9fd !important;
      }

      .selectedSummary p,
      .selectedSummary .technicalSummary {
        color: #b9c9da !important;
      }

      .selectedSummary.alpha {
        border-color: #3b7898 !important;
        background: linear-gradient(135deg, #15384f 0%, #0a1b2c 100%) !important;
      }

      .selectedSummary.gamma {
        border-color: #416fae !important;
        background: linear-gradient(135deg, #172f58 0%, #0a172d 100%) !important;
      }

      .selectedSummary.theta {
        border-color: #5f5ba3 !important;
        background: linear-gradient(135deg, #282954 0%, #12152e 100%) !important;
      }

      .selectedSummary.delta {
        border-color: #4d789e !important;
        background: linear-gradient(135deg, #1b344d 0%, #0b192b 100%) !important;
      }

      .selectedSummary.abundance {
        border-color: var(--ev-gold-border) !important;
        background: linear-gradient(135deg, #302614 0%, #151008 100%) !important;
        box-shadow:
          inset 0 0 0 1px rgba(255, 230, 173, 0.06),
          0 18px 42px rgba(28, 17, 2, 0.24) !important;
      }

      .selectedSummary.abundance strong {
        color: #fff5db !important;
      }

      .selectedSummary.abundance p,
      .selectedSummary.abundance .technicalSummary {
        color: #d8ccb0 !important;
      }

      /* Current-state badge now matches its selected frequency. */
      .signalBadge {
        color: #bce9ff !important;
        border-color: #315878 !important;
        background: rgba(12, 29, 49, 0.9) !important;
      }

      .signalBadge.gamma {
        color: #b7d0ff !important;
        border-color: #42699f !important;
      }

      .signalBadge.theta {
        color: #cec8ff !important;
        border-color: #5c5898 !important;
      }

      .signalBadge.delta {
        color: #b9e1ff !important;
        border-color: #47779d !important;
      }

      .signalBadge.abundance {
        color: #ecd69b !important;
        border-color: #6f5525 !important;
        background: rgba(42, 33, 19, 0.92) !important;
      }

      /* Abundance receives a full, intentional gold action hierarchy. */
      .sessionBuilder:has(.stateChoice.abundance.active) .builderActions .primaryButton {
        color: #241700 !important;
        border-color: #f0dcaa !important;
        background: linear-gradient(135deg, #f0d997 0%, #d3ad58 58%, #b98832 100%) !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.42),
          0 16px 34px rgba(118, 81, 19, 0.26),
          0 0 22px rgba(215, 190, 122, 0.12) !important;
        text-shadow: none;
      }

      .sessionBuilder:has(.stateChoice.abundance.active) .saveButton {
        color: #f5e8c5 !important;
        border-color: #8f6a2b !important;
        background: linear-gradient(180deg, #3b2e17 0%, #22190c 100%) !important;
        box-shadow: inset 0 1px 0 rgba(255, 231, 180, 0.08), 0 14px 30px rgba(37, 23, 4, 0.25) !important;
      }

      .sessionBuilder:has(.stateChoice.abundance.active) .durationRow button.active {
        color: #fff7e5 !important;
        border-color: #d6bd7c !important;
        background: linear-gradient(180deg, #78613a 0%, #4b3b22 100%) !important;
        box-shadow: inset 0 1px 0 rgba(255, 245, 214, 0.16), 0 10px 24px rgba(76, 51, 12, 0.22) !important;
      }

      @media (max-width: 720px) {
        .signalFigureAsset {
          width: min(19rem, 72%) !important;
        }

        .primaryButton,
        .secondaryButton,
        .saveButton {
          min-height: 56px;
        }
      }

      @media (max-width: 520px) {
        .signalFigureAsset {
          width: min(17rem, 74%) !important;
        }

        .fieldLabel {
          color: #eaf5ff !important;
          text-shadow: 0 0 18px rgba(67, 172, 238, 0.1);
        }
      }
    `}</style>
  );
}
