import { PatternMatchingModal } from "@/components/modals/PatternMatchingModal";
import { RebuildIndexConfirmModal } from "@/components/modals/RebuildIndexConfirmModal";
import { Button } from "@/components/ui/button";
import { SettingItem } from "@/components/ui/setting-item";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { VAULT_VECTOR_STORE_STRATEGIES, VAULT_VECTOR_STORE_STRATEGY } from "@/constants";
import VectorStoreManager from "@/search/vectorStoreManager";
import { updateSetting, useSettingsValue } from "@/settings/model";
import { HelpCircle } from "lucide-react";
import React, { useMemo, useState, useEffect } from "react";
import LocaleService from "@/i18n/LocaleService";
import { Locale } from "@/i18n/config";
import { LOCALE_CHANGE_EVENT } from "@/i18n/components/LanguageSelector";

const getTranslatedStrategy = (strategy: VAULT_VECTOR_STORE_STRATEGY, locale: string): string => {
  const localeService = LocaleService.getInstance();
  localeService.setLocale(locale as Locale);

  const translations: Record<VAULT_VECTOR_STORE_STRATEGY, string> = {
    [VAULT_VECTOR_STORE_STRATEGY.NEVER]: localeService.getTranslation("vectorStoreStrategy.never"),
    [VAULT_VECTOR_STORE_STRATEGY.ON_STARTUP]: localeService.getTranslation(
      "vectorStoreStrategy.onStartup"
    ),
    [VAULT_VECTOR_STORE_STRATEGY.ON_MODE_SWITCH]: localeService.getTranslation(
      "vectorStoreStrategy.onModeSwitch"
    ),
  };
  return translations[strategy] || strategy;
};

