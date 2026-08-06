import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const BASE_URL = 'http://127.0.0.1:3000';
const OUTPUT_DIR = 'v12-2-qa';
const pageErrors = [];

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
});

async function createPage({ width = 1440, height = 900, blockAnalytics = true } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  page.setDefaultTimeout(30_000);
  page.on('pageerror', (error) => pageErrors.push(String(error)));

  if (blockAnalytics) {
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().includes('analytics.invalid.example')) {
        void request.abort();
      } else {
        void request.continue();
      }
    });
  }

  return page;
}

async function resetLocalState(page) {
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
}

async function waitForRunning(page) {
  await page.waitForSelector('.v10SessionOverlay.running:not(.completed)');
  await page.waitForFunction(() => {
    const button = document.querySelector('.v10TimerControls .v10PrimaryAction');
    return button?.textContent?.trim().toLowerCase().includes('pause');
  });
}

async function openAndBegin(page, state = 'alpha') {
  await page.click(`.stateChoice.${state}`);
  await page.click('.builderActions .primaryButton');
  await page.waitForSelector(`.v10SessionOverlay.${state}:not(.completed)`);
  await page.click('.v10TimerControls .v10PrimaryAction');
  await waitForRunning(page);
}

try {
  // Desktop first-visit onboarding: focus is contained and Escape is a real skip.
  const desktop = await createPage();
  await desktop.goto(`${BASE_URL}/voyage`, { waitUntil: 'networkidle0' });
  await desktop.waitForSelector('.v12Onboarding', { visible: true });
  const initialFocusInside = await desktop.evaluate(() => (
    Boolean(document.activeElement?.closest('.v12Onboarding'))
  ));
  if (!initialFocusInside) throw new Error('Desktop onboarding did not receive keyboard focus');

  await desktop.keyboard.press('Tab');
  const tabFocusInside = await desktop.evaluate(() => (
    Boolean(document.activeElement?.closest('.v12Onboarding'))
  ));
  if (!tabFocusInside) throw new Error('Desktop onboarding did not retain keyboard focus');

  await desktop.screenshot({ path: `${OUTPUT_DIR}/desktop-onboarding.png`, fullPage: false });
  await desktop.keyboard.press('Escape');
  await desktop.waitForSelector('.v12Onboarding', { hidden: true });
  await desktop.waitForFunction(() => localStorage.getItem('ev:onboarding:v12.2') === 'skipped');
  await desktop.reload({ waitUntil: 'networkidle0' });
  await new Promise((resolve) => setTimeout(resolve, 5400));
  if (await desktop.$('.v12Onboarding')) {
    throw new Error('Skipped onboarding returned after refresh');
  }
  await desktop.close();

  // Mobile reduced-motion onboarding: all three steps complete and stay complete.
  const mobile = await createPage({ width: 390, height: 844 });
  await mobile.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await mobile.goto(`${BASE_URL}/voyage`, { waitUntil: 'networkidle0' });
  await resetLocalState(mobile);
  await mobile.waitForSelector('.v12Onboarding', { visible: true });

  const animationName = await mobile.$eval('.v12OnboardingCopy', (element) => getComputedStyle(element).animationName);
  if (animationName !== 'none') {
    throw new Error(`Reduced-motion onboarding still animates: ${animationName}`);
  }

  await mobile.screenshot({ path: `${OUTPUT_DIR}/mobile-onboarding.png`, fullPage: false });
  await mobile.click('.v12OnboardingActions .primary');
  await mobile.click('.v12OnboardingActions .primary');
  await mobile.click('.v12OnboardingActions .primary');
  await mobile.waitForSelector('.v12Onboarding', { hidden: true });
  await mobile.waitForFunction(() => localStorage.getItem('ev:onboarding:v12.2') === 'completed');
  await mobile.reload({ waitUntil: 'networkidle0' });
  await new Promise((resolve) => setTimeout(resolve, 5400));
  if (await mobile.$('.v12Onboarding')) {
    throw new Error('Completed onboarding returned after refresh');
  }
  await mobile.close();

  // Analytics storage failures remain isolated and cannot block entering a Voyage.
  const storageDisabled = await createPage();
  await storageDisabled.evaluateOnNewDocument(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Storage disabled for QA', 'SecurityError');
      }
    });
  });
  await storageDisabled.goto(`${BASE_URL}/voyage`, { waitUntil: 'networkidle0' });
  await storageDisabled.waitForSelector('.v12AnalyticsConsent');
  await storageDisabled.click('.v12AnalyticsConsent > div button:first-child');
  await storageDisabled.click('.stateChoice.alpha');
  await storageDisabled.click('.builderActions .primaryButton');
  await storageDisabled.waitForSelector('.v10SessionOverlay.alpha:not(.completed)');
  await storageDisabled.close();

  // Cancellation is not abandonment. Confirmed End Voyage is counted once.
  const lifecycle = await createPage();
  await lifecycle.goto(`${BASE_URL}/voyage`, { waitUntil: 'networkidle0' });
  await lifecycle.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('ev:onboarding:v12.2', 'skipped');
  });
  await lifecycle.reload({ waitUntil: 'networkidle0' });
  await lifecycle.waitForSelector('.v12AnalyticsConsent');
  await lifecycle.click('.v12AnalyticsConsent .primary');
  await lifecycle.waitForFunction(() => localStorage.getItem('ev:analytics:consent:v1') === 'granted');
  await openAndBegin(lifecycle, 'alpha');

  await lifecycle.click('.v10TimerControls .v10TextAction');
  await lifecycle.waitForSelector('.v11ExitConfirmDialog');
  let abandonmentCount = await lifecycle.evaluate(() => (
    window.__EV_ANALYTICS_QA__?.lastEvents.filter((event) => event.name === 'voyage_abandoned').length ?? 0
  ));
  if (abandonmentCount !== 0) {
    throw new Error('Opening the exit confirmation counted as abandonment');
  }

  await lifecycle.click('.v11ExitConfirmActions .primary');
  await lifecycle.waitForSelector('.v11ExitConfirmDialog', { hidden: true });
  await waitForRunning(lifecycle);
  abandonmentCount = await lifecycle.evaluate(() => (
    window.__EV_ANALYTICS_QA__?.lastEvents.filter((event) => event.name === 'voyage_abandoned').length ?? 0
  ));
  if (abandonmentCount !== 0) {
    throw new Error('Continue Voyage counted as abandonment');
  }

  await lifecycle.click('.v10TimerControls .v10TextAction');
  await lifecycle.waitForSelector('.v11ExitConfirmDialog');
  await lifecycle.click('.v11ExitConfirmActions .secondary');
  await lifecycle.waitForSelector('.v10SessionOverlay.completed .v10Completion');
  await lifecycle.waitForFunction(() => (
    window.__EV_ANALYTICS_QA__?.lastEvents.filter((event) => event.name === 'voyage_abandoned').length === 1
  ));

  // Structured problem feedback works with no written-feedback destination.
  await lifecycle.click('.v12FeedbackRating button:nth-child(3)');
  await lifecycle.waitForSelector('.v12FeedbackProblem');
  await lifecycle.click('.v12FeedbackIssues button:first-child');
  await lifecycle.click('.v12FeedbackSubmit');
  await lifecycle.waitForSelector('.v12FeedbackThanks');
  await lifecycle.screenshot({ path: `${OUTPUT_DIR}/desktop-completion-feedback.png`, fullPage: false });

  const problemEvent = await lifecycle.evaluate(() => (
    window.__EV_ANALYTICS_QA__?.lastEvents
      .filter((event) => event.name === 'feedback_submitted')
      .at(-1)
  ));
  if (problemEvent?.properties.rating !== 'problem' || problemEvent?.properties.issue_area !== 'audio') {
    throw new Error('Problem feedback did not preserve its structured category');
  }

  const oversizedStatus = await lifecycle.evaluate(async () => {
    const response = await fetch('/api/beta-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voyage_session_id: 'valid-session-5678',
        rating: 'problem',
        issue_area: 'other',
        comment: 'x'.repeat(501),
        app_version: '12.2.0'
      })
    });
    return response.status;
  });
  if (oversizedStatus !== 400) {
    throw new Error(`501-character feedback status was ${oversizedStatus}`);
  }

  await lifecycle.close();

  if (pageErrors.length) {
    throw new Error(`Page errors: ${pageErrors.join(' | ')}`);
  }

  fs.writeFileSync(
    `${OUTPUT_DIR}/interaction-results.json`,
    JSON.stringify({
      desktopOnboarding: 'escape-skipped',
      mobileOnboarding: 'completed-reduced-motion',
      localStorageDisabled: 'voyage-opened',
      exitCancellation: 'not-abandoned',
      confirmedExit: 'one-abandonment',
      problemFeedback: 'audio',
      oversizedFeedbackStatus: 400
    }, null, 2)
  );
} finally {
  await browser.close();
}
