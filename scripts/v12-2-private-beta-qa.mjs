import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const BASE_URL = 'http://127.0.0.1:3000';
const OUTPUT_DIR = 'v12-2-qa';
const forbiddenKeys = /^(intention|thought|note|name|email|url|href|referrer|error_message|message|stack|content|clipboard|device_id|ip|query)$/i;
const analyticsRequests = [];
const pageErrors = [];

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
});

async function createPage(width = 1440, height = 900) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  page.setDefaultTimeout(30_000);
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.url().includes('analytics.invalid.example')) {
      analyticsRequests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData() ?? ''
      });
      void request.abort();
      return;
    }
    void request.continue();
  });
  return page;
}

async function waitForRunning(page) {
  await page.waitForSelector('.v10SessionOverlay.running:not(.completed)');
  await page.waitForFunction(() => {
    const button = document.querySelector('.v10TimerControls .v10PrimaryAction');
    return button?.textContent?.trim().toLowerCase().includes('pause');
  });
}

async function endRunningSession(page) {
  await page.click('.v10TimerControls .v10TextAction');
  await page.waitForSelector('.v11ExitConfirmDialog');
  await page.click('.v11ExitConfirmActions .secondary');
  await page.waitForSelector('.v10SessionOverlay.completed .v10Completion');
}

async function openVoyage(page, state) {
  await page.click(`.stateChoice.${state}`);
  await page.click('.builderActions .primaryButton');
  await page.waitForSelector(`.v10SessionOverlay.${state}:not(.completed)`);
}

