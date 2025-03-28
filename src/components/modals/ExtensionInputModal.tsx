import { App, Modal } from "obsidian";
import React, { useState } from "react";
import { createRoot, Root } from "react-dom/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LocaleService from "@/i18n/LocaleService";
import { Locale, DEFAULT_LOCALE } from "@/i18n/config";
import { LOCALE_CHANGE_EVENT } from "@/i18n/components/LanguageSelector";

function ExtensionInputModalContent({
  onConfirm,
  onCancel,
  localeService,
}: {
  onConfirm: (extension: string) => void;
  onCancel: () => void;
  localeService: LocaleService;
}) {
  const [extension, setExtension] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validateAndConfirm = (value: string) => {
    if (value.includes(" ")) {
      setError(localeService.getTranslation("extensionInput.error.noSpaces"));
      return;
    }
    setError(null);
    onConfirm(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      validateAndConfirm(extension);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Input
          placeholder={localeService.getTranslation("extensionInput.placeholder")}
          value={extension}
          onChange={(e) => {
            setExtension(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
        />
        {error && <p className="text-error text-sm">{error}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {localeService.getTranslation("common.cancel")}
        </Button>
        <Button variant="default" onClick={() => validateAndConfirm(extension)}>
          {localeService.getTranslation("common.confirm")}
        </Button>
      </div>
    </div>
  );
}

export class ExtensionInputModal extends Modal {
  private root: Root;
  private localeService: LocaleService;
  private currentLocale: Locale;

  constructor(
    app: App,
    private onConfirm: (extension: string) => void
  ) {
    super(app);
    this.localeService = LocaleService.getInstance();
    this.currentLocale = this.getStoredLocale();
    // @ts-ignore
    this.setTitle(this.localeService.getTranslation("extensionInput.title"));
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

  private handleStorageChange = (e: StorageEvent) => {
    if (e.key === "obsidian-copilot-locale" && e.newValue) {
      if (e.newValue === "en" || e.newValue === "zh-CN") {
        this.currentLocale = e.newValue as Locale;
        this.localeService.setLocale(this.currentLocale);
        // @ts-ignore
        this.setTitle(this.localeService.getTranslation("extensionInput.title"));
        this.root?.render(
          <ExtensionInputModalContent
            onConfirm={this.handleConfirm}
            onCancel={this.handleCancel}
            localeService={this.localeService}
          />
        );
      }
    }
  };

  private handleLocaleChange = (e: CustomEvent<{ locale: Locale }>) => {
    this.currentLocale = e.detail.locale;
    this.localeService.setLocale(this.currentLocale);
    // @ts-ignore
    this.setTitle(this.localeService.getTranslation("extensionInput.title"));
    this.root?.render(
      <ExtensionInputModalContent
        onConfirm={this.handleConfirm}
        onCancel={this.handleCancel}
        localeService={this.localeService}
      />
    );
  };

  private handleConfirm = (extension: string) => {
    this.onConfirm(extension);
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
      <ExtensionInputModalContent
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
