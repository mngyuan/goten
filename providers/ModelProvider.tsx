import * as Device from 'expo-device';
import type React from 'react';
import {createContext, useContext} from 'react';
import {QWEN3_1_7B_QUANTIZED, useLLM} from 'react-native-executorch';

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

export default function ModelProvider({children}: {children: React.ReactNode}) {
  if (Device.isDevice) {
    return <ModelProviderInner>{children}</ModelProviderInner>;
  } else {
    // Simulator can't load model (because of RAM?)
    return <>{children}</>;
  }
}

function ModelProviderInner({children}: {children: React.ReactNode}) {
  const llm = useLLM({model: ACTIVE_MODEL});

  return <ModelContext value={{llm}}>{children}</ModelContext>;
}
