import { useChainType } from "@/aiParams";
import { ChainType } from "@/chainFactory";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { VAULT_VECTOR_STORE_STRATEGY } from "@/constants";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useSettingsValue } from "@/settings/model";
import { PlusCircle, TriangleAlert } from "lucide-react";
import React, { useMemo } from "react";

export type PromptCategory = {
  titleKey: string;
  prompts: string[];
};

export type SuggestedPrompts = {
  [key: string]: PromptCategory;
};

const getSuggestedPrompts = (): SuggestedPrompts => {
  return {
    activeNote: {
      titleKey: "suggestedPrompts.categories.activeNote",
      prompts: [
        "suggestedPrompts.prompts.activeNote.followUpQuestions",
        "suggestedPrompts.prompts.activeNote.keyQuestions",
        "suggestedPrompts.prompts.activeNote.quickRecap",
      ],
    },
    quoteNote: {
      titleKey: "suggestedPrompts.categories.noteLink",
      prompts: [
        "suggestedPrompts.prompts.noteLink.improvements",
        "suggestedPrompts.prompts.noteLink.keyPoints",
        "suggestedPrompts.prompts.noteLink.recentUpdates",
        "suggestedPrompts.prompts.noteLink.writingFeedback",
      ],
    },
    fun: {
      titleKey: "suggestedPrompts.categories.testLLM",
      prompts: [
        "suggestedPrompts.prompts.testLLM.comparison",
        "suggestedPrompts.prompts.testLLM.longestRiver",
        "suggestedPrompts.prompts.testLLM.physics",
      ],
    },
    qaVault: {
      titleKey: "suggestedPrompts.categories.vaultQA",
      prompts: [
        "suggestedPrompts.prompts.vaultQA.insights",
        "suggestedPrompts.prompts.vaultQA.explain",
        "suggestedPrompts.prompts.vaultQA.highlight",
        "suggestedPrompts.prompts.vaultQA.missingQuestions",
      ],
    },
    copilotPlus: {
      titleKey: "suggestedPrompts.categories.copilotPlus",
      prompts: [
        "suggestedPrompts.prompts.copilotPlus.weeklyRecap",
        "suggestedPrompts.prompts.copilotPlus.topicTakeaways",
        "suggestedPrompts.prompts.copilotPlus.urlSummary",
        "suggestedPrompts.prompts.copilotPlus.youtube",
        "suggestedPrompts.prompts.copilotPlus.webSearch",
        "suggestedPrompts.prompts.copilotPlus.paperInsights",
        "suggestedPrompts.prompts.copilotPlus.pdfMethods",
      ],
    },
  };
};

const PROMPT_KEYS: Record<ChainType, Array<keyof ReturnType<typeof getSuggestedPrompts>>> = {
  [ChainType.LLM_CHAIN]: ["activeNote", "quoteNote", "fun"],
  [ChainType.VAULT_QA_CHAIN]: ["qaVault", "qaVault", "quoteNote"],
  [ChainType.COPILOT_PLUS_CHAIN]: ["copilotPlus", "copilotPlus", "copilotPlus"],
};

function getRandomPrompt(chainType: ChainType = ChainType.LLM_CHAIN, t: (key: string) => string) {
  const SUGGESTED_PROMPTS = getSuggestedPrompts();
  const keys = PROMPT_KEYS[chainType] || PROMPT_KEYS[ChainType.LLM_CHAIN];

  // For repeated keys, shuffle once and take multiple items
  const shuffledPrompts: Record<string, string[]> = {};

  return keys.map((key) => {
    if (!shuffledPrompts[key]) {
      shuffledPrompts[key] = [...SUGGESTED_PROMPTS[key].prompts].sort(() => Math.random() - 0.5);
    }
    return {
      title: t(SUGGESTED_PROMPTS[key].titleKey),
      text: shuffledPrompts[key].pop() || SUGGESTED_PROMPTS[key].prompts[0],
    };
  });
}

interface SuggestedPromptsProps {
  onClick: (text: string) => void;
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onClick }) => {
  const { t } = useTranslation();
  const [chainType] = useChainType();
  const prompts = useMemo(() => getRandomPrompt(chainType, t), [chainType, t]);
  const settings = useSettingsValue();
  const indexVaultToVectorStore = settings.indexVaultToVectorStore as VAULT_VECTOR_STORE_STRATEGY;

  return (
    <div className="flex flex-col gap-4">
      <Card className="w-full bg-transparent">
        <CardHeader className="px-2">
          <CardTitle>{t("suggestedPrompts.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <div className="flex flex-col gap-2">
            {prompts.map((prompt, i) => (
              <div
                key={i}
                className="flex gap-2 p-2 justify-between text-sm rounded-md border border-border border-solid"
              >
                <div className="flex flex-col gap-1">
                  <div className="text-muted">{prompt.title}</div>
                  <div>{prompt.text}</div>
                </div>
                <div className="flex items-start h-full">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost2"
                        size="fit"
                        className="text-muted"
                        onClick={() => onClick(prompt.text)}
                      >
                        <PlusCircle className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("suggestedPrompts.addToChat")}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {chainType === ChainType.VAULT_QA_CHAIN && (
        <div className="text-sm border border-border border-solid p-2 rounded-md">
          {t("suggestedPrompts.qaInstructions")}
        </div>
      )}
      {chainType === ChainType.VAULT_QA_CHAIN &&
        indexVaultToVectorStore === VAULT_VECTOR_STORE_STRATEGY.NEVER && (
          <div className="text-sm border border-border border-solid p-2 rounded-md">
            <div>
              <TriangleAlert className="size-4" /> {t("suggestedPrompts.indexWarningPrefix")}{" "}
              <b>{t("vectorStoreStrategy.never")}</b>.
              {t("suggestedPrompts.indexWarningInstructions")}{" "}
              <span className="text-accent">{t("suggestedPrompts.refreshIndex")}</span>{" "}
              {t("suggestedPrompts.indexWarningOr")}
              <span className="text-accent">{t("suggestedPrompts.indexCommand")}</span>{" "}
              {t("suggestedPrompts.indexWarningToUpdate")}
            </div>
          </div>
        )}
    </div>
  );
};
