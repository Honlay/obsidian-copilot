import { ResetSettingsConfirmModal } from "@/components/modals/ResetSettingsConfirmModal";
import { Button } from "@/components/ui/button";
import { TabContent, TabItem, type TabItem as TabItemType } from "@/components/ui/setting-tabs";
import { TabProvider, useTab } from "@/contexts/TabContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { LOCALE_CHANGE_EVENT } from "@/i18n/components/LanguageSelector";
import CopilotPlugin from "@/main";
import { resetSettings } from "@/settings/model";
import { CommandSettings } from "@/settings/v2/components/CommandSettings";
import { checkLatestVersion, isNewerVersion } from "@/utils";
import { Cog, Command, Cpu, Database, Wrench } from "lucide-react";
import React, { useEffect, useState } from "react";
import { AdvancedSettings } from "./components/AdvancedSettings";
import { BasicSettings } from "./components/BasicSettings";
import { ModelSettings } from "./components/ModelSettings";
import { QASettings } from "./components/QASettings";

const TAB_IDS = ["basic", "model", "QA", "command", "advanced"] as const;
type TabId = (typeof TAB_IDS)[number];

// tab icons
const icons: Record<TabId, JSX.Element> = {
  basic: <Cog className="w-5 h-5" />,
  model: <Cpu className="w-5 h-5" />,
  QA: <Database className="w-5 h-5" />,
  command: <Command className="w-5 h-5" />,
  advanced: <Wrench className="w-5 h-5" />,
};

// tab components
const components: Record<TabId, React.FC> = {
  basic: () => <BasicSettings />,
  model: () => <ModelSettings />,
  QA: () => <QASettings />,
  command: () => <CommandSettings />,
  advanced: () => <AdvancedSettings />,
};

const SettingsContent: React.FC<{ plugin: CopilotPlugin; forceRenderKey: number }> = ({
  plugin,
  forceRenderKey,
}) => {
  const { selectedTab, setSelectedTab } = useTab();
  const { t } = useTranslation();

  // 更新tabs数据以使用翻译
  const translatedTabs: TabItemType[] = TAB_IDS.map((id) => ({
    id,
    icon: icons[id],
    label: t(`settings.tabs.${id}`),
  }));

  return (
    <div className="flex flex-col">
      <div className="inline-flex rounded-lg">
        {translatedTabs.map((tab, index) => (
          <TabItem
            key={`${tab.id}-${forceRenderKey}`}
            tab={tab}
            isSelected={selectedTab === tab.id}
            onClick={() => setSelectedTab(tab.id)}
            isFirst={index === 0}
            isLast={index === translatedTabs.length - 1}
          />
        ))}
      </div>
      <div className="w-[100%] border border-solid" />

      <div>
        {TAB_IDS.map((id) => {
          const Component = components[id];
          return (
            <TabContent key={`${id}-${forceRenderKey}`} id={id} isSelected={selectedTab === id}>
              <Component />
            </TabContent>
          );
        })}
      </div>
    </div>
  );
};

interface SettingsMainV2Props {
  plugin: CopilotPlugin;
}

const SettingsMainV2: React.FC<SettingsMainV2Props> = ({ plugin }) => {
  // Add a key state that we'll change when resetting or changing language
  const [resetKey, setResetKey] = React.useState(0);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const { t } = useTranslation();

  // 添加对语言变化事件的监听
  useEffect(() => {
    const handleLocaleChange = () => {
      // 强制重新渲染整个设置界面
      setResetKey((prev) => prev + 1);
    };

    window.addEventListener(LOCALE_CHANGE_EVENT as any, handleLocaleChange);

    return () => {
      window.removeEventListener(LOCALE_CHANGE_EVENT as any, handleLocaleChange);
    };
  }, []);

  useEffect(() => {
    // Check version when settings tab is opened
    const checkForUpdates = async () => {
      const { version, error } = await checkLatestVersion();
      if (error) {
        console.error("Version check failed:", error);
        setUpdateError(error);
      } else if (version) {
        setLatestVersion(version);
        setUpdateError(null);
      }
    };

    checkForUpdates();
  }, [plugin.manifest.version]); // Only re-run if plugin version changes

  const handleReset = async () => {
    const modal = new ResetSettingsConfirmModal(app, async () => {
      resetSettings();
      // Increment the key to force re-render of all components
      setResetKey((prev) => prev + 1);
    });
    modal.open();
  };

  const isNewerVersionAvailable =
    latestVersion && isNewerVersion(latestVersion, plugin.manifest.version);

  return (
    <TabProvider>
      <div key={`settings-main-${resetKey}`}>
        <div className="flex flex-col gap-2">
          <h1 className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <span>{t("settings.copilotSettings")}</span>
              <span className="text-xs text-muted">
                <a
                  href="https://github.com/logancyang/obsidian-copilot/releases/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  v{plugin.manifest.version}
                </a>
                {updateError ? (
                  <span className="text-error" title={updateError}>
                    {" "}
                    ({t("settings.updateCheckFailed")})
                  </span>
                ) : (
                  latestVersion && (
                    <>
                      {isNewerVersionAvailable ? (
                        <span className="text-accent" title={t("settings.newVersionAvailable")}>
                          {" "}
                          (latest: v{latestVersion})
                        </span>
                      ) : (
                        <span className="text-accent"> ({t("settings.upToDate")})</span>
                      )}
                    </>
                  )
                )}
              </span>
            </div>
            <div className="self-end sm:self-auto">
              <Button variant="secondary" size="sm" onClick={handleReset}>
                {t("settings.resetSettings")}
              </Button>
            </div>
          </h1>
        </div>
        {/* Add the key prop to force re-render */}
        <SettingsContent key={resetKey} forceRenderKey={resetKey} plugin={plugin} />
      </div>
    </TabProvider>
  );
};

export default SettingsMainV2;
