import React, { useState, useEffect, useMemo } from "react";
import { useTab } from "@/contexts/TabContext";
import { getSettings } from "@/settings/model";
import {
  ChatModelProviders,
  SettingKeyProviders,
  EmbeddingModelProviders,
  MODEL_CAPABILITIES,
  ModelCapability,
  Provider,
  ProviderMetadata,
  ProviderSettingsKeyMap,
} from "@/constants";
import { CustomModel } from "@/aiParams";
import { err2String, getProviderInfo, getProviderLabel, omit } from "@/utils";
import { Notice } from "obsidian";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, Loader2, HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FormField } from "@/components/ui/form-field";
import LocaleService from "@/i18n/LocaleService";
import { Locale } from "@/i18n/config";
import { LOCALE_CHANGE_EVENT } from "@/i18n/components/LanguageSelector";

interface FormErrors {
  name: boolean;
  instanceName: boolean;
  deploymentName: boolean;
  embeddingDeploymentName: boolean;
  apiVersion: boolean;
  displayName: boolean;
}

interface ModelAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (model: CustomModel) => void;
  ping: (model: CustomModel) => Promise<boolean>;
  isEmbeddingModel?: boolean;
}

export const ModelAddDialog: React.FC<ModelAddDialogProps> = ({
  open,
  onOpenChange,
  onAdd,
  ping,
  isEmbeddingModel = false,
}) => {
  const { modalContainer } = useTab();
  const settings = getSettings();
  const defaultProvider = isEmbeddingModel
    ? EmbeddingModelProviders.OPENAI
    : ChatModelProviders.OPENAI;

  // 添加国际化支持
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

  // 监听语言变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "obsidian-copilot-locale" && e.newValue) {
        if (e.newValue === "en" || e.newValue === "zh-CN") {
          setCurrentLocale(e.newValue);
        }
      }
    };

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

  const [dialogElement, setDialogElement] = useState<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({
    name: false,
    instanceName: false,
    deploymentName: false,
    embeddingDeploymentName: false,
    apiVersion: false,
    displayName: false,
  });

  const setError = (field: keyof FormErrors, value: boolean) => {
    setErrors((prev) => ({ ...prev, [field]: value }));
  };

  const clearErrors = () => {
    setErrors({
      name: false,
      instanceName: false,
      deploymentName: false,
      embeddingDeploymentName: false,
      apiVersion: false,
      displayName: false,
    });
  };

  const validateFields = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors };

    // Validate name
    newErrors.name = !model.name;
    if (!model.name) isValid = false;

    // Validate Azure OpenAI specific fields
    if (model.provider === ChatModelProviders.AZURE_OPENAI) {
      newErrors.instanceName = !model.azureOpenAIApiInstanceName;
      newErrors.apiVersion = !model.azureOpenAIApiVersion;

      if (isEmbeddingModel) {
        newErrors.embeddingDeploymentName = !model.azureOpenAIApiEmbeddingDeploymentName;
        if (!model.azureOpenAIApiEmbeddingDeploymentName) isValid = false;
      } else {
        newErrors.deploymentName = !model.azureOpenAIApiDeploymentName;
        if (!model.azureOpenAIApiDeploymentName) isValid = false;
      }

      if (!model.azureOpenAIApiInstanceName || !model.azureOpenAIApiVersion) {
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const getDefaultApiKey = (provider: Provider): string => {
    return (settings[ProviderSettingsKeyMap[provider as SettingKeyProviders]] as string) || "";
  };

  const getInitialModel = (provider = defaultProvider): CustomModel => {
    const baseModel = {
      name: "",
      provider,
      enabled: true,
      isBuiltIn: false,
      baseUrl: "",
      apiKey: getDefaultApiKey(provider),
      isEmbeddingModel,
      capabilities: [],
    };

    if (!isEmbeddingModel) {
      return {
        ...baseModel,
        stream: true,
      };
    }

    return baseModel;
  };

  const [model, setModel] = useState<CustomModel>(getInitialModel());

  // Clean up model data by trimming whitespace
  const getCleanedModel = (modelData: CustomModel): CustomModel => {
    return {
      ...modelData,
      name: modelData.name?.trim(),
      baseUrl: modelData.baseUrl?.trim(),
      apiKey: modelData.apiKey?.trim(),
      openAIOrgId: modelData.openAIOrgId?.trim(),
      azureOpenAIApiInstanceName: modelData.azureOpenAIApiInstanceName?.trim(),
      azureOpenAIApiDeploymentName: modelData.azureOpenAIApiDeploymentName?.trim(),
      azureOpenAIApiEmbeddingDeploymentName:
        modelData.azureOpenAIApiEmbeddingDeploymentName?.trim(),
      azureOpenAIApiVersion: modelData.azureOpenAIApiVersion?.trim(),
    };
  };

  const [providerInfo, setProviderInfo] = useState<ProviderMetadata>(
    getProviderInfo(defaultProvider)
  );

  // Check if the form has required fields filled
  const isFormValid = (): boolean => {
    return Boolean(model.name && model.provider);
  };

  // Check if buttons should be disabled
  const isButtonDisabled = (): boolean => {
    return isVerifying || !isFormValid();
  };

  const handleAdd = () => {
    if (!validateFields()) {
      new Notice(localeService.getTranslation("modelSettings.fillRequiredFields"));
      return;
    }

    const cleanedModel = getCleanedModel(model);
    onAdd(cleanedModel);
    onOpenChange(false);
    setModel(getInitialModel());
    clearErrors();
  };

  const handleProviderChange = (provider: ChatModelProviders) => {
    setProviderInfo(getProviderInfo(provider));
    setModel({
      ...model,
      provider,
      apiKey: getDefaultApiKey(provider),
      ...(provider === ChatModelProviders.OPENAI ? { openAIOrgId: settings.openAIOrgId } : {}),
      ...(provider === ChatModelProviders.AZURE_OPENAI
        ? {
            azureOpenAIApiInstanceName: settings.azureOpenAIApiInstanceName,
            azureOpenAIApiDeploymentName: settings.azureOpenAIApiDeploymentName,
            azureOpenAIApiVersion: settings.azureOpenAIApiVersion,
            azureOpenAIApiEmbeddingDeploymentName: settings.azureOpenAIApiEmbeddingDeploymentName,
          }
        : {}),
    });
  };
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setModel(getInitialModel());
      clearErrors();
      setIsOpen(false);
    }
    onOpenChange(open);
  };

  const handleVerify = async () => {
    if (!validateFields()) {
      new Notice(localeService.getTranslation("modelSettings.fillRequiredFields"));
      return;
    }

    setIsVerifying(true);
    try {
      const cleanedModel = getCleanedModel(model);
      await ping(cleanedModel);
      new Notice(localeService.getTranslation("modelSettings.verificationSuccess"));
    } catch (err) {
      console.error(err);
      const errStr = err2String(err);
      new Notice(localeService.getTranslation("modelSettings.verificationFailed") + ": " + errStr);
    } finally {
      setIsVerifying(false);
    }
  };

  const renderProviderSpecificFields = () => {
    const fields = () => {
      switch (model.provider) {
        case ChatModelProviders.OPENAI:
          return (
            <FormField
              label={localeService.getTranslation("modelSettings.openAIOrgId")}
              description={localeService.getTranslation("modelSettings.openAIOrgIdDescription")}
            >
              <Input
                type="text"
                placeholder={localeService.getTranslation(
                  "modelSettings.enterOpenAIOrgIdPlaceholder"
                )}
                value={model.openAIOrgId || ""}
                onChange={(e) => setModel({ ...model, openAIOrgId: e.target.value })}
              />
            </FormField>
          );
        case ChatModelProviders.AZURE_OPENAI:
          return (
            <>
              <FormField
                label={localeService.getTranslation("modelSettings.instanceName")}
                required
                error={errors.instanceName}
                errorMessage={localeService.getTranslation("modelSettings.instanceNameRequired")}
              >
                <Input
                  type="text"
                  placeholder={localeService.getTranslation("modelSettings.enterAzureInstanceName")}
                  value={model.azureOpenAIApiInstanceName || ""}
                  onChange={(e) => {
                    setModel({ ...model, azureOpenAIApiInstanceName: e.target.value });
                    setError("instanceName", false);
                  }}
                />
              </FormField>

              {!isEmbeddingModel ? (
                <FormField
                  label={localeService.getTranslation("modelSettings.deploymentName")}
                  required
                  error={errors.deploymentName}
                  errorMessage={localeService.getTranslation(
                    "modelSettings.deploymentNameRequired"
                  )}
                  description={localeService.getTranslation(
                    "modelSettings.deploymentNameDescription"
                  )}
                >
                  <Input
                    type="text"
                    placeholder={localeService.getTranslation(
                      "modelSettings.enterAzureDeploymentName"
                    )}
                    value={model.azureOpenAIApiDeploymentName || ""}
                    onChange={(e) => {
                      setModel({ ...model, azureOpenAIApiDeploymentName: e.target.value });
                      setError("deploymentName", false);
                    }}
                  />
                </FormField>
              ) : (
                <FormField
                  label={localeService.getTranslation("modelSettings.embeddingDeploymentName")}
                  required
                  error={errors.embeddingDeploymentName}
                  errorMessage={localeService.getTranslation(
                    "modelSettings.embeddingDeploymentNameRequired"
                  )}
                >
                  <Input
                    type="text"
                    placeholder={localeService.getTranslation(
                      "modelSettings.enterAzureEmbeddingDeploymentName"
                    )}
                    value={model.azureOpenAIApiEmbeddingDeploymentName || ""}
                    onChange={(e) => {
                      setModel({ ...model, azureOpenAIApiEmbeddingDeploymentName: e.target.value });
                      setError("embeddingDeploymentName", false);
                    }}
                  />
                </FormField>
              )}

              <FormField
                label={localeService.getTranslation("modelSettings.apiVersion")}
                required
                error={errors.apiVersion}
                errorMessage={localeService.getTranslation("modelSettings.apiVersionRequired")}
              >
                <Input
                  type="text"
                  placeholder={localeService.getTranslation("modelSettings.enterAzureApiVersion")}
                  value={model.azureOpenAIApiVersion || ""}
                  onChange={(e) => {
                    setModel({ ...model, azureOpenAIApiVersion: e.target.value });
                    setError("apiVersion", false);
                  }}
                />
              </FormField>
            </>
          );
        default:
          return null;
      }
    };

    const content = fields();
    if (!content) return null;

    return (
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="space-y-2 border rounded-lg pt-4"
      >
        <div className="flex items-center justify-between">
          <Label>
            {localeService
              .getTranslation("modelSettings.additionalProviderSettings")
              .replace("{provider}", getProviderLabel(model.provider))}
          </Label>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronDown className="h-4 w-4" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="space-y-4 max-h-[200px] overflow-y-auto pl-0.5 pr-2 pb-0.5">
          {content}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const getPlaceholderUrl = () => {
    if (model.provider !== ChatModelProviders.AZURE_OPENAI) {
      return providerInfo.host;
    }

    const instanceName = model.azureOpenAIApiInstanceName || "[instance]";
    const deploymentName = isEmbeddingModel
      ? model.azureOpenAIApiEmbeddingDeploymentName || "[deployment]"
      : model.azureOpenAIApiDeploymentName || "[deployment]";
    const apiVersion = model.azureOpenAIApiVersion || "[api-version]";
    const endpoint = isEmbeddingModel ? "embeddings" : "chat/completions";

    return `https://${instanceName}.openai.azure.com/openai/deployments/${deploymentName}/${endpoint}?api-version=${apiVersion}`;
  };

  const capabilityOptions = Object.entries(MODEL_CAPABILITIES).map(([id, description]) => ({
    id,
    label:
      localeService.getTranslation(`modelSettings.capabilities.${id}Label`) ||
      id.charAt(0).toUpperCase() + id.slice(1),
    description: localeService.getTranslation(`modelSettings.capabilities.${id}`),
  })) as Array<{ id: ModelCapability; label: string; description: string }>;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        container={modalContainer}
        ref={(el) => setDialogElement(el)}
      >
        <DialogHeader>
          <DialogTitle>
            {isEmbeddingModel
              ? localeService.getTranslation("modelSettings.addCustomEmbeddingModel")
              : localeService.getTranslation("modelSettings.addCustomModel")}
          </DialogTitle>
          <DialogDescription>
            {localeService.getTranslation("modelSettings.addModelDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <FormField
            label={localeService.getTranslation("modelSettings.modelName")}
            required
            error={errors.name}
            errorMessage={localeService.getTranslation("modelSettings.modelNameRequired")}
          >
            <Input
              type="text"
              placeholder={`${localeService.getTranslation("modelSettings.enterModelName")} (${
                isEmbeddingModel ? "text-embedding-3-small" : "gpt-4"
              })`}
              value={model.name}
              onChange={(e) => {
                setModel({ ...model, name: e.target.value });
                setError("name", false);
              }}
            />
          </FormField>

          <FormField
            label={
              <div className="flex items-center gap-1.5">
                <span className="leading-none">
                  {localeService.getTranslation("modelSettings.displayName")}
                </span>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent align="start" className="max-w-96" side="bottom">
                      <div className="text-sm text-muted flex flex-col gap-0.5">
                        <div className="text-[12px] font-bold">
                          {localeService.getTranslation("modelSettings.suggestedFormat")}:
                        </div>
                        <div className="text-accent">[Source]-[Payment]:[Pretty Model Name]</div>
                        <div className="text-[12px]">
                          {localeService.getTranslation("modelSettings.example")}:
                          <li>Direct-Paid:Ds-r1</li>
                          <li>OpenRouter-Paid:Ds-r1</li>
                          <li>Perplexity-Paid:lg</li>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            }
          >
            <Input
              type="text"
              placeholder={localeService.getTranslation(
                "modelSettings.customDisplayNamePlaceholder"
              )}
              value={model.displayName || ""}
              onChange={(e) => {
                setModel({ ...model, displayName: e.target.value });
              }}
            />
          </FormField>

          <FormField label={localeService.getTranslation("modelSettings.provider")}>
            <Select value={model.provider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue
                  placeholder={localeService.getTranslation("modelSettings.selectProvider")}
                />
              </SelectTrigger>
              <SelectContent container={dialogElement}>
                {Object.values(
                  isEmbeddingModel
                    ? omit(EmbeddingModelProviders, ["COPILOT_PLUS", "COPILOT_PLUS_JINA"])
                    : omit(ChatModelProviders, ["COPILOT_PLUS"])
                ).map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {getProviderLabel(provider)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label={localeService.getTranslation("modelSettings.baseUrl")}
            description={localeService.getTranslation("modelSettings.baseUrlDescription")}
          >
            <Input
              type="text"
              placeholder={getPlaceholderUrl() || "https://api.example.com/v1"}
              value={model.baseUrl || ""}
              onChange={(e) => setModel({ ...model, baseUrl: e.target.value })}
            />
          </FormField>

          <FormField label={localeService.getTranslation("modelSettings.apiKey")}>
            <PasswordInput
              placeholder={`${localeService.getTranslation("modelSettings.enter")} ${providerInfo.label} ${localeService.getTranslation("modelSettings.apiKey")}`}
              value={model.apiKey || ""}
              onChange={(value) => setModel({ ...model, apiKey: value })}
            />
            {providerInfo.keyManagementURL && (
              <p className="text-xs text-muted">
                <a href={providerInfo.keyManagementURL} target="_blank" rel="noopener noreferrer">
                  {localeService.getTranslation("modelSettings.get")} {providerInfo.label}{" "}
                  {localeService.getTranslation("modelSettings.apiKey")}
                </a>
              </p>
            )}
          </FormField>

          <FormField label={localeService.getTranslation("modelSettings.capabilities.title")}>
            <div className="flex gap-4 items-center">
              {capabilityOptions.map(({ id, label, description }) => (
                <div key={id} className="flex items-center gap-2">
                  <Checkbox
                    id={id}
                    checked={model.capabilities?.includes(id)}
                    onCheckedChange={(checked) => {
                      const newCapabilities = model.capabilities || [];
                      setModel({
                        ...model,
                        capabilities: checked
                          ? [...newCapabilities, id]
                          : newCapabilities.filter((cap) => cap !== id),
                      });
                    }}
                  />
                  <Label htmlFor={id} className="text-sm">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>{label}</span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">{description}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                </div>
              ))}
            </div>
          </FormField>

          {renderProviderSpecificFields()}
        </div>

        <div className="flex justify-end gap-4 items-center">
          <div className="flex items-center gap-2">
            <Checkbox
              id="enable-cors"
              checked={model.enableCors || false}
              onCheckedChange={(checked: boolean) => setModel({ ...model, enableCors: checked })}
            />
            <Label htmlFor="enable-cors" className="text-sm">
              {localeService.getTranslation("modelSettings.enableCors")}
            </Label>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleAdd} disabled={isButtonDisabled()}>
              {localeService.getTranslation("modelSettings.addModel")}
            </Button>
            <Button variant="secondary" onClick={handleVerify} disabled={isButtonDisabled()}>
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {localeService.getTranslation("modelSettings.verify")}
                </>
              ) : (
                localeService.getTranslation("modelSettings.verify")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
