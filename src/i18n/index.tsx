import { I18nProvider, useI18nContext } from "./components/I18nProvider";
import { LanguageSelector } from "./components/LanguageSelector";
import { LOCALES, LOCALE_NAMES, DEFAULT_LOCALE, Locale } from "./config";
import { useTranslation } from "./hooks/useTranslation";
import { useLocale } from "./hooks/useLocale";

export {
  I18nProvider,
  LanguageSelector,
  useI18nContext,
  useTranslation,
  useLocale,
  LOCALES,
  LOCALE_NAMES,
  DEFAULT_LOCALE,
  type Locale,
};
