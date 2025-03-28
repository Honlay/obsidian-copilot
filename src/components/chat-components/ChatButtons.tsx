import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { USER_SENDER } from "@/constants";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/sharedState";
import {
  Check,
  Copy,
  LibraryBig,
  PenSquare,
  RotateCw,
  TextCursorInput,
  Trash2,
} from "lucide-react";
import { Platform } from "obsidian";
import React from "react";
import { useTranslation } from "@/i18n/hooks/useTranslation";

interface ChatButtonsProps {
  message: ChatMessage;
  onCopy: () => void;
  isCopied: boolean;
  onInsertIntoEditor?: () => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  onShowSources?: () => void;
  hasSources: boolean;
}

export const ChatButtons: React.FC<ChatButtonsProps> = ({
  message,
  onCopy,
  isCopied,
  onInsertIntoEditor,
  onRegenerate,
  onEdit,
  onDelete,
  onShowSources,
  hasSources,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={cn("flex", {
        "group-hover:opacity-100 opacity-0": !Platform.isMobile,
      })}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost2" size="fit" onClick={onCopy} title={t("chatButtons.copy")}>
            {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("chatButtons.copy")}</TooltipContent>
      </Tooltip>
      {message.sender === USER_SENDER ? (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onEdit} variant="ghost2" size="fit" title={t("chatButtons.edit")}>
                <PenSquare className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("chatButtons.edit")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onDelete}
                variant="ghost2"
                size="fit"
                title={t("chatButtons.delete")}
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("chatButtons.delete")}</TooltipContent>
          </Tooltip>
        </>
      ) : (
        <>
          {hasSources && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onShowSources}
                  variant="ghost2"
                  size="fit"
                  title={t("chatButtons.showSources")}
                >
                  <LibraryBig className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("chatButtons.showSources")}</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onInsertIntoEditor}
                variant="ghost2"
                size="fit"
                title={t("chatButtons.insertAtCursor")}
              >
                <TextCursorInput className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("chatButtons.insertAtCursor")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onRegenerate}
                variant="ghost2"
                size="fit"
                title={t("chatButtons.regenerate")}
              >
                <RotateCw className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("chatButtons.regenerate")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onDelete}
                variant="ghost2"
                size="fit"
                title={t("chatButtons.delete")}
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("chatButtons.delete")}</TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
};
