import { useChainType } from "@/aiParams";
import { ChainType } from "@/chainFactory";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { VAULT_VECTOR_STORE_STRATEGY } from "@/constants";
import LocaleService from "@/i18n/LocaleService";
import { useSettingsValue } from "@/settings/model";
import { PlusCircle, TriangleAlert } from "lucide-react";
import React, { useMemo, useState, useEffect } from "react";
import { LOCALE_CHANGE_EVENT } from "@/i18n/components/LanguageSelector";
import { Locale, DEFAULT_LOCALE } from "@/i18n/config";

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

// 单例localeService，但我们需要确保组件在语言变化时重新渲染
const getLocaleService = () => {
  const service = LocaleService.getInstance();
  return service;
};

function getRandomPrompt(chainType: ChainType = ChainType.LLM_CHAIN) {
  const SUGGESTED_PROMPTS = getSuggestedPrompts();
  const keys = PROMPT_KEYS[chainType] || PROMPT_KEYS[ChainType.LLM_CHAIN];

  // For repeated keys, shuffle once and take multiple items
  const shuffledPrompts: Record<string, string[]> = {};

  return keys.map((key) => {
    if (!shuffledPrompts[key]) {
      shuffledPrompts[key] = [...SUGGESTED_PROMPTS[key].prompts].sort(() => Math.random() - 0.5);
    }

    const promptKey = shuffledPrompts[key].pop() || SUGGESTED_PROMPTS[key].prompts[0];
    return {
      titleKey: SUGGESTED_PROMPTS[key].titleKey,
      textKey: promptKey,
    };
  });
}

interface SuggestedPromptsProps {
  onClick: (text: string) => void;
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onClick }) => {
  const [chainType] = useChainType();
  const [currentLocale, setCurrentLocale] = useState<Locale>(() => {
    try {
      const storedLocale = localStorage.getItem("obsidian-copilot-locale");
      return storedLocale && (storedLocale === "en" || storedLocale === "zh-CN")
        ? (storedLocale as Locale)
        : DEFAULT_LOCALE;
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return DEFAULT_LOCALE;
    }
  });

  // 监听语言变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "obsidian-copilot-locale" && e.newValue) {
        if (e.newValue === "en" || e.newValue === "zh-CN") {
          setCurrentLocale(e.newValue as Locale);
        }
      }
    };

    const handleLocaleChange = (e: CustomEvent<{ locale: Locale }>) => {
      setCurrentLocale(e.detail.locale);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(LOCALE_CHANGE_EVENT as any, handleLocaleChange as any);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(LOCALE_CHANGE_EVENT as any, handleLocaleChange as any);
    };
  }, []);

  // 每次语言变化时创建新的localeService实例
  const localeService = useMemo(() => {
    const service = getLocaleService();
    service.setLocale(currentLocale);
    return service;
  }, [currentLocale]);

  const prompts = useMemo(() => getRandomPrompt(chainType), [chainType]); // 移除 currentLocale 依赖

  const settings = useSettingsValue();
  const indexVaultToVectorStore = settings.indexVaultToVectorStore as VAULT_VECTOR_STORE_STRATEGY;

  return (
    <div className="flex flex-col gap-4">
      <Card className="w-full bg-transparent">
        <CardHeader className="px-2">
          <CardTitle>{localeService.getTranslation("suggestedPrompts.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <div className="flex flex-col gap-2">
            {prompts.map((prompt, i) => (
              <div
                key={i}
                className="flex gap-2 p-2 justify-between text-sm rounded-md border border-border border-solid"
              >
                <div className="flex flex-col gap-1">
                  <div className="text-muted">{localeService.getTranslation(prompt.titleKey)}</div>
                  <div>{localeService.getTranslation(prompt.textKey)}</div>
                </div>
                <div className="flex items-start h-full">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost2"
                        size="fit"
                        className="text-muted"
                        onClick={() => onClick(localeService.getTranslation(prompt.textKey))}
                      >
                        <PlusCircle className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {localeService.getTranslation("suggestedPrompts.addToChat")}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {chainType === ChainType.VAULT_QA_CHAIN && (
        <div className="text-sm border border-border border-solid p-2 rounded-md">
          {localeService.getTranslation("suggestedPrompts.qaInstructions")}
        </div>
      )}
      {chainType === ChainType.VAULT_QA_CHAIN &&
        indexVaultToVectorStore === VAULT_VECTOR_STORE_STRATEGY.NEVER && (
          <div className="text-sm border border-border border-solid p-2 rounded-md">
            <div>
              <TriangleAlert className="size-4" />{" "}
              {localeService.getTranslation("suggestedPrompts.indexWarningPrefix")}{" "}
              <b>{localeService.getTranslation("vectorStoreStrategy.never")}</b>.
              {localeService.getTranslation("suggestedPrompts.indexWarningInstructions")}{" "}
              <span className="text-accent">
                {localeService.getTranslation("suggestedPrompts.refreshIndex")}
              </span>{" "}
              {localeService.getTranslation("suggestedPrompts.indexWarningOr")}
              <span className="text-accent">
                {localeService.getTranslation("suggestedPrompts.indexCommand")}
              </span>{" "}
              {localeService.getTranslation("suggestedPrompts.indexWarningToUpdate")}
            </div>
          </div>
        )}
    </div>
  );
};
