import { useMemo } from "react";
import { useAccessStore, useAppConfig } from "../store";
import { collectModelsWithDefaultModel } from "./model";

export function useAllModels() {
  const accessStore = useAccessStore();
  const configStore = useAppConfig();
  const models = useMemo(() => {
    const allowedModels = [
      "deepseek-chat",
      "deepseek-coder",
      "deepseek-reasoner",
      "Pro/deepseek-ai/DeepSeek-R1",
      "Pro/deepseek-ai/DeepSeek-V3",
      "qwq-32b",
      "qwen-plus",
      "deepseek-r1",
    ];

    const allModels = collectModelsWithDefaultModel(
      configStore.models,
      [configStore.customModels, accessStore.customModels].join(","),
      accessStore.defaultModel,
    );

    return allModels.filter((model) => allowedModels.includes(model.name));
  }, [
    accessStore.customModels,
    accessStore.defaultModel,
    configStore.customModels,
    configStore.models,
  ]);

  return models;
}
