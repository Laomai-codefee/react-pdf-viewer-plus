import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { DownloadManager, EventBus, PDFLinkService, PDFViewer } from 'pdfjs-dist/legacy/web/pdf_viewer.mjs'
import { AnnotationMode, getDocument, PDFDataRangeTransport, PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs'

import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface UseViewerOptions {
    /** PDF 文件 URL */
    url: string | URL
    /** 是否启用 Range 加载， 默认 auto */
    enableRange?: boolean | 'auto'
    /** PDF 加载成功回调 */
    onLoadSuccess?: (pdfDocument: PDFDocumentProxy) => void
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

function isRangeFailure(error: unknown) {
    if (!(error instanceof Error)) return false

    const msg = error.message.toLowerCase()

    return msg.includes('range') || msg.includes('content-length') || msg.includes('unexpected server response') || msg.includes('cors')
}

export function usePdfViewer(containerRef: React.RefObject<HTMLDivElement>, options: UseViewerOptions) {
    const {
        url,
        enableRange = 'auto',
        onLoadSuccess,
        onLoadError,
        onLoadEnd,
        onViewerInit,
        eventBus: externalEventBus,
        textLayerMode = 1,
        annotationMode = AnnotationMode.DISABLE,
        externalLinkTarget = 2
    } = options

    const stableOnLoadSuccess = useCallback((pdfDocument: PDFDocumentProxy) => onLoadSuccess?.(pdfDocument), [onLoadSuccess])
    const stableOnLoadError = useCallback((error: Error) => onLoadError?.(error), [onLoadError])
    const stableOnLoadEnd = useCallback(() => onLoadEnd?.(), [onLoadEnd])
    const stableOnViewerInit = useCallback((viewer: PDFViewer) => onViewerInit?.(viewer), [onViewerInit])

    const pdfViewerRef = useRef<PDFViewer | null>(null)
    const linkServiceRef = useRef<PDFLinkService | null>(null)
    const eventBusRef = useRef<EventBus | null>(null)
    const cleanupRef = useRef<(() => void) | null>(null)

    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState(0)
    const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null)
    const [metadata, setMetadata] = useState<any>(null)
    const [loadError, setLoadError] = useState<Error | null>(null)

    /** 创建 PDFViewer */
    const createPdfViewer = useCallback(() => {
        if (cleanupRef.current) {
            cleanupRef.current()
            cleanupRef.current = null
        }

        if (!containerRef.current) throw new Error('PDF container not ready')

        const bus = externalEventBus || new EventBus()
        eventBusRef.current = bus

        const linkService = new PDFLinkService({ eventBus: bus, externalLinkTarget })
        const downloadManager = new DownloadManager()

        const viewer = new PDFViewer({
            container: containerRef.current,
            eventBus: bus,
            textLayerMode,
            annotationMode,
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
            if (linkServiceRef.current) linkServiceRef.current = null
            if (!externalEventBus && eventBusRef.current) eventBusRef.current = null
        }

        stableOnViewerInit?.(viewer)
        return { bus, linkService, viewer }
    }, [containerRef, externalEventBus, textLayerMode, annotationMode, externalLinkTarget, stableOnViewerInit])

    const createTransport = useCallback(async (url: string) => {
        const headResp = await fetch(url, { method: 'HEAD' })
        const length = Number(headResp.headers.get('Content-Length'))
        if (isNaN(length)) throw new Error('Cannot get PDF length for range loading')
        class MyPDFDataRangeTransport extends PDFDataRangeTransport {
            async requestDataRange(begin: number, end: number) {
                const resp = await fetch(url, { headers: { Range: `bytes=${begin}-${end - 1}` } })
                const arrayBuffer = await resp.arrayBuffer()
                this.onDataRange(begin, new Uint8Array(arrayBuffer))
            }
        }

        return new MyPDFDataRangeTransport(length, null)
    }, [])

    const createLoadingTask = useCallback(
        async (useRange: boolean) => {
            if (useRange) {
                const transport = await createTransport(url as string)
                return getDocument({ range: transport })
            }
            return getDocument({ url, disableRange: true, disableStream: true })
        },
        [url, createTransport]
    )

    const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null)

    const loadPdf = useCallback(async () => {
        if (!url) return

        setLoading(true)
        setProgress(0)
        setLoadError(null)
        setPdfDocument(null)

        const { linkService, viewer } = createPdfViewer()

        let triedRange = false

        try {
            const shouldTryRange = enableRange === true || enableRange === 'auto'

            let loadingTask: PDFDocumentLoadingTask

            if (shouldTryRange) {
                triedRange = true
                loadingTask = await createLoadingTask(true)
            } else {
                loadingTask = await createLoadingTask(false)
            }

            loadingTaskRef.current = loadingTask

            loadingTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
                if (total > 0) {
                    setProgress(Math.round((loaded / total) * 100))
                }
            }

            const pdf = await loadingTask.promise
            setPdfDocument(pdf)
            linkService.setDocument(pdf)
            viewer.setDocument(pdf)

            const docMetadata = await pdf.getMetadata()
            setMetadata(docMetadata)
            stableOnLoadSuccess?.(pdf)
        } catch (err) {
            // auto 模式下，Range 失败 → fallback
            if (enableRange === 'auto' && triedRange && isRangeFailure(err)) {
                console.warn('[PDF] Range failed, fallback to full loading')

                // 清理失败的 task
                loadingTaskRef.current?.destroy()
                loadingTaskRef.current = null

                // fallback 再来一次（不再 Range）
                try {
                    const fallbackTask = await createLoadingTask(false)
                    loadingTaskRef.current = fallbackTask

                    fallbackTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
                        if (total > 0) {
                            setProgress(Math.round((loaded / total) * 100))
                        }
                    }

                    const pdf = await fallbackTask.promise
                    setPdfDocument(pdf)
                    linkService.setDocument(pdf)
                    viewer.setDocument(pdf)

                    const docMetadata = await pdf.getMetadata()
                    setMetadata(docMetadata)
                    stableOnLoadSuccess?.(pdf)
                    return
                } catch (fallbackErr) {
                    setLoadError(fallbackErr as Error)
                    stableOnLoadError?.(fallbackErr as Error)
                    return
                }
            }

            // 非 Range 错误，直接抛
            setLoadError(err as Error)
            stableOnLoadError?.(err as Error)
        } finally {
            setLoading(false)
            stableOnLoadEnd?.()
        }
    }, [url, enableRange, createPdfViewer, createLoadingTask, stableOnLoadSuccess, stableOnLoadError, stableOnLoadEnd])

    useEffect(() => {
        loadPdf()
        return () => {
            if (cleanupRef.current) {
                cleanupRef.current()
                cleanupRef.current = null
            }
            if (loadingTaskRef.current) {
                loadingTaskRef.current.destroy()
                loadingTaskRef.current = null
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
