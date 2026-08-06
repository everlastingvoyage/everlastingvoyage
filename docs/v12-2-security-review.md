# V12.2 Security Review

Reviewed: 2026-08-06

## Production dependency audit

The V12.2 CI audit reports three inherited high-severity alerts under the current stable Next.js dependency tree:

- PostCSS source-map path/file disclosure advisories, including GHSA-6g55-p6wh-862q and GHSA-r28c-9q8g-f849.
- Sharp/libvips inherited image-processing advisory GHSA-f88m-g3jw-g9cj.

The automated audit fix proposes Next.js 16.3.0. At review time, 16.3.0 is available only through preview/canary channels; Next.js 16.2.12 is the current stable release used by the project. Everlasting Voyage will not move production to a preview framework release solely to silence the audit.

## Current exposure assessment

The affected PostCSS behavior requires processing attacker-controlled CSS or source-map annotations. Everlasting Voyage does not accept CSS uploads, custom themes, user stylesheets or runtime CSS processing.

The affected Sharp behavior requires decoding untrusted image input. Everlasting Voyage does not accept image uploads or dynamically process user-provided images.

Therefore, the vulnerable capabilities are present transitively but are not exposed by the current private-beta feature set. This is a time-bounded accepted risk, not a claim that the dependencies are vulnerability-free.

## Required follow-up

- Upgrade to the first stable Next.js release whose dependency tree resolves the affected PostCSS and Sharp versions.
- Re-run the full V12.2, Pomodoro layout, footer and Chamber regression suites after that upgrade.
- Reassess immediately before adding any image upload, custom CSS, theme upload or user-supplied asset processing.
- Do not use `npm audit fix --force` or a Next.js preview release without a dedicated compatibility branch and full visual/audio QA.

## V12.2 application protections

- Analytics loads only after explicit consent.
- Autocapture, page views, session replay, heatmaps, surveys, automatic exception capture and automatic text/attribute capture are disabled.
- Event names and properties are allowlisted.
- Intention text, thought text, Notes, Saved Space names, feedback comments, raw errors, stack traces and source URLs are excluded from product analytics.
- Optional written feedback is validated server-side and uses server-only credentials.
- Accounts, payments, checkout and Premium access controls are not included in this sprint.
