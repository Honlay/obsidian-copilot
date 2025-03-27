import React, { useEffect } from "react";
import { Locale, LOCALE_NAMES, LOCALES } from "../config";
import { useI18nContext } from "./I18nProvider";
import { useTranslation } from "../hooks/useTranslation";

// 定义一个自定义事件名称
export const LOCALE_CHANGE_EVENT = "locale-changed";

// 提供全局触发语言变化事件的函数
export const triggerLocaleChangeEvent = (locale: Locale) => {
  const event = new CustomEvent(LOCALE_CHANGE_EVENT, {
    detail: { locale },
  });
  window.dispatchEvent(event);
};

interface LanguageSelectorProps {
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className }) => {
  const { locale, setLocale } = useI18nContext();
  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value as Locale;

    // 先触发自定义事件，通知其他组件语言即将更改
    triggerLocaleChangeEvent(newLocale);

    // 然后设置新的语言
    setLocale(newLocale);
  };

  // 组件挂载时，添加事件监听器确保localStorage变化时能够更新界面
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "obsidian-copilot-locale" && e.newValue) {
        if (Object.values(LOCALES).includes(e.newValue as Locale)) {
          // 触发自定义事件
          triggerLocaleChangeEvent(e.newValue as Locale);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <div className={className}>
      <select
        value={locale}
        onChange={handleChange}
        className="select select-bordered w-full max-w-xs"
        aria-label={t("settings.language")}
      >
        {Object.values(LOCALES).map((localeOption) => (
          <option key={localeOption} value={localeOption}>
            {LOCALE_NAMES[localeOption]}
          </option>
        ))}
      </select>
    </div>
  );
};