export const QASettings: React.FC = () => {
  const settings = useSettingsValue();
  const [currentLocale, setCurrentLocale] = useState<string>(() => {
    try {
      const storedLocale = localStorage.getItem("obsidian-copilot-locale");
      return storedLocale && (storedLocale === "en" || storedLocale === "zh-CN")
        ? storedLocale
        : "en";
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return "en";
    }
  });

  // 监听localStorage变化以更新语言
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "obsidian-copilot-locale" && e.newValue) {
        if (e.newValue === "en" || e.newValue === "zh-CN") {
          setCurrentLocale(e.newValue);
        }
      }
    };

    // 监听语言选择器触发的自定义事件
    const handleLocaleChange = (e: CustomEvent<{ locale: string }>) => {
      setCurrentLocale(e.detail.locale);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(LOCALE_CHANGE_EVENT as any, handleLocaleChange as any);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(LOCALE_CHANGE_EVENT as any, handleLocaleChange as any);
    };
  }, []);

  // 初始化 LocaleService
  const localeService = useMemo(() => {
    const service = LocaleService.getInstance();
    service.setLocale(currentLocale as Locale);
    return service;
  }, [currentLocale]);

  const strategyOptions = useMemo(
    () =>
      VAULT_VECTOR_STORE_STRATEGIES.map((strategy) => ({
        label: getTranslatedStrategy(strategy, currentLocale),
        value: strategy,
      })),
    [currentLocale]
  );

  const handlePartitionsChange = (value: string) => {
    const numValue = parseInt(value);
    if (numValue !== settings.numPartitions) {
      new RebuildIndexConfirmModal(app, async () => {
        updateSetting("numPartitions", numValue);
        await VectorStoreManager.getInstance().indexVaultToVectorStore(true);
      }).open();
    }
  };

  return (
    <div className="space-y-4">
      <section>
        <div className="space-y-4">
          {/* Auto-Index Strategy */}
          <SettingItem
            type="select"
            title={localeService.getTranslation("qaSettings.autoIndexStrategy.title")}
            description={
              <div className="flex items-center gap-1.5">
                <span className="leading-none">
                  {localeService.getTranslation("qaSettings.autoIndexStrategy.description")}
                </span>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-2 py-2">
                        <div className="space-y-1">
                          <div className="text-muted text-sm">
                            {localeService.getTranslation(
                              "qaSettings.autoIndexStrategy.tooltipHeading"
                            )}
                          </div>
                          <ul className="space-y-1 pl-2 list-disc text-sm">
                            <li>
                              <div className="flex items-center gap-1">
                                <strong className="inline-block whitespace-nowrap">
                                  {localeService.getTranslation(
                                    "qaSettings.autoIndexStrategy.never.title"
                                  )}
                                  :
                                </strong>
                                <span>
                                  {localeService.getTranslation(
                                    "qaSettings.autoIndexStrategy.never.description"
                                  )}
                                </span>
                              </div>
                            </li>
                            <li>
                              <div className="flex items-center gap-1">
                                <strong className="inline-block whitespace-nowrap">
                                  {localeService.getTranslation(
                                    "qaSettings.autoIndexStrategy.onStartup.title"
                                  )}
                                  :
                                </strong>
                                <span>
                                  {localeService.getTranslation(
                                    "qaSettings.autoIndexStrategy.onStartup.description"
                                  )}
                                </span>
                              </div>
                            </li>
                            <li>
                              <div className="flex items-center gap-1">
                                <strong className="inline-block whitespace-nowrap">
                                  {localeService.getTranslation(
                                    "qaSettings.autoIndexStrategy.onModeSwitch.title"
                                  )}
                                  :
                                </strong>
                                <span>
                                  {localeService.getTranslation(
                                    "qaSettings.autoIndexStrategy.onModeSwitch.description"
                                  )}
                                </span>
                              </div>
                            </li>
                          </ul>
                        </div>
                        <p className="text-callout-warning text-sm">
                          {localeService.getTranslation("qaSettings.autoIndexStrategy.warning")}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            }
            value={settings.indexVaultToVectorStore}
            onChange={(value) => {
              updateSetting("indexVaultToVectorStore", value);
            }}
            options={strategyOptions}
            placeholder={localeService.getTranslation("qaSettings.strategy")}
          />

          {/* Max Sources */}
          <SettingItem
            type="slider"
            title={localeService.getTranslation("qaSettings.maxSources.title")}
            description={localeService.getTranslation("qaSettings.maxSources.description")}
            min={1}
            max={128}
            step={1}
            value={settings.maxSourceChunks}
            onChange={(value) => updateSetting("maxSourceChunks", value)}
          />

          {/* Requests per Minute */}
          <SettingItem
            type="slider"
            title={localeService.getTranslation("qaSettings.requestsPerMinute.title")}
            description={localeService.getTranslation("qaSettings.requestsPerMinute.description")}
            min={10}
            max={300}
            step={10}
            value={settings.embeddingRequestsPerMin}
            onChange={(value) => updateSetting("embeddingRequestsPerMin", value)}
          />

          {/* Embedding batch size */}
          <SettingItem
            type="slider"
            title={localeService.getTranslation("qaSettings.embeddingBatchSize.title")}
            description={localeService.getTranslation("qaSettings.embeddingBatchSize.description")}
            min={1}
            max={128}
            step={1}
            value={settings.embeddingBatchSize}
            onChange={(value) => updateSetting("embeddingBatchSize", value)}
          />

          {/* Number of Partitions */}
          <SettingItem
            type="select"
            title={localeService.getTranslation("qaSettings.numPartitions.title")}
            description={localeService.getTranslation("qaSettings.numPartitions.description")}
            value={settings.numPartitions.toString()}
            onChange={handlePartitionsChange}
            options={[
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "12",
              "16",
              "20",
              "24",
              "28",
              "32",
              "36",
              "40",
            ].map((it) => ({
              label: it,
              value: it,
            }))}
          />

          {/* Exclusions */}
          <SettingItem
            type="custom"
            title={localeService.getTranslation("qaSettings.exclusions.title")}
            description={
              <>
                <p>{localeService.getTranslation("qaSettings.exclusions.description")}</p>
              </>
            }
          >
            <Button
              variant="secondary"
              onClick={() =>
                new PatternMatchingModal(
                  app,
                  (value) => updateSetting("qaExclusions", value),
                  settings.qaExclusions,
                  localeService.getTranslation("qaSettings.exclusions.manageTitle")
                ).open()
              }
            >
              {localeService.getTranslation("qaSettings.manage")}
            </Button>
          </SettingItem>

          {/* Inclusions */}
          <SettingItem
            type="custom"
            title={localeService.getTranslation("qaSettings.inclusions.title")}
            description={<p>{localeService.getTranslation("qaSettings.inclusions.description")}</p>}
          >
            <Button
              variant="secondary"
              onClick={() =>
                new PatternMatchingModal(
                  app,
                  (value) => updateSetting("qaInclusions", value),
                  settings.qaInclusions,
                  localeService.getTranslation("qaSettings.inclusions.manageTitle")
                ).open()
              }
            >
              {localeService.getTranslation("qaSettings.manage")}
            </Button>
          </SettingItem>

          {/* Enable Obsidian Sync */}
          <SettingItem
            type="switch"
            title={localeService.getTranslation("qaSettings.enableIndexSync.title")}
            description={localeService.getTranslation("qaSettings.enableIndexSync.description")}
            checked={settings.enableIndexSync}
            onCheckedChange={(checked) => updateSetting("enableIndexSync", checked)}
          />

          {/* Disable index loading on mobile */}
          <SettingItem
            type="switch"
            title={localeService.getTranslation("qaSettings.disableIndexOnMobile.title")}
            description={localeService.getTranslation(
              "qaSettings.disableIndexOnMobile.description"
            )}
            checked={settings.disableIndexOnMobile}
            onCheckedChange={(checked) => updateSetting("disableIndexOnMobile", checked)}
          />
        </div>
      </section>
    </div>
  );
};
