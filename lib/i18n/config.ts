/** Draft configuration. A language must pass the complete journey before activation. */
export const locales = ['en', 'nl', 'fr', 'de'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const languageNames: Record<Locale, string> = {
  en: 'English', nl: 'Nederlands', fr: 'Français', de: 'Deutsch',
};
export const regionalLocales: Record<Locale, string> = {
  en: 'en-BE', nl: 'nl-BE', fr: 'fr-BE', de: 'de-DE',
};
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && locales.some(locale => locale === value);
}
/** Suggest only: explicit choice wins. This never determines delivery country. */
export function suggestedLocale(acceptLanguage: string | null, choice?: unknown): Locale {
  if (isLocale(choice)) return choice;
  const preferences = (acceptLanguage || '').split(',').map((entry, index) => {
    const [tag, ...parameters] = entry.trim().toLowerCase().split(';');
    const quality = parameters.find(parameter => parameter.trim().startsWith('q='));
    const q = quality ? Number(quality.trim().slice(2)) : 1;
    return { tag: tag.split('-')[0], q, index };
  }).filter(entry => Number.isFinite(entry.q) && entry.q > 0 && entry.q <= 1)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const {tag} of preferences) if (isLocale(tag)) return tag;
  return defaultLocale;
}
export function localizedMoney(cents: number, locale: Locale): string {
  return new Intl.NumberFormat(regionalLocales[locale], {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 2,
  }).format(cents / 100);
}
