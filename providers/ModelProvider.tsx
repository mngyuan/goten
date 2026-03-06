import React, {createContext, useContext} from 'react';
import {useLLM, QWEN3_1_7B_QUANTIZED} from 'react-native-executorch';

// Change this one line to swap models during testing
const ACTIVE_MODEL = QWEN3_1_7B_QUANTIZED;

type ModelContextType = {
  llm: ReturnType<typeof useLLM>;
};

const ModelContext = createContext<ModelContextType | null>(null);

export function useModel() {
  const ctx = useContext(ModelContext);
  if (!ctx) {
    throw new Error('useModel must be used within ModelProvider');
  }
  return ctx.llm;
}

export default function ModelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const llm = useLLM({model: ACTIVE_MODEL});

  return (
    <ModelContext value={{llm}}>
      {children}
    </ModelContext>
  );
}
