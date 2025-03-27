import { useMemo } from "react";
import { DEFAULT_LOCALE, Locale, TRANSLATIONS } from "../config";
import { useLocale } from "./useLocale";

type NestedKeyOf<T> = {
  [K in keyof T & (string | number)]: T[K] extends object ? `${K}.${NestedKeyOf<T[K]>}` : `${K}`;
}[keyof T & (string | number)];

type TranslationKey = NestedKeyOf<(typeof TRANSLATIONS)[typeof DEFAULT_LOCALE]>;

// 用于从嵌套对象获取值的辅助函数
const getNestedValue = <T extends object>(obj: T, path: string): any => {
  return path.split(".").reduce((acc, part) => {
    return acc && (acc as any)[part] !== undefined ? (acc as any)[part] : undefined;
  }, obj);
};

// 转换类型，用于在翻译中替换变量
type InterpolateParams = Record<string, string | number>;

// 替换字符串中的变量，格式为 {{variableName}}
const interpolate = (text: string, params?: InterpolateParams): string => {
  if (!params) return text;

  return Object.entries(params).reduce((acc, [key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    return acc.replace(regex, String(value));
  }, text);
};

export const useTranslation = () => {
  const { locale } = useLocale();

  const translate = useMemo(() => {
    // 允许接受字符串类型的键
    return (key: string | TranslationKey, params?: InterpolateParams): string => {
      // 获取当前语言的翻译
      const localizedTranslations = TRANSLATIONS[locale as Locale] || TRANSLATIONS[DEFAULT_LOCALE];

      // 从嵌套对象获取指定路径的值
      let translatedText = getNestedValue(localizedTranslations, key);

      // 如果找不到翻译，则尝试使用默认语言的翻译
      if (translatedText === undefined && locale !== DEFAULT_LOCALE) {
        translatedText = getNestedValue(TRANSLATIONS[DEFAULT_LOCALE], key);
      }

      // 如果仍然找不到翻译，则返回键名
      if (translatedText === undefined) {
        return key;
      }

      // 替换变量
      return interpolate(translatedText, params);
    };
  }, [locale]);

  return { t: translate };
};
