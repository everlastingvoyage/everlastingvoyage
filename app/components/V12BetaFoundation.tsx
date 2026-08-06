'use client';

import { useEffect } from 'react';
import { startAnalyticsProvider } from '../lib/analytics/analytics-provider';
import V12AnalyticsBridge from './V12AnalyticsBridge';
import V12AnalyticsConsent from './V12AnalyticsConsent';
import V12AnalyticsDebug from './V12AnalyticsDebug';
import V12AnalyticsPreferences from './V12AnalyticsPreferences';
import V12BetaOnboarding from './V12BetaOnboarding';
import V12CompletionFeedback from './V12CompletionFeedback';
import V12LegalFooter from './V12LegalFooter';

export default function V12BetaFoundation({ textFeedbackEnabled }: { textFeedbackEnabled: boolean }) {
  useEffect(() => startAnalyticsProvider(), []);

  return (
    <>
      <V12AnalyticsBridge />
      <V12BetaOnboarding />
      <V12AnalyticsConsent />
      <V12AnalyticsPreferences />
      <V12CompletionFeedback textFeedbackEnabled={textFeedbackEnabled} />
      <V12LegalFooter />
      <V12AnalyticsDebug />
    </>
  );
}
