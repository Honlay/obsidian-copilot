import { PatternMatchingModal } from "@/components/modals/PatternMatchingModal";
import { RebuildIndexConfirmModal } from "@/components/modals/RebuildIndexConfirmModal";
import { Button } from "@/components/ui/button";
import { SettingItem } from "@/components/ui/setting-item";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { VAULT_VECTOR_STORE_STRATEGIES } from "@/constants";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import VectorStoreManager from "@/search/vectorStoreManager";
import { updateSetting, useSettingsValue } from "@/settings/model";
import { HelpCircle } from "lucide-react";
import React from "react";

export const QASettings: React.FC = () => {
  const settings = useSettingsValue();
  const { t } = useTranslation();

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
            title={t("qaSettings.autoIndexStrategy.title")}
            description={
              <div className="flex items-center gap-1.5">
                <span className="leading-none">
                  {t("qaSettings.autoIndexStrategy.description")}
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
                            {t("qaSettings.autoIndexStrategy.tooltipHeading")}
                          </div>
                          <ul className="space-y-1 pl-2 list-disc text-sm">
                            <li>
                              <div className="flex items-center gap-1">
                                <strong className="inline-block whitespace-nowrap">
                                  {t("qaSettings.autoIndexStrategy.never.title")}:
                                </strong>
                                <span>{t("qaSettings.autoIndexStrategy.never.description")}</span>
                              </div>
                            </li>
                            <li>
                              <div className="flex items-center gap-1">
                                <strong className="inline-block whitespace-nowrap">
                                  {t("qaSettings.autoIndexStrategy.onStartup.title")}:
                                </strong>
                                <span>
                                  {t("qaSettings.autoIndexStrategy.onStartup.description")}
                                </span>
                              </div>
                            </li>
                            <li>
                              <div className="flex items-center gap-1">
                                <strong className="inline-block whitespace-nowrap">
                                  {t("qaSettings.autoIndexStrategy.onModeSwitch.title")}:
                                </strong>
                                <span>
                                  {t("qaSettings.autoIndexStrategy.onModeSwitch.description")}
                                </span>
                              </div>
                            </li>
                          </ul>
                        </div>
                        <p className="text-callout-warning text-sm">
                          {t("qaSettings.autoIndexStrategy.warning")}
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
            options={VAULT_VECTOR_STORE_STRATEGIES.map((strategy) => ({
              label: strategy,
              value: strategy,
            }))}
            placeholder={t("qaSettings.strategy")}
          />

          {/* Max Sources */}
          <SettingItem
            type="slider"
            title={t("qaSettings.maxSources.title")}
            description={t("qaSettings.maxSources.description")}
            min={1}
            max={128}
            step={1}
            value={settings.maxSourceChunks}
            onChange={(value) => updateSetting("maxSourceChunks", value)}
          />

          {/* Requests per Minute */}
          <SettingItem
            type="slider"
            title={t("qaSettings.requestsPerMinute.title")}
            description={t("qaSettings.requestsPerMinute.description")}
            min={10}
            max={300}
            step={10}
            value={settings.embeddingRequestsPerMin}
            onChange={(value) => updateSetting("embeddingRequestsPerMin", value)}
          />

          {/* Embedding batch size */}
          <SettingItem
            type="slider"
            title={t("qaSettings.embeddingBatchSize.title")}
            description={t("qaSettings.embeddingBatchSize.description")}
            min={1}
            max={128}
            step={1}
            value={settings.embeddingBatchSize}
            onChange={(value) => updateSetting("embeddingBatchSize", value)}
          />

          {/* Number of Partitions */}
          <SettingItem
            type="select"
            title={t("qaSettings.numPartitions.title")}
            description={t("qaSettings.numPartitions.description")}
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
            title={t("qaSettings.exclusions.title")}
            description={
              <>
                <p>{t("qaSettings.exclusions.description")}</p>
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
                  t("qaSettings.exclusions.manageTitle")
                ).open()
              }
            >
              {t("qaSettings.manage")}
            </Button>
          </SettingItem>

          {/* Inclusions */}
          <SettingItem
            type="custom"
            title={t("qaSettings.inclusions.title")}
            description={<p>{t("qaSettings.inclusions.description")}</p>}
          >
            <Button
              variant="secondary"
              onClick={() =>
                new PatternMatchingModal(
                  app,
                  (value) => updateSetting("qaInclusions", value),
                  settings.qaInclusions,
                  t("qaSettings.inclusions.manageTitle")
                ).open()
              }
            >
              {t("qaSettings.manage")}
            </Button>
          </SettingItem>

          {/* Enable Obsidian Sync */}
          <SettingItem
            type="switch"
            title={t("qaSettings.enableIndexSync.title")}
            description={t("qaSettings.enableIndexSync.description")}
            checked={settings.enableIndexSync}
            onCheckedChange={(checked) => updateSetting("enableIndexSync", checked)}
          />

          {/* Disable index loading on mobile */}
          <SettingItem
            type="switch"
            title={t("qaSettings.disableIndexOnMobile.title")}
            description={t("qaSettings.disableIndexOnMobile.description")}
            checked={settings.disableIndexOnMobile}
            onCheckedChange={(checked) => updateSetting("disableIndexOnMobile", checked)}
          />
        </div>
      </section>
    </div>
  );
};
