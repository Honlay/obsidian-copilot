import React from "react";
import { SettingItem } from "@/components/ui/setting-item";
import { updateSetting, useSettingsValue } from "@/settings/model";
import { useTranslation } from "@/i18n/hooks/useTranslation";

export const AdvancedSettings: React.FC = () => {
  const settings = useSettingsValue();
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Privacy Settings Section */}
      <section>
        <SettingItem
          type="textarea"
          title={t("advancedSettings.userSystemPrompt.title")}
          description={t("advancedSettings.userSystemPrompt.description")}
          value={settings.userSystemPrompt}
          onChange={(value) => updateSetting("userSystemPrompt", value)}
          placeholder={t("advancedSettings.userSystemPrompt.placeholder")}
        />

        <div className="space-y-4">
          <SettingItem
            type="switch"
            title={t("advancedSettings.enableEncryption.title")}
            description={t("advancedSettings.enableEncryption.description")}
            checked={settings.enableEncryption}
            onCheckedChange={(checked) => {
              updateSetting("enableEncryption", checked);
            }}
          />

          <SettingItem
            type="switch"
            title={t("advancedSettings.debugMode.title")}
            description={t("advancedSettings.debugMode.description")}
            checked={settings.debug}
            onCheckedChange={(checked) => {
              updateSetting("debug", checked);
            }}
          />
        </div>
      </section>
    </div>
  );
};
