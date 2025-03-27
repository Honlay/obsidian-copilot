import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { Locale } from "../config";
import { useLocale } from "../hooks/useLocale";
import { LOCALE_CHANGE_EVENT } from "./LanguageSelector";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isDefaultLocale: boolean;
}

// 创建国际化上下文
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// 提供国际化上下文的Provider组件
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const localeData = useLocale();
  // 添加一个重新渲染的key，当语言变化时通过改变key来触发整个树的重新渲染
  const [renderKey, setRenderKey] = useState<number>(0);

  // 监听语言变化事件
  useEffect(() => {
    const handleLocaleChange = () => {
      // 强制重新渲染整个树
      setRenderKey((prev) => prev + 1);
    };

    // 添加事件监听
    window.addEventListener(LOCALE_CHANGE_EVENT as any, handleLocaleChange);

    return () => {
      window.removeEventListener(LOCALE_CHANGE_EVENT as any, handleLocaleChange);
    };
  }, []);

  // 当locale变化时也更新renderKey
  useEffect(() => {
    setRenderKey((prev) => prev + 1);
  }, [localeData.locale]);

  const value = useMemo(
    () => ({
      locale: localeData.locale,
      setLocale: localeData.setLocale,
      isDefaultLocale: localeData.isDefaultLocale,
    }),
    [localeData.locale, localeData.setLocale, localeData.isDefaultLocale]
  );

  return (
    // 使用key来确保当语言改变时整个组件树会重新渲染
    <I18nContext.Provider key={renderKey} value={value}>
      {children}
    </I18nContext.Provider>
  );
};

// 钩子，用于获取国际化上下文
export const useI18nContext = (): I18nContextType => {
  const context = useContext(I18nContext);

  if (context === undefined) {
    throw new Error("useI18nContext must be used within an I18nProvider");
  }

  return context;
};
