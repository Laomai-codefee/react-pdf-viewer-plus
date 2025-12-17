// src/hooks/useViewer.ts
import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { DownloadManager, EventBus, PDFLinkService, PDFViewer } from 'pdfjs-dist/legacy/web/pdf_viewer.mjs'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString()

// ... existing code ...
export interface UseViewerOptions {
    /** PDF 文件 URL */
    url: string | URL
    /** PDF 加载成功回调 */
    onLoadSuccess?: (pdfDocument: pdfjsLib.PDFDocumentProxy) => void
    /** PDF 加载失败回调 */
    onLoadError?: (error: Error) => void
    /** PDF 加载结束（包括成功或失败） */
    onLoadEnd?: () => void
    /** Viewer 初始化回调（暴露 PDFViewer 实例） */
    onViewerInit?: (viewer: PDFViewer) => void
    /** 外部 eventBus，可复用 */
    eventBus?: EventBus
    /** 文本层模式 */
    textLayerMode?: number
    /** 批注层模式 */
    annotationMode?: number
    /** 外部链接打开方式 */
    externalLinkTarget?: number
}
// ... existing code ...

export function usePdfViewer(containerRef: React.RefObject<HTMLDivElement>, options: UseViewerOptions) {
    const {
        url,
        onLoadSuccess,
        onLoadError,
        onLoadEnd,
        onViewerInit,
        eventBus: externalEventBus,
        textLayerMode = 1,
        annotationMode = pdfjsLib.AnnotationMode.ENABLE,
        externalLinkTarget = 2
    } = options

    const stableOnLoadSuccess = useCallback((pdfDocument: pdfjsLib.PDFDocumentProxy) => onLoadSuccess?.(pdfDocument), [onLoadSuccess])
    const stableOnLoadError = useCallback((error: Error) => onLoadError?.(error), [onLoadError])
    const stableOnLoadEnd = useCallback(() => onLoadEnd?.(), [onLoadEnd])
    const stableOnViewerInit = useCallback((viewer: PDFViewer) => onViewerInit?.(viewer), [onViewerInit])

    const pdfViewerRef = useRef<PDFViewer | null>(null)
    const linkServiceRef = useRef<PDFLinkService | null>(null)
    const eventBusRef = useRef<EventBus | null>(null)
    const cleanupRef = useRef<(() => void) | null>(null)

    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState(0)
    const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
    const [metadata, setMetadata] = useState<any>(null)
    const [loadError, setLoadError] = useState<Error | null>(null)

    const createPdfViewer = useCallback(() => {
        if (cleanupRef.current) {
            cleanupRef.current()
            cleanupRef.current = null
        }

        if (!containerRef.current) throw new Error('PDF container not ready')

        const bus = externalEventBus || new EventBus()
        eventBusRef.current = bus

        const linkService = new PDFLinkService({
            eventBus: bus,
            externalLinkTarget
        })
        const downloadManager = new DownloadManager()

        const viewer = new PDFViewer({
            container: containerRef.current,
            eventBus: bus,
            textLayerMode: textLayerMode,
            annotationMode: annotationMode,
            linkService,
            downloadManager
        })

        linkService.setViewer(viewer)
        pdfViewerRef.current = viewer
        linkServiceRef.current = linkService

        cleanupRef.current = () => {
            if (pdfViewerRef.current) {
                pdfViewerRef.current.cleanup()
                pdfViewerRef.current = null
            }
            if (linkServiceRef.current) {
                linkServiceRef.current = null
            }

            if (!externalEventBus && eventBusRef.current) {
                eventBusRef.current = null
            }
        }

        stableOnViewerInit?.(viewer)
        return { bus, linkService, viewer }
    }, [containerRef, externalEventBus, textLayerMode, annotationMode, externalLinkTarget, stableOnViewerInit])

    const loadPdf = useCallback(async () => {
        if (!url) return
        setLoading(true)
        setProgress(0)
        setPdfDocument(null)
        setLoadError(null)

        try {
            const { bus, linkService, viewer } = createPdfViewer()

            const loadingTask = pdfjsLib.getDocument({
                url
            })

            loadingTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
                setProgress(Math.round((loaded / total) * 100))
            }

            const pdf = await loadingTask.promise
            setPdfDocument(pdf)
            linkService.setDocument(pdf)
            viewer.setDocument(pdf)
            bus.dispatch('documentloaded', { source: pdf })

            const docMetadata = await pdf.getMetadata()
            setMetadata(docMetadata)
            stableOnLoadSuccess?.(pdf)
        } catch (err) {
            console.error('Failed to load PDF:', err)
            const error = err as Error
            setLoadError(error)
            stableOnLoadError?.(error)
        } finally {
            setLoading(false)
            stableOnLoadEnd?.()
        }
    }, [url, createPdfViewer, onLoadSuccess, onLoadError, onLoadEnd])

    useEffect(() => {
        loadPdf()

        return () => {
            if (cleanupRef.current) {
                cleanupRef.current()
                cleanupRef.current = null
            }
        }
    }, [loadPdf])

    return {
        /** 是否加载中 */
        loading,
        /** 加载进度 */
        progress,
        /** PDF 文档对象 */
        pdfDocument,
        /** PDFViewer 实例 */
        pdfViewer: pdfViewerRef.current,
        /** EventBus 引用 */
        eventBus: eventBusRef.current,
        /** PDF 元数据 */
        metadata,
        /** 加载错误 */
        loadError
    }
}
