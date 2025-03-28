import { App, Modal } from "obsidian";
import React, { useState } from "react";
import { createRoot, Root } from "react-dom/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LocaleService from "@/i18n/LocaleService";
import { Locale, DEFAULT_LOCALE } from "@/i18n/config";
import { LOCALE_CHANGE_EVENT } from "@/i18n/components/LanguageSelector";

function CustomPatternInputModalContent({
  onConfirm,
  onCancel,
  localeService,
}: {
  onConfirm: (pattern: string) => void;
  onCancel: () => void;
  localeService: LocaleService;
}) {
  // TODO: Add validation
  const [pattern, setPattern] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onConfirm(pattern);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <div>{localeService.getTranslation("customPattern.description")}</div>
        <Input
          placeholder={localeService.getTranslation("customPattern.placeholder")}
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {localeService.getTranslation("common.cancel")}
        </Button>
        <Button variant="default" onClick={() => onConfirm(pattern)}>
          {localeService.getTranslation("common.confirm")}
        </Button>
      </div>
    </div>
  );
}

export class CustomPatternInputModal extends Modal {
  private root: Root;
  private localeService: LocaleService;
  private currentLocale: Locale;
  private handleStorageChange: (e: StorageEvent) => void;
  private handleLocaleChange: (e: CustomEvent<{ locale: Locale }>) => void;

  constructor(
    app: App,
    private onConfirm: (pattern: string) => void
  ) {
    super(app);
    this.localeService = LocaleService.getInstance();
    this.currentLocale = this.getStoredLocale();

    // 初始化事件处理器
    this.handleStorageChange = (e: StorageEvent) => {
      if (e.key === "obsidian-copilot-locale" && e.newValue) {
        if (e.newValue === "en" || e.newValue === "zh-CN") {
          this.currentLocale = e.newValue as Locale;
          this.localeService.setLocale(this.currentLocale);
          // @ts-ignore
          this.setTitle(this.localeService.getTranslation("customPattern.title"));
          this.root?.render(
            <CustomPatternInputModalContent
              onConfirm={this.handleConfirm}
              onCancel={this.handleCancel}
              localeService={this.localeService}
            />
          );
        }
      }
    };

    this.handleLocaleChange = (e: CustomEvent<{ locale: Locale }>) => {
      this.currentLocale = e.detail.locale;
      this.localeService.setLocale(this.currentLocale);
      // @ts-ignore
      this.setTitle(this.localeService.getTranslation("customPattern.title"));
      this.root?.render(
        <CustomPatternInputModalContent
          onConfirm={this.handleConfirm}
          onCancel={this.handleCancel}
          localeService={this.localeService}
        />
      );
    };

    // @ts-ignore
    this.setTitle(this.localeService.getTranslation("customPattern.title"));
  }

  private getStoredLocale(): Locale {
    try {
      const storedLocale = localStorage.getItem("obsidian-copilot-locale");
      return storedLocale && (storedLocale === "en" || storedLocale === "zh-CN")
        ? (storedLocale as Locale)
        : DEFAULT_LOCALE;
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return DEFAULT_LOCALE;
    }
  }

  private handleConfirm = (pattern: string) => {
    this.onConfirm(pattern);
    this.close();
  };

  private handleCancel = () => {
    this.close();
  };

  onOpen() {
    const { contentEl } = this;
    this.root = createRoot(contentEl);

    window.addEventListener("storage", this.handleStorageChange);
    window.addEventListener(LOCALE_CHANGE_EVENT as any, this.handleLocaleChange as any);

    this.root.render(
      <CustomPatternInputModalContent
        onConfirm={this.handleConfirm}
        onCancel={this.handleCancel}
        localeService={this.localeService}
      />
    );
  }

  onClose() {
    window.removeEventListener("storage", this.handleStorageChange);
    window.removeEventListener(LOCALE_CHANGE_EVENT as any, this.handleLocaleChange as any);
    this.root.unmount();
  }
}
