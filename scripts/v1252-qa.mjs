import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH,
  args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(String(e)));
await page.goto('http://127.0.0.1:3000/voyage', { waitUntil: 'networkidle0' });
await page.waitForSelector('#ev-premium-library');

const result = await page.evaluate(() => {
  const categories = Array.from(document.querySelectorAll('.evPremiumCategoryTabs button'));
  const youtube = document.querySelector('.youtubeOrigin');
  const builder = document.querySelector('#session-builder');
  const libTitle = document.querySelector('.evPremiumLibraryTitle');
  const explanation = document.querySelector('.evPremiumLibraryHeader > p');
  if (!youtube || !builder || !libTitle || !explanation) throw new Error('Required V12.5.2 UI missing');
  const yr = youtube.getBoundingClientRect();
  const br = builder.getBoundingClientRect();
  return {
    categoryCount: categories.length,
    categoryTitleSizes: categories.map(b => parseFloat(getComputedStyle(b.querySelector('strong')).fontSize)),
    categorySubtitleSizes: categories.map(b => parseFloat(getComputedStyle(b.querySelector('small')).fontSize)),
    libraryTitleSize: parseFloat(getComputedStyle(libTitle).fontSize),
    explanationSize: parseFloat(getComputedStyle(explanation).fontSize),
    youtubeVisible: getComputedStyle(youtube).display !== 'none' && yr.height > 0,
    youtubeBeforeBuilder: yr.bottom <= br.top + 1,
    youtubeText: youtube.textContent || '',
    bodyOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth
  };
});
if (result.categoryCount !== 5) throw new Error(`Expected 5 categories, got ${result.categoryCount}`);
if (Math.min(...result.categoryTitleSizes) < 18) throw new Error('Category title is still too small');
if (Math.min(...result.categorySubtitleSizes) < 13) throw new Error('Category subtitle is still too small');
if (result.libraryTitleSize < 27) throw new Error(`Premium library title too small: ${result.libraryTitleSize}`);
if (result.explanationSize < 14.5) throw new Error(`Library explanation too small: ${result.explanationSize}`);
if (!result.youtubeVisible || !result.youtubeBeforeBuilder || !result.youtubeText.includes('YouTube')) throw new Error('YouTube origin block placement/visibility failed');
if (result.bodyOverflowX > 2) throw new Error(`Horizontal overflow detected: ${result.bodyOverflowX}`);

const categoryButtons = await page.$$('.evPremiumCategoryTabs button');
for (let i = 0; i < categoryButtons.length; i++) {
  await categoryButtons[i].click();
  await new Promise(r => setTimeout(r, 100));
  const count = await page.$$eval('.evPremiumSignalGrid .evPremiumSignalCard', els => els.length);
  if (count !== 7) throw new Error(`Category ${i} expected 7 cards, got ${count}`);
}

const previewNames = ['Solar Harmony','Celestial Radiance','Recall Spark','Knowledge Flow','Productive Rhythm','Clear Purpose','Inner Light','Serene Expansion','Moonlit Ease','Quiet Horizon'];
for (const name of previewNames) {
  let found = false;
  const tabs = await page.$$('.evPremiumCategoryTabs button');
  for (const tab of tabs) {
    await tab.click();
    await new Promise(r => setTimeout(r, 70));
    found = await page.evaluate((target) => Array.from(document.querySelectorAll('.evPremiumSignalCard')).some(el => (el.textContent || '').includes(target)), name);
    if (found) {
      await page.evaluate((target) => Array.from(document.querySelectorAll('.evPremiumSignalCard')).find(el => (el.textContent || '').includes(target))?.click(), name);
      break;
    }
  }
  if (!found) throw new Error(`Could not find card: ${name}`);
  await page.waitForSelector('.evPremiumModal', { timeout: 4000 });
  const modalText = await page.$eval('.evPremiumModal', el => el.textContent || '');
  if (!modalText.includes(name) || !modalText.includes('Immersive Frequency')) throw new Error(`Preview identity failed for ${name}`);
  await page.click('.evPreviewButton');
  await new Promise(r => setTimeout(r, 500));
  const playing = await page.$eval('.evPreviewButton', el => (el.textContent || '').includes('Stop preview'));
  if (!playing) throw new Error(`Preview did not start for ${name}`);
  await page.click('.evPreviewButton');
  await page.click('.evPremiumModalClose');
  await new Promise(r => setTimeout(r, 100));
}

if (pageErrors.length) throw new Error('Page errors: ' + pageErrors.join(' | '));
await browser.close();
