import React from "react";
import {
  Download,
  MoreHorizontal,
  Sparkles,
  FileText,
  RefreshCw,
  MessageCirclePlus,
  ChevronDown,
  SquareArrowOutUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { SettingSwitch } from "@/components/ui/setting-switch";
import { updateSetting, useSettingsValue } from "@/settings/model";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useChainType } from "@/aiParams";
import { ChainType } from "@/chainFactory";
import { Notice } from "obsidian";
import VectorStoreManager from "@/search/vectorStoreManager";
import { navigateToPlusPage, useIsPlusUser } from "@/plusUtils";
import { PLUS_UTM_MEDIUMS } from "@/constants";
import { useTranslation } from "@/i18n/hooks/useTranslation";

export async function refreshVaultIndex() {
  try {
    await VectorStoreManager.getInstance().indexVaultToVectorStore();
    new Notice("Vault index refreshed.");
  } catch (error) {
    console.error("Error refreshing vault index:", error);
    new Notice("Failed to refresh vault index. Check console for details.");
  }
}

interface ChatControlsProps {
  onNewChat: () => void;
  onSaveAsNote: () => void;
}

export function ChatControls({ onNewChat, onSaveAsNote }: ChatControlsProps) {
  const settings = useSettingsValue();
  const [selectedChain, setSelectedChain] = useChainType();
  const isPlusUser = useIsPlusUser();
  const { t } = useTranslation();

  return (
    <div className="w-full py-1 flex justify-between items-center px-1">
      <div className="flex-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost2" size="fit" className="ml-1">
              {selectedChain === ChainType.LLM_CHAIN && t("chat.mode.chat")}
              {selectedChain === ChainType.VAULT_QA_CHAIN && t("chat.mode.vault")}
              {selectedChain === ChainType.COPILOT_PLUS_CHAIN && (
                <div className="flex items-center gap-1">
                  <Sparkles className="size-4" />
                  copilot plus (beta)
                </div>
              )}
              <ChevronDown className="size-5 mt-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => setSelectedChain(ChainType.LLM_CHAIN)}>
              {t("chat.mode.chat")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSelectedChain(ChainType.VAULT_QA_CHAIN)}>
              {t("chat.mode.vault")}
            </DropdownMenuItem>
            {isPlusUser ? (
              <DropdownMenuItem onSelect={() => setSelectedChain(ChainType.COPILOT_PLUS_CHAIN)}>
                <div className="flex items-center gap-1">
                  <Sparkles className="size-4" />
                  copilot plus (beta)
                </div>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={() => {
                  navigateToPlusPage(PLUS_UTM_MEDIUMS.CHAT_MODE_SELECT);
                }}
              >
                copilot plus (beta)
                <SquareArrowOutUpRight className="size-3" />
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost2" size="icon" title={t("chat.newChat")} onClick={onNewChat}>
              <MessageCirclePlus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("chat.newChat")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost2" size="icon" title={t("chat.saveChat")} onClick={onSaveAsNote}>
              <Download className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("chat.saveChat")}</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost2" size="icon" title={t("settings.title")}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem
              className="flex justify-between"
              onSelect={(e) => {
                e.preventDefault();
                updateSetting("showSuggestedPrompts", !settings.showSuggestedPrompts);
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="size-4" />
                {t("settings.suggestedPrompts")}
              </div>
              <SettingSwitch checked={settings.showSuggestedPrompts} />
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex justify-between"
              onSelect={(e) => {
                e.preventDefault();
                updateSetting("showRelevantNotes", !settings.showRelevantNotes);
              }}
            >
              <div className="flex items-center gap-2">
                <FileText className="size-4" />
                {t("settings.relevantNotes")}
              </div>
              <SettingSwitch checked={settings.showRelevantNotes} />
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2"
              onSelect={() => refreshVaultIndex()}
            >
              <RefreshCw className="size-4" />
              {t("suggestedPrompts.refreshIndex")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
