import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { App } from "obsidian";
import { TRANSLATIONS } from "@/i18n/config";

export class ResetSettingsConfirmModal extends ConfirmModal {
  constructor(app: App, onConfirm: () => void) {
    // 尝试获取当前语言环境下的i18n数据
    // 注意：由于这是一个类组件而非React组件，我们不能使用钩子，所以直接使用localStorage获取语言设置
    let locale = "en";
    try {
      const storedLocale = localStorage.getItem("obsidian-copilot-locale");
      if (storedLocale && (storedLocale === "en" || storedLocale === "zh-CN")) {
        locale = storedLocale;
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }

    // 从翻译文件中获取对应的文本
    const t = TRANSLATIONS[locale as "en" | "zh-CN"];

    super(app, onConfirm, t.settings.resetSettingsConfirm, t.settings.resetSettings);
  }
}
