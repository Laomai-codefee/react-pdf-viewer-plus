import { createContext, useContext } from 'react';
import type { PdfAnnotatorOptions } from '../types/annotator';

// 定义 OptionsContext 的值类型
export interface OptionsContextValue {
    /** 默认选项配置 */
    defaultOptions: PdfAnnotatorOptions;
    /** 主题色 RGB */
    primaryColor: string;
}

// 创建 Context
export const OptionsContext = createContext<OptionsContextValue | null>(null);

// 自定义 Hook，用于在组件中获取上下文值
export const useOptionsContext = (): OptionsContextValue => {
    const context = useContext(OptionsContext);
    if (!context) {
        throw new Error('useOptionsContext must be used within a OptionsProvider');
    }
    return context;
};