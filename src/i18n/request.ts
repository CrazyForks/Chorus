// src/i18n/request.ts
// Server-side i18n configuration for next-intl

import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, type Locale } from './config';

export default getRequestConfig(async () => {
  // For client-side locale detection, we use defaultLocale on server
  // The actual locale is managed client-side via LocaleProvider
  const locale: Locale = defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
