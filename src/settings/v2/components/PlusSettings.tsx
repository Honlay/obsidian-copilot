import { CopilotPlusWelcomeModal } from "@/components/modals/CopilotPlusWelcomeModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { PLUS_UTM_MEDIUMS } from "@/constants";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { checkIsPlusUser, navigateToPlusPage, useIsPlusUser } from "@/plusUtils";
import { updateSetting, useSettingsValue } from "@/settings/model";
import { ExternalLink, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

export function PlusSettings() {
  const settings = useSettingsValue();
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const isPlusUser = useIsPlusUser();
  const [localLicenseKey, setLocalLicenseKey] = useState(settings.plusLicenseKey);
  const { t } = useTranslation();
  useEffect(() => {
    setLocalLicenseKey(settings.plusLicenseKey);
  }, [settings.plusLicenseKey]);

  return (
    <section className="flex flex-col gap-4 bg-secondary p-4 rounded-lg">
      <div className="text-xl font-bold flex items-center gap-2 justify-between">
        <span>{t("copilotPlus.title")}</span>
        {isPlusUser && (
          <Badge variant="outline" className="text-success">
            Active
          </Badge>
        )}
      </div>
      <div className="text-sm text-muted flex flex-col gap-2">
        <div>{t("copilotPlus.description")}</div>
        <div>{t("copilotPlus.betaNotice")}</div>
      </div>
      <div className="flex items-center gap-2">
        <PasswordInput
          className="w-full"
          placeholder={t("copilotPlus.enterLicense")}
          value={localLicenseKey}
          onChange={(value) => {
            setLocalLicenseKey(value);
          }}
        />
        <Button
          disabled={isChecking}
          onClick={async () => {
            updateSetting("plusLicenseKey", localLicenseKey);
            setIsChecking(true);
            const result = await checkIsPlusUser();
            setIsChecking(false);
            if (!result) {
              setError("Invalid license key");
            } else {
              setError(null);
              new CopilotPlusWelcomeModal(app).open();
            }
          }}
          className="min-w-20"
        >
          {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.apply")}
        </Button>
        <Button variant="secondary" onClick={() => navigateToPlusPage(PLUS_UTM_MEDIUMS.SETTINGS)}>
          {t("copilotPlus.joinNow")} <ExternalLink className="size-4" />
        </Button>
      </div>
      <div className="text-error">{error}</div>
    </section>
  );
}
