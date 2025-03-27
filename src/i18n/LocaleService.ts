import { DEFAULT_LOCALE, TRANSLATIONS, type Locale } from "./config";
import { EventEmitter } from "events";

class LocaleService {
  private static instance: LocaleService;
  private currentLocale: Locale = DEFAULT_LOCALE;
  private eventEmitter = new EventEmitter();

  private constructor() {
    // 单例模式
  }

  public static getInstance(): LocaleService {
    if (!LocaleService.instance) {
      LocaleService.instance = new LocaleService();
    }
    return LocaleService.instance;
  }

  public getLocale(): Locale {
    return this.currentLocale;
  }

  public setLocale(locale: Locale): void {
    if (this.currentLocale !== locale) {
      this.currentLocale = locale;
      this.eventEmitter.emit("localeChanged", locale);
    }
  }

  public getTranslation(key: string, locale?: Locale): any {
    const targetLocale = locale || this.currentLocale;
    const parts = key.split(".");
    let translation: any = TRANSLATIONS[targetLocale];

    for (const part of parts) {
      if (!translation || !translation[part]) {
        // 如果在当前语言中找不到翻译，尝试在默认语言中查找
        if (targetLocale !== DEFAULT_LOCALE) {
          return this.getTranslation(key, DEFAULT_LOCALE);
        }
        return key; // 如果默认语言中也没有，则返回键本身
      }
      translation = translation[part];
    }

    return translation;
  }

  public onLocaleChange(callback: (locale: Locale) => void): void {
    this.eventEmitter.on("localeChanged", callback);
  }

  public offLocaleChange(callback: (locale: Locale) => void): void {
    this.eventEmitter.off("localeChanged", callback);
  }
}

export default LocaleService;
