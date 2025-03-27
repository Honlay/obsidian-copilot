import { useCallback, useEffect, useState } from "react";
import { DEFAULT_LOCALE, Locale, LOCALES, getBrowserLocale } from "../config";

// 本地存储键
const LOCALE_STORAGE_KEY = "obsidian-copilot-locale";

// 从本地存储获取语言
const getStoredLocale = (): Locale | null => {
  try {
    const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (storedLocale && Object.values(LOCALES).includes(storedLocale as Locale)) {
      return storedLocale as Locale;
    }
  } catch (error) {
    console.error("Error accessing localStorage:", error);
  }
  return null;
};

// 将语言保存到本地存储
const storeLocale = (locale: Locale): void => {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch (error) {
    console.error("Error storing locale in localStorage:", error);
  }
};

export const useLocale = () => {
  // 初始化状态：首先尝试从本地存储获取，然后是浏览器语言，最后是默认语言
  const [locale, setLocaleState] = useState<Locale>(() => {
    return getStoredLocale() || getBrowserLocale() || DEFAULT_LOCALE;
  });

  // 更新语言的函数
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    storeLocale(newLocale);
  }, []);

  // 当组件挂载时，确保语言已存储
  useEffect(() => {
    storeLocale(locale);
  }, [locale]);

  return {
    locale,
    setLocale,
    isDefaultLocale: locale === DEFAULT_LOCALE,
  };
};
