import en from "./locales/en.json";
import zhCN from "./locales/zh-CN.json";

export type Locale = "en" | "zh-CN";

export const LOCALES = {
  EN: "en" as const,
  ZH_CN: "zh-CN" as const,
};

export const LOCALE_NAMES = {
  [LOCALES.EN]: "English",
  [LOCALES.ZH_CN]: "中文 (简体)",
};

export const DEFAULT_LOCALE = LOCALES.EN;

export const TRANSLATIONS = {
  [LOCALES.EN]: en,
  [LOCALES.ZH_CN]: zhCN,
};

// 用于获取浏览器语言和检查支持的语言
export const getBrowserLocale = (): Locale => {
  // 首先尝试获取用户的浏览器设置
  const browserLocale = navigator.language;

  // 如果浏览器语言为中文，返回zh-CN
  if (browserLocale.startsWith("zh")) {
    return LOCALES.ZH_CN;
  }

  // 默认返回英文
  return LOCALES.EN;
};
