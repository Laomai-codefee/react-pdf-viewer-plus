import '@radix-ui/themes/styles.css'

import React, { useEffect, useMemo } from 'react'
import { PdfViewerProvider } from '../../context/pdf_viewer_provider'
import i18n from '@/i18n'
import { PdfBaseProps } from '@/types'
import { ZoomTool } from '@/components/zoom_tool'
import { Theme } from '@radix-ui/themes'
import { usePdfViewerContext } from '@/context/pdf_viewer_context'
import { ViewerExtension } from '@/extensions/viewer'
import { EventBus, PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer'

export interface PdfViewerContextValue {
    pdfViewer: PDFViewer | null
    setSidebarCollapsed: (collapsed: boolean) => void
    toggleSidebar: () => void
}

export interface PdfViewerProps extends PdfBaseProps {

    /**
     * 自定义额外按钮区域组件
     * 可以是一个 React 组件或者 React 元素
     */
    actions?: React.ReactNode | ((context: PdfViewerContextValue) => React.ReactNode)

    /**
     * 自定义侧边栏组件
     * 可以是一个 React 组件或者 React 元素
     */
    sidebar?:  React.ReactNode | ((context: PdfViewerContextValue) => React.ReactNode)

    /**
     * 自定义工具栏组件
     * 可以是一个 React 组件或者 React 元素
     * 默认显示 ZoomTool 组件
     */
    toolbar?:  React.ReactNode | ((context: PdfViewerContextValue) => React.ReactNode)

    /**
     * 是否显示侧边栏触发按钮
     * @default false
     */
    showSidebarTrigger?: boolean

    /**
     * 是否显示文本层（用于选择和搜索文本）
     * @default true
     */
    showTextLayer?: boolean

    /**
     * 文档加载完成回调
     * @param pdfViewer 
     * @returns 
     */
    onDocumentLoaded?: (pdfViewer: PDFViewer | null) => void

    /**
     * PDFjs EventBus 完成回调
     * @param eventBus 
     * @returns 
     */
    onEventBusReady?: (eventBus: EventBus | null) => void
}

const ActionsRenderer: React.FC<{ actions?: PdfViewerProps['actions'] }> = ({ actions }) => {
    const context = usePdfViewerContext()

    if (!actions) {
        return null
    }

    if (typeof actions === 'function') {
        return actions(context)
    }

    return actions
}

const SideBarRenderer: React.FC<{ sidebar?: PdfViewerProps['sidebar'] }> = ({ sidebar }) => {
    const context = usePdfViewerContext()

    if (!sidebar) {
        return null
    }

    if (typeof sidebar === 'function') {
        return sidebar(context)
    }

    return sidebar
}

const ToolBarRenderer: React.FC<{ toolbar?: PdfViewerProps['toolbar'] }> = ({ toolbar }) => {
    const context = usePdfViewerContext()

    if (!toolbar) {
        return <ZoomTool />
    }

    if (typeof toolbar === 'function') {
        return (
            <>
                <ZoomTool />
                {toolbar(context)}
            </>
        )
    }

    return toolbar
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
    title = 'PDF VIEWER',
    url,
    locale = 'zh-CN',
    initialScale,
    layoutStyle,
    theme = 'violet',
    actions,
    sidebar,
    toolbar,
    isSidebarCollapsed = true,
    showSidebarTrigger = false,
    showTextLayer = true,
    onDocumentLoaded,
    onEventBusReady
}) => {
    const viewerOptions = useMemo(() => ({
        textLayerMode: showTextLayer ? 1 : 0,
        annotationMode: 0,
        externalLinkTarget: 0
    }), [showTextLayer])

    useEffect(() => {
        i18n.changeLanguage(locale)
    }, [locale])

    return (
        <Theme accentColor={theme}>
            <PdfViewerProvider
                title={title}
                isSidebarCollapsed={isSidebarCollapsed}
                url={url}
                sidebar={<SideBarRenderer sidebar={sidebar} />}
                toolbar={<ToolBarRenderer toolbar={toolbar} />}
                initialScale={initialScale}
                {...(showSidebarTrigger ? {} : { sidebarTrigger: true })}
                {...viewerOptions}
                style={layoutStyle}
                actions={<ActionsRenderer actions={actions} />}
            >
                <ViewerExtension onEventBusReady={onEventBusReady} onDocumentLoaded={onDocumentLoaded} />
            </PdfViewerProvider>
        </Theme>
    )
}