try {
  const page = await createPage();

  // Consent is genuinely opt-in: neither the provider nor an event request may
  // leave the browser before the visitor makes an explicit choice.
  await page.goto(`${BASE_URL}/voyage`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.v12Onboarding');
  if (analyticsRequests.length !== 0) {
    throw new Error('Analytics network activity occurred before consent');
  }

  await page.click('.v12OnboardingActions button:first-child');
  await page.waitForSelector('.v12AnalyticsConsent');
  await page.click('.stateChoice.gamma');
  if (analyticsRequests.length !== 0) {
    throw new Error('State selection initialized analytics before consent');
  }

  // Essential-only mode must leave every part of the Voyage usable and silent.
  await page.click('.v12AnalyticsConsent > div button:first-child');
  await page.waitForFunction(() => localStorage.getItem('ev:analytics:consent:v1') === 'denied');
  await openVoyage(page, 'alpha');
  await page.click('.v10TimerControls .v10PrimaryAction');
  await waitForRunning(page);
  await endRunningSession(page);

  if (analyticsRequests.length !== 0) {
    throw new Error('Denied consent still produced analytics traffic');
  }
  if (await page.$('.v12CompletionFeedback textarea')) {
    throw new Error('Written feedback field appeared without a configured server destination');
  }
  await page.click('.v12FeedbackRating button:first-child');
  await page.waitForSelector('.v12FeedbackThanks');

  // Start a clean granted-consent visit.
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('ev:onboarding:v12.2', 'skipped');
  });
  analyticsRequests.length = 0;
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('.v12AnalyticsConsent');
  await page.click('.v12AnalyticsConsent .primary');
  await page.waitForFunction(() => localStorage.getItem('ev:analytics:consent:v1') === 'granted');
  await page.waitForFunction(() => Boolean(localStorage.getItem('ev:analytics:anonymous-id:v1')));

  await page.click('.stateChoice.theta');
  const durationButtons = await page.$$('.durationRow button');
  if (durationButtons.length > 1) await durationButtons[1].click();
  await page.click('.builderActions .primaryButton');
  await page.waitForSelector('.v10SessionOverlay.theta:not(.completed)');
  await page.click('.v10TimerControls .v10PrimaryAction');
  await waitForRunning(page);

  await page.type('#v10-thought', 'Private text that must never enter analytics');
  await page.click('.v10ThoughtCapture button[type="submit"]');
  const atmosphereToggle = await page.$('.evSessionAtmosphereToggle');
  if (atmosphereToggle) await atmosphereToggle.click();
  await endRunningSession(page);
  await page.click('.v12FeedbackRating button:nth-child(2)');
  await page.waitForSelector('.v12FeedbackThanks');

  for (let attempt = 0; attempt < 24 && analyticsRequests.length === 0; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  const qa = await page.evaluate(() => window.__EV_ANALYTICS_QA__);
  if (!qa) throw new Error('Analytics QA snapshot was not exposed');

  const names = qa.lastEvents.map((event) => event.name);
  for (const required of [
    'analytics_consent_updated',
    'state_selected',
    'voyage_started',
    'thought_captured',
    'voyage_abandoned',
    'feedback_submitted'
  ]) {
    if (!names.includes(required)) throw new Error(`Missing analytics event: ${required}`);
  }

  for (const event of qa.lastEvents) {
    for (const [key, value] of Object.entries(event.properties)) {
      if (forbiddenKeys.test(key)) {
        throw new Error(`Forbidden analytics property key: ${key}`);
      }
      if (typeof value === 'string' && value.includes('Private text')) {
        throw new Error(`Private thought leaked through ${event.name}`);
      }
    }
  }

  if (analyticsRequests.length === 0) {
    throw new Error('Granted consent never initialized the configured provider');
  }

  // Preferences remain editable and revocation clears the local identifier.
  await page.click('#ev-v12-completion-legal-root .v12LegalLinks button');
  await page.waitForSelector('.v12PreferencesDialog');
  await page.click('.v12PreferenceChoices button:first-child');
  await page.waitForFunction(() => localStorage.getItem('ev:analytics:consent:v1') === 'denied');
  const anonymousId = await page.evaluate(() => localStorage.getItem('ev:analytics:anonymous-id:v1'));
  if (anonymousId !== null) {
    throw new Error('Revoking consent did not clear the anonymous identifier');
  }

  // The feedback endpoint rejects extra/private fields before checking its destination.
  const invalidFeedbackStatus = await page.evaluate(async () => {
    const response = await fetch('/api/beta-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voyage_session_id: 'valid-session-1234',
        rating: 'problem',
        comment: 'test',
        intention: 'forbidden'
      })
    });
    return response.status;
  });
  if (invalidFeedbackStatus !== 400) {
    throw new Error(`Unexpected-field feedback status: ${invalidFeedbackStatus}`);
  }

  for (const route of ['/privacy', '/terms', '/wellness', '/audio-licenses', '/contact']) {
    const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle0' });
    if (!response?.ok()) throw new Error(`Legal route failed: ${route}`);
    if (!(await page.$('.v12LegalPage'))) throw new Error(`Legal shell missing: ${route}`);
  }

  const profiles = [
    { name: 'wide-desktop', width: 1792, height: 864 },
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'tablet', width: 1024, height: 768 },
    { name: 'narrow', width: 900, height: 700 },
    { name: 'mobile', width: 390, height: 844 }
  ];
  const geometryResults = [];

  for (const profile of profiles) {
    const visual = await createPage(profile.width, profile.height);
    await visual.goto(`${BASE_URL}/voyage`, { waitUntil: 'networkidle0' });
    await visual.evaluate(() => {
      localStorage.setItem('ev:onboarding:v12.2', 'skipped');
      localStorage.setItem('ev:analytics:consent:v1', 'denied');
    });
    await visual.reload({ waitUntil: 'networkidle0' });
    await openVoyage(visual, 'alpha');
    await visual.waitForSelector('#ev-session-atmosphere-root .evSessionAtmosphere');
    await new Promise((resolve) => setTimeout(resolve, 450));

    const geometry = await visual.evaluate(() => {
      const rect = (selector) => {
        const element = document.querySelector(selector);
        if (!element) throw new Error(`Missing ${selector}`);
        const value = element.getBoundingClientRect();
        return {
          left: value.left,
          top: value.top,
          right: value.right,
          bottom: value.bottom
        };
      };
      return {
        identity: rect('.v10SessionIdentity'),
        timer: rect('.v10TimerArea'),
        capture: rect('.v10ThoughtCapture'),
        signal: rect('.v10AudioControls'),
        atmosphere: rect('#ev-session-atmosphere-root .evSessionAtmosphere'),
        footer: rect('.v10SessionFooter')
      };
    });

    const overlap = (a, b) => (
      Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
      Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
    );
    const issues = [];
    for (const key of ['identity', 'timer', 'capture', 'signal']) {
      if (overlap(geometry[key], geometry.atmosphere) > 1) {
        issues.push(`${key} overlaps Atmosphere`);
      }
    }
    if (overlap(geometry.atmosphere, geometry.footer) > 1) {
      issues.push('Atmosphere overlaps footer');
    }
    geometryResults.push({ profile, geometry, issues });

    await visual.screenshot({
      path: `${OUTPUT_DIR}/${profile.name}-session.png`,
      fullPage: false
    });
    await visual.close();
  }

  const layoutIssues = geometryResults.flatMap((result) => (
    result.issues.map((issue) => `${result.profile.name}: ${issue}`)
  ));
  if (layoutIssues.length) throw new Error(layoutIssues.join(' | '));
  if (pageErrors.length) throw new Error(`Page errors: ${pageErrors.join(' | ')}`);

  fs.writeFileSync(
    `${OUTPUT_DIR}/results.json`,
    JSON.stringify({ analyticsRequests: analyticsRequests.length, qa, geometryResults }, null, 2)
  );
  await page.close();
} finally {
  await browser.close();
}
