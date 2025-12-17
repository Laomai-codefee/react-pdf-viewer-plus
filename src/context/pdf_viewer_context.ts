// src/context/PdfViewerContext.ts
import React, { createContext, useContext } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { UseViewerOptions } from '../hooks/usePdfViewer';
import { EventBus, PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer';

/**
 * 定义通过 Context 提供给所有子组件的值
 */
export interface PdfViewerContextValue {
    /** PDF 文档对象 */
    pdfDocument: pdfjsLib.PDFDocumentProxy | null;
    /** PDFViewer 实例 */
    pdfViewer: PDFViewer | null;
    /** EventBus 实例 */
    eventBus: EventBus | null;
    /** 是否正在加载 */
    loading: boolean;
    /** 加载进度 (0-100) */
    progress: number;
    /** 加载错误 */
    loadError: Error | null;
    /** PDF 渲染容器的 DOM 引用，供扩展使用 */
    viewerContainerRef: React.RefObject<HTMLDivElement>;
    /** 当前 PDF 的 URL */
    url: string | URL;
    /** 初始化 Viewer 时使用的配置 */
    viewerOptions: UseViewerOptions;
    /** PDF 核心实例是否都已准备就绪，可以安全地进行交互 */
    isReady: boolean;
    // 添加侧边栏控制方法
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    isSidebarCollapsed: boolean;
}

// 创建 Context
export const PdfViewerContext = createContext<PdfViewerContextValue | null>(null);

/**
 * 供子组件使用的自定义 Hook，方便地获取 Context 值
 * @throws {Error} 如果在 Provider 外部使用
 */
export const usePdfViewerContext = (): PdfViewerContextValue => {
    const context = useContext(PdfViewerContext);
    if (!context) {
        throw new Error('usePdfViewerContext must be used within a PdfViewerProvider');
    }
    return context;
};