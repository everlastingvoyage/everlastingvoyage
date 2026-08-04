'use client';

export default function SignalChamberPolish() {
  return (
    <style jsx global>{`
      :root {
        --ev-alpha: #6adeff;
        --ev-alpha-rgb: 106, 222, 255;
        --ev-gamma: #57f1b3;
        --ev-gamma-rgb: 87, 241, 179;
        --ev-theta: #7c8cff;
        --ev-theta-rgb: 124, 140, 255;
        --ev-delta: #cadceb;
        --ev-delta-rgb: 202, 220, 235;
        --ev-abundance: #e6b249;
        --ev-abundance-rgb: 230, 178, 73;
        --ev-orange: #c86a26;
      }

      /* Builder: one coherent color language from state to session. */
      .sessionBuilder .stateChoice.alpha {
        --state-accent: var(--ev-alpha);
        --state-rgb: var(--ev-alpha-rgb);
      }

      .sessionBuilder .stateChoice.gamma {
        --state-accent: var(--ev-gamma);
        --state-rgb: var(--ev-gamma-rgb);
      }

      .sessionBuilder .stateChoice.theta {
        --state-accent: var(--ev-theta);
        --state-rgb: var(--ev-theta-rgb);
      }

      .sessionBuilder .stateChoice.delta {
        --state-accent: var(--ev-delta);
        --state-rgb: var(--ev-delta-rgb);
      }

      .sessionBuilder .stateChoice.abundance {
        --state-accent: var(--ev-abundance);
        --state-rgb: var(--ev-abundance-rgb);
      }

      .sessionBuilder .stateChoice {
        border-color: rgba(var(--state-rgb), 0.22) !important;
        background:
          linear-gradient(180deg, rgba(var(--state-rgb), 0.045), transparent 46%),
          linear-gradient(180deg, #08172a 0%, #040d1a 100%) !important;
      }

      .sessionBuilder .stateChoice > span,
      .sessionBuilder .stateChoice > small {
        color: rgba(var(--state-rgb), 0.72) !important;
      }

      .sessionBuilder .stateChoice:hover,
      .sessionBuilder .stateChoice:focus-visible {
        border-color: rgba(var(--state-rgb), 0.58) !important;
        background:
          linear-gradient(180deg, rgba(var(--state-rgb), 0.12), transparent 58%),
          linear-gradient(180deg, #0a1c31 0%, #06111f 100%) !important;
        box-shadow:
          inset 0 0 0 1px rgba(var(--state-rgb), 0.06),
          0 14px 30px rgba(0, 0, 0, 0.22),
          0 0 24px rgba(var(--state-rgb), 0.08) !important;
      }

      .sessionBuilder .stateChoice.active {
        border-color: rgba(var(--state-rgb), 0.92) !important;
        background:
          radial-gradient(circle at 80% 16%, rgba(var(--state-rgb), 0.24), transparent 38%),
          linear-gradient(145deg, rgba(var(--state-rgb), 0.26), rgba(6, 18, 34, 0.98) 64%) !important;
        box-shadow:
          inset 0 0 0 1px rgba(var(--state-rgb), 0.14),
          0 18px 36px rgba(0, 0, 0, 0.26),
          0 0 28px rgba(var(--state-rgb), 0.12) !important;
      }

      .sessionBuilder .stateChoice.active > span,
      .sessionBuilder .stateChoice.active > small {
        color: var(--state-accent) !important;
      }

      .sessionBuilder .stateChoice.active .selectionMark {
        color: #03101b !important;
        border-color: rgba(255, 255, 255, 0.72) !important;
        background: var(--state-accent) !important;
        box-shadow: 0 0 20px rgba(var(--state-rgb), 0.42) !important;
      }

      .sessionBuilder:has(.stateChoice.alpha.active) {
        --builder-accent: var(--ev-alpha);
        --builder-rgb: var(--ev-alpha-rgb);
      }

      .sessionBuilder:has(.stateChoice.gamma.active) {
        --builder-accent: var(--ev-gamma);
        --builder-rgb: var(--ev-gamma-rgb);
      }

      .sessionBuilder:has(.stateChoice.theta.active) {
        --builder-accent: var(--ev-theta);
        --builder-rgb: var(--ev-theta-rgb);
      }

      .sessionBuilder:has(.stateChoice.delta.active) {
        --builder-accent: var(--ev-delta);
        --builder-rgb: var(--ev-delta-rgb);
      }

      .sessionBuilder:has(.stateChoice.abundance.active) {
        --builder-accent: var(--ev-abundance);
        --builder-rgb: var(--ev-abundance-rgb);
      }

      .sessionBuilder .signalBadge {
        color: var(--builder-accent) !important;
        border-color: rgba(var(--builder-rgb), 0.5) !important;
        background: rgba(var(--builder-rgb), 0.075) !important;
        box-shadow: inset 0 0 0 1px rgba(var(--builder-rgb), 0.04) !important;
      }

      .sessionBuilder .durationRow button.active {
        color: #ffffff !important;
        border-color: rgba(var(--builder-rgb), 0.92) !important;
        background:
          radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.18), transparent 45%),
          linear-gradient(180deg, rgba(var(--builder-rgb), 0.62), rgba(var(--builder-rgb), 0.22)) !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.22),
          0 10px 24px rgba(var(--builder-rgb), 0.18),
          0 0 18px rgba(var(--builder-rgb), 0.1) !important;
      }

      .sessionBuilder .selectedSummary {
        border-color: rgba(var(--builder-rgb), 0.55) !important;
        background:
          radial-gradient(circle at 86% 12%, rgba(var(--builder-rgb), 0.14), transparent 34%),
          linear-gradient(135deg, rgba(var(--builder-rgb), 0.19), #081526 58%, #040c17 100%) !important;
        box-shadow:
          inset 0 0 0 1px rgba(var(--builder-rgb), 0.06),
          0 20px 44px rgba(0, 0, 0, 0.24) !important;
      }

      .sessionBuilder .selectedSummary .summaryLabel {
        color: var(--builder-accent) !important;
      }

      .sessionBuilder .selectedSummary strong {
        color: #f7fbff !important;
      }

      .sessionBuilder .selectedSummary p,
      .sessionBuilder .selectedSummary .technicalSummary {
        color: #c0cedd !important;
      }

      .sessionBuilder .builderActions .primaryButton {
        color: #04101c !important;
        border-color: rgba(255, 255, 255, 0.66) !important;
        background:
          linear-gradient(135deg, rgba(255, 255, 255, 0.36), transparent 38%),
          linear-gradient(135deg, var(--builder-accent), rgba(var(--builder-rgb), 0.72)) !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.42),
          0 16px 34px rgba(var(--builder-rgb), 0.22),
          0 0 26px rgba(var(--builder-rgb), 0.12) !important;
        text-shadow: none !important;
      }

      .sessionBuilder:has(.stateChoice.theta.active) .builderActions .primaryButton {
        color: #ffffff !important;
      }

      .sessionBuilder:has(.stateChoice.abundance.active) .builderActions .primaryButton {
        color: #241300 !important;
        background:
          linear-gradient(135deg, rgba(255, 247, 211, 0.42), transparent 36%),
          linear-gradient(135deg, #f0d68b 0%, var(--ev-abundance) 58%, var(--ev-orange) 100%) !important;
      }

      .sessionBuilder .saveButton {
        color: #edf6ff !important;
        border-color: rgba(var(--builder-rgb), 0.5) !important;
        background:
          linear-gradient(180deg, rgba(var(--builder-rgb), 0.15), rgba(var(--builder-rgb), 0.055)),
          linear-gradient(180deg, #101d32 0%, #081221 100%) !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.06),
          0 14px 28px rgba(0, 0, 0, 0.24) !important;
      }

      .sessionBuilder .saveButton:hover {
        border-color: rgba(var(--builder-rgb), 0.86) !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.08),
          0 16px 32px rgba(0, 0, 0, 0.28),
          0 0 20px rgba(var(--builder-rgb), 0.1) !important;
      }

      /* Frequency Library: transform the card into a living signal chamber. */
      #library .horizontalIntro {
        align-items: end;
      }

      #library .signalExperience {
        position: relative;
        overflow: hidden !important;
        padding: clamp(18px, 2vw, 30px) !important;
        border-color: rgba(93, 157, 218, 0.26) !important;
        background:
          radial-gradient(circle at 50% 46%, rgba(60, 123, 220, 0.17), transparent 35%),
          radial-gradient(circle at 12% 16%, rgba(var(--ev-alpha-rgb), 0.08), transparent 28%),
          radial-gradient(circle at 88% 20%, rgba(var(--ev-gamma-rgb), 0.055), transparent 28%),
          radial-gradient(circle at 84% 84%, rgba(var(--ev-theta-rgb), 0.06), transparent 30%),
          radial-gradient(circle at 16% 84%, rgba(var(--ev-delta-rgb), 0.055), transparent 30%),
          linear-gradient(145deg, #071426 0%, #030a14 56%, #02060d 100%) !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.035),
          inset 0 0 70px rgba(16, 68, 118, 0.12),
          0 30px 90px rgba(0, 0, 0, 0.44) !important;
      }

      #library .signalExperience::before {
        content: '';
        position: absolute;
        inset: -28%;
        pointer-events: none;
        background: conic-gradient(
          from 30deg,
          transparent 0deg,
          rgba(var(--ev-alpha-rgb), 0.1) 46deg,
          transparent 78deg,
          rgba(var(--ev-gamma-rgb), 0.08) 132deg,
          transparent 166deg,
          rgba(var(--ev-abundance-rgb), 0.075) 224deg,
          transparent 258deg,
          rgba(var(--ev-theta-rgb), 0.09) 312deg,
          transparent 360deg
        );
        filter: blur(70px);
        opacity: 0.72;
        animation: evChamberAurora 26s linear infinite;
      }

      #library .signalExperienceTop,
      #library .signalStage {
        position: relative;
        z-index: 1;
      }

      #library .compactHint {
        color: #a9b9ca !important;
      }

      #library .signalStage {
        min-height: clamp(680px, 56vw, 790px) !important;
        overflow: hidden !important;
        isolation: isolate;
        border-color: rgba(102, 172, 234, 0.24) !important;
        background:
          radial-gradient(circle at 50% 48%, rgba(61, 132, 226, 0.24) 0%, rgba(14, 50, 91, 0.18) 24%, transparent 47%),
          radial-gradient(ellipse at 50% 50%, rgba(12, 39, 72, 0.26), transparent 66%),
          linear-gradient(180deg, rgba(5, 16, 31, 0.96), rgba(1, 7, 15, 0.99)) !important;
        box-shadow:
          inset 0 0 0 1px rgba(255, 255, 255, 0.018),
          inset 0 0 84px rgba(19, 70, 124, 0.16),
          0 18px 48px rgba(0, 0, 0, 0.26) !important;
        transition: background 420ms ease, border-color 420ms ease, box-shadow 420ms ease;
      }

      #library .signalStage::before {
        content: '' !important;
        position: absolute !important;
        inset: 9% 14% !important;
        z-index: 0;
        border: 0 !important;
        border-radius: 50% !important;
        background:
          repeating-radial-gradient(
            ellipse at center,
            rgba(116, 196, 255, 0.095) 0 1px,
            transparent 1px 66px
          ) !important;
        mask-image: radial-gradient(ellipse at center, #000 0%, #000 68%, transparent 88%);
        opacity: 0.78;
        animation: evRingBreath 7s ease-in-out infinite;
      }

      #library .signalStage::after {
        content: '' !important;
        position: absolute !important;
        inset: 0 !important;
        z-index: 0;
        border: 0 !important;
        border-radius: inherit !important;
        background:
          linear-gradient(90deg, transparent 49.88%, rgba(114, 196, 255, 0.11) 50%, transparent 50.12%),
          linear-gradient(0deg, transparent 49.88%, rgba(114, 196, 255, 0.075) 50%, transparent 50.12%),
          conic-gradient(
            from 45deg at 50% 50%,
            transparent 0 11%,
            rgba(92, 177, 255, 0.055) 12%,
            transparent 13% 36%,
            rgba(92, 177, 255, 0.045) 37%,
            transparent 38% 61%,
            rgba(92, 177, 255, 0.05) 62%,
            transparent 63% 86%,
            rgba(92, 177, 255, 0.045) 87%,
            transparent 88% 100%
          ) !important;
        opacity: 0.62;
        pointer-events: none;
        animation: evSignalSweep 18s linear infinite;
      }

      #library .signalFigure {
        z-index: 1;
      }

      #library .signalFigure::before {
        content: '';
        position: absolute;
        width: min(31rem, 54%);
        aspect-ratio: 1;
        border-radius: 50%;
        background:
          radial-gradient(circle, rgba(111, 180, 255, 0.22) 0%, rgba(35, 92, 158, 0.14) 30%, rgba(4, 16, 31, 0) 70%);
        filter: blur(18px);
        box-shadow:
          0 0 70px rgba(62, 128, 255, 0.22),
          inset 0 0 48px rgba(91, 188, 255, 0.13);
        animation: evCoreBreath 5.4s ease-in-out infinite;
      }

      #library .signalFigureAsset {
        z-index: 3 !important;
        width: min(27rem, 42%) !important;
        filter:
          drop-shadow(0 0 20px rgba(89, 157, 255, 0.34))
          drop-shadow(0 0 54px rgba(49, 91, 255, 0.26)) !important;
      }

      #library .signalFigureHalo {
        z-index: 1;
        border-color: rgba(115, 193, 255, 0.19) !important;
        box-shadow:
          0 0 24px rgba(75, 159, 255, 0.12),
          inset 0 0 24px rgba(75, 159, 255, 0.04) !important;
      }

      #library .haloOuter {
        width: min(39rem, 70%) !important;
        height: min(39rem, 78%) !important;
      }

      #library .haloMid {
        width: min(31rem, 57%) !important;
        height: min(31rem, 64%) !important;
      }

      #library .haloInner {
        width: min(23rem, 44%) !important;
        height: min(23rem, 49%) !important;
      }

      #library .signalSparkles {
        z-index: 2;
      }

      #library .sparkle:nth-child(1),
      #library .sparkle:nth-child(5) {
        background: var(--ev-alpha) !important;
        box-shadow: 0 0 18px rgba(var(--ev-alpha-rgb), 0.7) !important;
      }

      #library .sparkle:nth-child(2),
      #library .sparkle:nth-child(6) {
        background: var(--ev-gamma) !important;
        box-shadow: 0 0 18px rgba(var(--ev-gamma-rgb), 0.6) !important;
      }

      #library .sparkle:nth-child(3),
      #library .sparkle:nth-child(8) {
        background: var(--ev-theta) !important;
        box-shadow: 0 0 18px rgba(var(--ev-theta-rgb), 0.62) !important;
      }

      #library .sparkle:nth-child(4) {
        background: var(--ev-delta) !important;
        box-shadow: 0 0 18px rgba(var(--ev-delta-rgb), 0.62) !important;
      }

      #library .sparkle:nth-child(7) {
        background: var(--ev-abundance) !important;
        box-shadow: 0 0 18px rgba(var(--ev-abundance-rgb), 0.65) !important;
      }

      #library .signalNode {
        --node-accent: var(--ev-alpha);
        --node-rgb: var(--ev-alpha-rgb);
        z-index: 3 !important;
        width: clamp(132px, 12vw, 164px) !important;
        min-width: 0 !important;
        min-height: 116px !important;
        display: grid !important;
        place-content: center !important;
        gap: 8px;
        padding: 16px !important;
        border-radius: 24px !important;
        border-color: rgba(var(--node-rgb), 0.38) !important;
        background:
          radial-gradient(circle at 50% 0%, rgba(var(--node-rgb), 0.12), transparent 48%),
          linear-gradient(180deg, rgba(8, 22, 39, 0.96), rgba(3, 11, 22, 0.985)) !important;
        box-shadow:
          inset 0 0 0 1px rgba(var(--node-rgb), 0.035),
          0 18px 40px rgba(0, 0, 0, 0.28) !important;
        backdrop-filter: blur(16px);
        transition: transform 220ms ease, border-color 220ms ease, background 220ms ease, box-shadow 220ms ease !important;
      }

      #library .signalNode.alpha {
        --node-accent: var(--ev-alpha);
        --node-rgb: var(--ev-alpha-rgb);
      }

      #library .signalNode.gamma {
        --node-accent: var(--ev-gamma);
        --node-rgb: var(--ev-gamma-rgb);
      }

      #library .signalNode.theta {
        --node-accent: var(--ev-theta);
        --node-rgb: var(--ev-theta-rgb);
      }

      #library .signalNode.delta {
        --node-accent: var(--ev-delta);
        --node-rgb: var(--ev-delta-rgb);
      }

      #library .signalNode.abundance {
        --node-accent: var(--ev-abundance);
        --node-rgb: var(--ev-abundance-rgb);
      }

      #library .signalNode span {
        margin: 0 !important;
        color: var(--node-accent) !important;
        font-size: 0.84rem !important;
        line-height: 1.1;
        letter-spacing: 0.18em !important;
      }

      #library .signalNode strong {
        color: #f6fbff !important;
        font-size: clamp(1.7rem, 2.4vw, 2.15rem) !important;
        letter-spacing: -0.045em !important;
      }

      #library .signalNode:hover,
      #library .signalNode:focus-visible,
      #library .signalNode.active {
        transform: translateY(-4px) scale(1.025) !important;
        border-color: rgba(var(--node-rgb), 0.92) !important;
        background:
          radial-gradient(circle at 50% 0%, rgba(var(--node-rgb), 0.3), transparent 56%),
          linear-gradient(180deg, rgba(var(--node-rgb), 0.14), rgba(4, 14, 27, 0.99)) !important;
        box-shadow:
          inset 0 0 0 1px rgba(var(--node-rgb), 0.12),
          0 22px 44px rgba(0, 0, 0, 0.34),
          0 0 30px rgba(var(--node-rgb), 0.2) !important;
      }

      #library .signalNode:focus-visible {
        outline: 2px solid var(--node-accent);
        outline-offset: 4px;
      }

      #library .signalNode.alpha {
        left: 7% !important;
        top: 11% !important;
      }

      #library .signalNode.gamma {
        right: 7% !important;
        top: 11% !important;
      }

      #library .signalNode.delta {
        left: 7% !important;
        bottom: 20% !important;
      }

      #library .signalNode.theta {
        right: 7% !important;
        bottom: 20% !important;
      }

      #library .signalNode.abundance {
        left: 50% !important;
        bottom: 6.5% !important;
        transform: translateX(-50%) !important;
      }

      #library .signalNode.abundance:hover,
      #library .signalNode.abundance:focus-visible,
      #library .signalNode.abundance.active {
        transform: translateX(-50%) translateY(-4px) scale(1.025) !important;
      }

      /* The chamber reacts to the selected signal without recoloring the humanoid artwork itself. */
      #library .signalStage:has(.signalNode.alpha.active) {
        border-color: rgba(var(--ev-alpha-rgb), 0.48) !important;
        background:
          radial-gradient(circle at 50% 48%, rgba(var(--ev-alpha-rgb), 0.25), transparent 45%),
          linear-gradient(180deg, #07182a, #020812) !important;
      }

      #library .signalStage:has(.signalNode.gamma.active) {
        border-color: rgba(var(--ev-gamma-rgb), 0.48) !important;
        background:
          radial-gradient(circle at 50% 48%, rgba(var(--ev-gamma-rgb), 0.19), transparent 45%),
          linear-gradient(180deg, #071b20, #020a11) !important;
      }

      #library .signalStage:has(.signalNode.theta.active) {
        border-color: rgba(var(--ev-theta-rgb), 0.5) !important;
        background:
          radial-gradient(circle at 50% 48%, rgba(var(--ev-theta-rgb), 0.22), transparent 45%),
          linear-gradient(180deg, #0b1230, #030713) !important;
      }

      #library .signalStage:has(.signalNode.delta.active) {
        border-color: rgba(var(--ev-delta-rgb), 0.46) !important;
        background:
          radial-gradient(circle at 50% 48%, rgba(var(--ev-delta-rgb), 0.16), transparent 45%),
          linear-gradient(180deg, #0d1722, #03070d) !important;
      }

      #library .signalStage:has(.signalNode.abundance.active) {
        border-color: rgba(var(--ev-abundance-rgb), 0.5) !important;
        background:
          radial-gradient(circle at 50% 48%, rgba(var(--ev-abundance-rgb), 0.19), transparent 42%),
          radial-gradient(circle at 50% 60%, rgba(200, 106, 38, 0.08), transparent 48%),
          linear-gradient(180deg, #171208, #050403) !important;
      }

      #library .signalStage:has(.signalNode.alpha.active) .signalFigureHalo {
        border-color: rgba(var(--ev-alpha-rgb), 0.42) !important;
        box-shadow: 0 0 30px rgba(var(--ev-alpha-rgb), 0.18) !important;
      }

      #library .signalStage:has(.signalNode.gamma.active) .signalFigureHalo {
        border-color: rgba(var(--ev-gamma-rgb), 0.4) !important;
        box-shadow: 0 0 30px rgba(var(--ev-gamma-rgb), 0.16) !important;
      }

      #library .signalStage:has(.signalNode.theta.active) .signalFigureHalo {
        border-color: rgba(var(--ev-theta-rgb), 0.42) !important;
        box-shadow: 0 0 30px rgba(var(--ev-theta-rgb), 0.18) !important;
      }

      #library .signalStage:has(.signalNode.delta.active) .signalFigureHalo {
        border-color: rgba(var(--ev-delta-rgb), 0.34) !important;
        box-shadow: 0 0 30px rgba(var(--ev-delta-rgb), 0.14) !important;
      }

      #library .signalStage:has(.signalNode.abundance.active) .signalFigureHalo {
        border-color: rgba(var(--ev-abundance-rgb), 0.42) !important;
        box-shadow: 0 0 34px rgba(var(--ev-abundance-rgb), 0.18) !important;
      }

      /* Pop-up inherits the same state color and stays inside the chamber. */
      #library .signalPopupOverlay {
        --popup-accent: var(--ev-alpha);
        --popup-rgb: var(--ev-alpha-rgb);
        width: min(500px, calc(100% - 44px)) !important;
        padding: clamp(22px, 3vw, 30px) !important;
        border-color: rgba(var(--popup-rgb), 0.64) !important;
        background:
          radial-gradient(circle at 92% 0%, rgba(var(--popup-rgb), 0.17), transparent 34%),
          linear-gradient(150deg, rgba(9, 23, 40, 0.985), rgba(3, 9, 18, 0.995)) !important;
        box-shadow:
          inset 0 0 0 1px rgba(var(--popup-rgb), 0.075),
          0 32px 100px rgba(0, 0, 0, 0.62),
          0 0 40px rgba(var(--popup-rgb), 0.14) !important;
      }

      #library .signalPopupOverlay.alpha {
        --popup-accent: var(--ev-alpha);
        --popup-rgb: var(--ev-alpha-rgb);
      }

      #library .signalPopupOverlay.gamma {
        --popup-accent: var(--ev-gamma);
        --popup-rgb: var(--ev-gamma-rgb);
      }

      #library .signalPopupOverlay.theta {
        --popup-accent: var(--ev-theta);
        --popup-rgb: var(--ev-theta-rgb);
      }

      #library .signalPopupOverlay.delta {
        --popup-accent: var(--ev-delta);
        --popup-rgb: var(--ev-delta-rgb);
      }

      #library .signalPopupOverlay.abundance {
        --popup-accent: var(--ev-abundance);
        --popup-rgb: var(--ev-abundance-rgb);
        background:
          radial-gradient(circle at 92% 0%, rgba(var(--ev-abundance-rgb), 0.18), transparent 34%),
          radial-gradient(circle at 12% 100%, rgba(200, 106, 38, 0.09), transparent 38%),
          linear-gradient(150deg, rgba(31, 23, 11, 0.99), rgba(7, 7, 8, 0.995)) !important;
      }

      #library .signalPopupEyebrow {
        color: var(--popup-accent) !important;
      }

      #library .signalPopupClose {
        border-color: rgba(var(--popup-rgb), 0.45) !important;
        box-shadow: inset 0 0 0 1px rgba(var(--popup-rgb), 0.04) !important;
      }

      #library .signalPopupClose:hover {
        border-color: rgba(var(--popup-rgb), 0.9) !important;
        background: rgba(var(--popup-rgb), 0.13) !important;
      }

      #library .signalPopupAction {
        color: #041019 !important;
        border-color: rgba(255, 255, 255, 0.62) !important;
        background:
          linear-gradient(135deg, rgba(255, 255, 255, 0.34), transparent 38%),
          linear-gradient(135deg, var(--popup-accent), rgba(var(--popup-rgb), 0.7)) !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.42),
          0 14px 30px rgba(var(--popup-rgb), 0.19) !important;
      }

      #library .signalPopupOverlay.theta .signalPopupAction {
        color: #ffffff !important;
      }

      #library .signalPopupOverlay.abundance .signalPopupAction {
        color: #241300 !important;
        background:
          linear-gradient(135deg, rgba(255, 248, 215, 0.42), transparent 38%),
          linear-gradient(135deg, #f0d68b 0%, var(--ev-abundance) 58%, var(--ev-orange) 100%) !important;
      }

      /* Session environment inherits the selected state without losing the navy identity. */
      .sessionOverlay.alpha {
        --session-accent: var(--ev-alpha) !important;
        background:
          radial-gradient(circle at 50% 38%, rgba(var(--ev-alpha-rgb), 0.19), transparent 32rem),
          linear-gradient(180deg, #061526, #00040a 72%, #000) !important;
      }

      .sessionOverlay.gamma {
        --session-accent: var(--ev-gamma) !important;
        background:
          radial-gradient(circle at 50% 38%, rgba(var(--ev-gamma-rgb), 0.15), transparent 32rem),
          linear-gradient(180deg, #07191d, #00050a 72%, #000) !important;
      }

      .sessionOverlay.theta {
        --session-accent: var(--ev-theta) !important;
        background:
          radial-gradient(circle at 50% 38%, rgba(var(--ev-theta-rgb), 0.19), transparent 32rem),
          linear-gradient(180deg, #0a102a, #02040d 72%, #000) !important;
      }

      .sessionOverlay.delta {
        --session-accent: var(--ev-delta) !important;
        background:
          radial-gradient(circle at 50% 38%, rgba(var(--ev-delta-rgb), 0.13), transparent 32rem),
          linear-gradient(180deg, #0b141f, #010409 72%, #000) !important;
      }

      .sessionOverlay.abundance {
        --session-accent: var(--ev-abundance) !important;
        background:
          radial-gradient(circle at 50% 38%, rgba(var(--ev-abundance-rgb), 0.18), transparent 32rem),
          radial-gradient(circle at 68% 68%, rgba(200, 106, 38, 0.08), transparent 28rem),
          linear-gradient(180deg, #171108, #050301 72%, #000) !important;
      }

      .sessionOverlay .timerControls .primaryButton {
        color: #041019 !important;
        border-color: rgba(255, 255, 255, 0.66) !important;
        background:
          linear-gradient(135deg, rgba(255, 255, 255, 0.34), transparent 38%),
          linear-gradient(135deg, var(--session-accent), color-mix(in srgb, var(--session-accent) 72%, #14345c)) !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.42),
          0 14px 30px color-mix(in srgb, var(--session-accent) 22%, transparent) !important;
      }

      .sessionOverlay.theta .timerControls .primaryButton {
        color: #ffffff !important;
      }

      .sessionOverlay.abundance .timerControls .primaryButton {
        color: #241300 !important;
        background: linear-gradient(135deg, #f0d68b, var(--ev-abundance) 58%, var(--ev-orange)) !important;
      }

      .sessionOverlay .thoughtCapture input,
      .sessionOverlay .thoughtCapture button {
        border-color: color-mix(in srgb, var(--session-accent) 42%, transparent) !important;
      }

      @keyframes evChamberAurora {
        from { transform: rotate(0deg) scale(0.98); }
        to { transform: rotate(360deg) scale(1.04); }
      }

      @keyframes evRingBreath {
        0%, 100% { opacity: 0.54; transform: scale(0.96); }
        50% { opacity: 0.9; transform: scale(1.025); }
      }

      @keyframes evSignalSweep {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes evCoreBreath {
        0%, 100% { opacity: 0.72; transform: scale(0.94); }
        50% { opacity: 1; transform: scale(1.045); }
      }

      @media (prefers-reduced-motion: reduce) {
        #library .signalExperience::before,
        #library .signalStage::before,
        #library .signalStage::after,
        #library .signalFigure::before {
          animation: none !important;
        }
      }

      @media (max-width: 860px) {
        #library .signalStage {
          min-height: 760px !important;
        }

        #library .signalFigureAsset {
          width: min(22rem, 58%) !important;
        }

        #library .signalNode {
          width: min(31vw, 132px) !important;
          min-height: 104px !important;
          padding: 12px !important;
        }

        #library .signalNode span {
          font-size: 0.72rem !important;
        }

        #library .signalNode strong {
          font-size: 1.62rem !important;
        }
      }

      @media (max-width: 560px) {
        #library .signalExperience {
          padding: 14px !important;
        }

        #library .signalStage {
          min-height: 720px !important;
          border-radius: 26px !important;
        }

        #library .signalFigureAsset {
          width: min(18rem, 60%) !important;
        }

        #library .signalFigure::before {
          width: 68% !important;
        }

        #library .signalNode {
          width: 42% !important;
          max-width: 132px !important;
          min-height: 96px !important;
          border-radius: 21px !important;
        }

        #library .signalNode.alpha,
        #library .signalNode.delta {
          left: 4% !important;
        }

        #library .signalNode.gamma,
        #library .signalNode.theta {
          right: 4% !important;
        }

        #library .signalNode.alpha,
        #library .signalNode.gamma {
          top: 7.5% !important;
        }

        #library .signalNode.delta,
        #library .signalNode.theta {
          bottom: 21% !important;
        }

        #library .signalNode.abundance {
          width: min(46%, 150px) !important;
          bottom: 5.5% !important;
        }

        #library .signalPopupOverlay {
          width: calc(100% - 22px) !important;
          padding: 20px !important;
        }
      }
    `}</style>
  );
}
