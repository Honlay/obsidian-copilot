import { ChainType } from "@/chainFactory";
import { RebuildIndexConfirmModal } from "@/components/modals/RebuildIndexConfirmModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingItem } from "@/components/ui/setting-item";
import { DEFAULT_OPEN_AREA } from "@/constants";
import { useTab } from "@/contexts/TabContext";
import { LanguageSelector } from "@/i18n";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { getModelKeyFromModel, updateSetting, useSettingsValue } from "@/settings/model";
import { formatDateTime, checkModelApiKey } from "@/utils";
import { HelpCircle, Key, Loader2 } from "lucide-react";
import { Notice } from "obsidian";
import React, { useState } from "react";
import ApiKeyDialog from "./ApiKeyDialog";
import { PlusSettings } from "@/settings/v2/components/PlusSettings";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getModelDisplayWithIcons } from "@/components/ui/model-display";
import VectorStoreManager from "@/search/vectorStoreManager";

const ChainType2Label: Record<ChainType, string> = {
  [ChainType.LLM_CHAIN]: "Chat",
  [ChainType.VAULT_QA_CHAIN]: "Vault QA (Basic)",
  [ChainType.COPILOT_PLUS_CHAIN]: "Copilot Plus (beta)",
};

export const BasicSettings: React.FC = () => {
  const { modalContainer } = useTab();
  const settings = useSettingsValue();
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [conversationNoteName, setConversationNoteName] = useState(
    settings.defaultConversationNoteName || "{$date}_{$time}__{$topic}"
  );
  const { t } = useTranslation();

  const handleSetDefaultEmbeddingModel = async (modelKey: string) => {
    if (modelKey !== settings.embeddingModelKey) {
      new RebuildIndexConfirmModal(app, async () => {
        updateSetting("embeddingModelKey", modelKey);
        await VectorStoreManager.getInstance().indexVaultToVectorStore(true);
      }).open();
    }
  };

  const applyCustomNoteFormat = () => {
    setIsChecking(true);

    try {
      // Check required variables
      const format = conversationNoteName || "{$date}_{$time}__{$topic}";
      const requiredVars = ["{$date}", "{$time}", "{$topic}"];
      const missingVars = requiredVars.filter((v) => !format.includes(v));

      if (missingVars.length > 0) {
        new Notice(`Error: Missing required variables: ${missingVars.join(", ")}`, 4000);
        return;
      }

      // Check illegal characters (excluding variable placeholders)
      const illegalChars = /[\\/:*?"<>|]/;
      const formatWithoutVars = format
        .replace(/\{\$date}/g, "")
        .replace(/\{\$time}/g, "")
        .replace(/\{\$topic}/g, "");

      if (illegalChars.test(formatWithoutVars)) {
        new Notice(`Error: Format contains illegal characters (\\/:*?"<>|)`, 4000);
        return;
      }

      // Generate example filename
      const { fileName: timestampFileName } = formatDateTime(new Date());
      const firstTenWords = "test topic name";

      // Create example filename
      const customFileName = format
        .replace("{$topic}", firstTenWords.slice(0, 100).replace(/\s+/g, "_"))
        .replace("{$date}", timestampFileName.split("_")[0])
        .replace("{$time}", timestampFileName.split("_")[1]);

      // Save settings
      updateSetting("defaultConversationNoteName", format);
      setConversationNoteName(format);
      new Notice(`Format applied successfully! Example: ${customFileName}`, 4000);
    } catch (error) {
      new Notice(`Error applying format: ${error.message}`, 4000);
    } finally {
      setIsChecking(false);
    }
  };

  const defaultModelActivated = !!settings.activeModels.find(
    (m) => m.enabled && getModelKeyFromModel(m) === settings.defaultModelKey
  );
  const enableActivatedModels = settings.activeModels
    .filter((m) => m.enabled)
    .map((model) => ({
      label: getModelDisplayWithIcons(model),
      value: getModelKeyFromModel(model),
    }));

  return (
    <div className="space-y-4">
      <PlusSettings />

      {/* General Section */}
      <section>
        <div className="text-xl font-bold mb-3">{t("settings.title")}</div>
        <div className="space-y-4">
          {/* Language Selector */}
          <SettingItem
            type="custom"
            title={t("settings.language")}
            description={t("settings.language")}
          >
            <LanguageSelector className="w-full sm:w-auto" />
          </SettingItem>

          <div className="space-y-4">
            {/* API Key Section */}
            <SettingItem
              type="custom"
              title={t("modelSettings.apiKeys")}
              description={
                <div className="flex items-center gap-1.5">
                  <span className="leading-none">{t("settings.apiKeyRequired")}</span>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="size-4" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-96 flex flex-col gap-2 py-4">
                        <div className="text-sm font-medium text-accent">
                          {t("settings.apiKeyRequired")}
                        </div>
                        <div className="text-xs text-muted">{t("settings.apiKeyDescription")}</div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              }
            >
              <Button
                onClick={() => setIsApiKeyDialogOpen(true)}
                variant="secondary"
                className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
              >
                {t("settings.setKeys")}
                <Key className="h-4 w-4" />
              </Button>
            </SettingItem>

            {/* API Key Dialog */}
            <ApiKeyDialog
              open={isApiKeyDialogOpen}
              onOpenChange={setIsApiKeyDialogOpen}
              settings={settings}
              updateSetting={updateSetting}
              modalContainer={modalContainer}
            />
          </div>
          <SettingItem
            type="select"
            title={t("settings.defaultChatModel")}
            description={t("settings.selectChatModel")}
            value={defaultModelActivated ? settings.defaultModelKey : t("settings.selectModel")}
            onChange={(value) => {
              const selectedModel = settings.activeModels.find(
                (m) => m.enabled && getModelKeyFromModel(m) === value
              );
              if (!selectedModel) return;

              const { hasApiKey, errorNotice } = checkModelApiKey(selectedModel, settings);
              if (!hasApiKey && errorNotice) {
                new Notice(errorNotice);
                return;
              }
              updateSetting("defaultModelKey", value);
            }}
            options={
              defaultModelActivated
                ? enableActivatedModels
                : [
                    { label: t("settings.selectModel"), value: t("settings.selectModel") },
                    ...enableActivatedModels,
                  ]
            }
            placeholder={t("settings.selectModel")}
          />

          <SettingItem
            type="select"
            title={t("settings.embeddingModel")}
            description={
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="leading-none font-medium text-accent">
                    {t("settings.coreFeature")}
                  </span>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="size-4" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-96 flex flex-col gap-2">
                        <div className="text-sm text-muted pt-2">
                          {t("settings.embeddingDescription")}
                        </div>
                        <ul className="text-sm text-muted pl-4">
                          <li>{t("settings.rebuildIndex")}</li>
                          <li>{t("settings.affectSearch")}</li>
                          <li>{t("settings.impactQA")}</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            }
            value={settings.embeddingModelKey}
            onChange={handleSetDefaultEmbeddingModel}
            options={settings.activeEmbeddingModels.map((model) => ({
              label: getModelDisplayWithIcons(model),
              value: getModelKeyFromModel(model),
            }))}
            placeholder={t("settings.selectModel")}
          />

          {/* Basic Configuration Group */}
          <SettingItem
            type="select"
            title={t("settings.defaultMode")}
            description={
              <div className="flex items-center gap-1.5">
                <span className="leading-none">{t("settings.selectDefaultMode")}</span>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-96 flex flex-col gap-2">
                      <ul className="text-sm text-muted pl-4">
                        <li>
                          <strong>Chat:</strong> {t("settings.chatModeDescription.chat")}
                        </li>
                        <li>
                          <strong>Vault QA (Basic):</strong>{" "}
                          {t("settings.chatModeDescription.vaultQA")}
                        </li>
                        <li>
                          <strong>Copilot Plus:</strong>{" "}
                          {t("settings.chatModeDescription.copilotPlus")}
                        </li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            }
            value={settings.defaultChainType}
            onChange={(value) => updateSetting("defaultChainType", value as ChainType)}
            options={Object.entries(ChainType2Label).map(([key, value]) => ({
              label: value,
              value: key,
            }))}
          />

          <SettingItem
            type="select"
            title={t("settings.openPluginIn")}
            description={t("settings.chooseOpenLocation")}
            value={settings.defaultOpenArea}
            onChange={(value) => updateSetting("defaultOpenArea", value as DEFAULT_OPEN_AREA)}
            options={[
              { label: t("settings.sidebarView"), value: DEFAULT_OPEN_AREA.VIEW },
              { label: t("settings.editor"), value: DEFAULT_OPEN_AREA.EDITOR },
            ]}
          />

          <SettingItem
            type="text"
            title={t("settings.defaultConversationFolder")}
            description={t("settings.defaultConversationFolderDesc")}
            value={settings.defaultSaveFolder}
            onChange={(value) => updateSetting("defaultSaveFolder", value)}
            placeholder="copilot-conversations"
          />

          <SettingItem
            type="text"
            title={t("settings.customPromptsFolder")}
            description={t("settings.customPromptsFolderDesc")}
            value={settings.customPromptsFolder}
            onChange={(value) => updateSetting("customPromptsFolder", value)}
            placeholder="copilot-custom-prompts"
          />

          <SettingItem
            type="text"
            title={t("settings.defaultConversationTag")}
            description={t("settings.defaultConversationTagDesc")}
            value={settings.defaultConversationTag}
            onChange={(value) => updateSetting("defaultConversationTag", value)}
            placeholder="ai-conversations"
          />

          <SettingItem
            type="custom"
            title={t("settings.conversationFilenameTemplate")}
            description={
              <div className="flex items-start gap-1.5 ">
                <span className="leading-none">{t("settings.customizeFormat")}</span>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-96 flex flex-col gap-2 py-4">
                      <div className="text-sm font-medium text-accent">
                        {t("settings.templateNote")}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted">
                          {t("settings.availableVariables")}
                        </div>
                        <ul className="text-sm text-muted pl-4">
                          <li>
                            <strong>{"{$date}"}</strong>: {t("settings.dateVariable")}
                          </li>
                          <li>
                            <strong>{"{$time}"}</strong>: {t("settings.timeVariable")}
                          </li>
                          <li>
                            <strong>{"{$topic}"}</strong>: {t("settings.topicVariable")}
                          </li>
                        </ul>
                        <i className="text-sm text-muted mt-2">{t("settings.templateExample")}</i>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            }
          >
            <div className="flex items-center gap-1.5 w-[320px]">
              <Input
                type="text"
                className={`transition-all duration-200 flex-grow min-w-[80px] ${isChecking ? "w-[80px]" : "w-[120px]"}`}
                placeholder="{$date}_{$time}__{$topic}"
                value={conversationNoteName}
                onChange={(e) => setConversationNoteName(e.target.value)}
                disabled={isChecking}
              />

              <Button
                onClick={() => applyCustomNoteFormat()}
                disabled={isChecking}
                variant="secondary"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.apply")}
                  </>
                ) : (
                  t("common.apply")
                )}
              </Button>
            </div>
          </SettingItem>

          {/* Feature Toggle Group */}
          <SettingItem
            type="switch"
            title={t("settings.autosaveChat")}
            description={t("settings.autosaveChatDesc")}
            checked={settings.autosaveChat}
            onCheckedChange={(checked) => updateSetting("autosaveChat", checked)}
          />

          <SettingItem
            type="switch"
            title={t("settings.suggestedPrompts")}
            description={t("settings.suggestedPromptsDesc")}
            checked={settings.showSuggestedPrompts}
            onCheckedChange={(checked) => updateSetting("showSuggestedPrompts", checked)}
          />

          <SettingItem
            type="switch"
            title={t("settings.relevantNotes")}
            description={t("settings.relevantNotesDesc")}
            checked={settings.showRelevantNotes}
            onCheckedChange={(checked) => updateSetting("showRelevantNotes", checked)}
          />
        </div>
      </section>
    </div>
  );
};
