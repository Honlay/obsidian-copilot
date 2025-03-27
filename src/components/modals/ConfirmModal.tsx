import React, { FC, useEffect, useState } from "react";
import { TRANSLATIONS, Locale, DEFAULT_LOCALE } from "@/i18n/config";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { App } from "obsidian";
import { createRoot } from "react-dom/client";
import { LOCALE_CHANGE_EVENT } from "@/i18n/components/LanguageSelector";

export interface ConfirmModalProps {
  title?: string;
  description?: string | JSX.Element;
  onOK: () => void;
  open: boolean;
  onCancel: () => void;
  loading?: boolean;
  tLeft?: string;
  tRight?: string;
}

export const ConfirmModalComponent: FC<ConfirmModalProps> = ({
  title,
  description,
  onOK,
  open,
  onCancel,
  loading = false,
  tLeft = "common.cancel",
  tRight = "common.continue",
}) => {
  // 使用状态存储当前语言，这样当语言变化时组件会重新渲染
  const [currentLocale, setCurrentLocale] = useState<Locale>(() => {
    try {
      const storedLocale = localStorage.getItem("obsidian-copilot-locale");
      return storedLocale && (storedLocale === "en" || storedLocale === "zh-CN")
        ? (storedLocale as Locale)
        : DEFAULT_LOCALE;
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return DEFAULT_LOCALE;
    }
  });

  // 监听localStorage变化以更新语言
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "obsidian-copilot-locale" && e.newValue) {
        if (e.newValue === "en" || e.newValue === "zh-CN") {
          setCurrentLocale(e.newValue as Locale);
        }
      }
    };

    // 监听语言选择器触发的自定义事件
    const handleLocaleChange = (e: CustomEvent<{ locale: Locale }>) => {
      setCurrentLocale(e.detail.locale);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(LOCALE_CHANGE_EVENT as any, handleLocaleChange as any);

    // 创建一个定时器定期检查localStorage中的语言设置
    const checkInterval = setInterval(() => {
      try {
        const storedLocale = localStorage.getItem("obsidian-copilot-locale");
        if (
          storedLocale &&
          (storedLocale === "en" || storedLocale === "zh-CN") &&
          storedLocale !== currentLocale
        ) {
          setCurrentLocale(storedLocale as Locale);
        }
      } catch (error) {
        console.error("Error checking localStorage:", error);
      }
    }, 1000); // 每秒检查一次

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(LOCALE_CHANGE_EVENT as any, handleLocaleChange as any);
      clearInterval(checkInterval);
    };
  }, [currentLocale]);

  const t = TRANSLATIONS[currentLocale] || TRANSLATIONS[DEFAULT_LOCALE];

  // 安全地获取翻译项
  const getTranslation = (key: string) => {
    if (key.includes(".")) {
      const [section, item] = key.split(".");
      // 使用类型断言解决索引问题
      const sectionObj = t[section as keyof typeof t];
      return sectionObj && typeof sectionObj === "object"
        ? (sectionObj as Record<string, string>)[item] || key
        : key;
    }
    return key;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title || t.settings?.resetSettingsConfirm}</DialogTitle>
        </DialogHeader>
        {description && (
          <div className="my-4 mb-6">
            <p className="dark:text-gray-300 text-gray-700 py-4">{description}</p>
          </div>
        )}
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onCancel}>
            {getTranslation(tLeft)}
          </Button>
          <Button variant="default" onClick={onOK} className="px-[18px]" disabled={loading}>
            {getTranslation(tRight)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 兼容旧版Obsidian Modal API的类
export class ConfirmModal {
  private onConfirm: () => void;
  private title: string;
  private description?: string;
  private app: App;

  constructor(app: App, onConfirm: () => void, title?: string, description?: string) {
    this.app = app;
    this.onConfirm = onConfirm;
    this.title = title || "";
    this.description = description;
  }

  // Obsidian API兼容的open方法
  open() {
    // 创建一个容器元素
    const container = document.createElement("div");
    document.body.appendChild(container);

    // 创建React根元素
    const root = createRoot(container);

    // 打开Dialog
    const closeDialog = () => {
      root.unmount();
      container.remove();
    };

    // 渲染React组件
    root.render(
      <ConfirmModalComponent
        title={this.title}
        description={this.description}
        onOK={() => {
          this.onConfirm();
          closeDialog();
        }}
        open={true}
        onCancel={closeDialog}
      />
    );
  }
}

// 默认导出React组件，保持向后兼容
export default ConfirmModalComponent;
