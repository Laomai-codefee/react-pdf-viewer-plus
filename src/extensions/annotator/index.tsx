import React, { useEffect, useRef } from 'react'
import { usePdfViewerContext } from '../../context/pdf_viewer_context'
import { Painter } from './painter'
import { useUserContext } from '@/context/user_context'
import { usePainter } from './context/painter_context'
import { PDFPageView } from 'pdfjs-dist/types/web/pdf_page_view'
import { PopoverBarRef } from '@/components/popover_bar'
import { SelectionBar } from './components/selection_bar'
import { useOptionsContext } from './context/options_context'
import { MenuBar, MenuBarRef } from './components/menu_bar'
import { IAnnotationStore } from './const/definitions'
import { FREE_TEXT_EDITOR } from './painter/const'
import { useAnnotationStore } from './store'
import { debounce } from '@/utils'

interface AnnotatorExtensionProps {
    enableNativeAnnotations: boolean
    annotations?: IAnnotationStore[]

    onLoad: () => void

    onAnnotationAdd: (annotation: IAnnotationStore) => void
    onAnnotationDelete: (id: string) => void
    onAnnotationSelected: (annotation: IAnnotationStore | null, isClick: boolean) => void
    onAnnotationChanged: (annotation: IAnnotationStore) => void
}

export const AnnotatorExtension: React.FC<AnnotatorExtensionProps> = ({
    enableNativeAnnotations,
    annotations,
    onLoad,
    onAnnotationAdd,
    onAnnotationDelete,
    onAnnotationSelected,
    onAnnotationChanged
}) => {
    const { isReady, pdfViewer, eventBus, isSidebarCollapsed } = usePdfViewerContext()
    const { user } = useUserContext()
    const { setPainter } = usePainter()
    const { defaultOptions, primaryColor } = useOptionsContext()

    const clearAnnotations = useAnnotationStore(state => state.clearAnnotations)


    const resolvedAnnotations = annotations ?? []

    const selectionBarRef = useRef<PopoverBarRef>(null)
    const menuBarRef = useRef<MenuBarRef>(null)

    const debouncedViewAreaChanged = useRef(
        debounce(
            () => {
                menuBarRef.current?.close()
                selectionBarRef.current?.close()

                const element = document.querySelector(`#${FREE_TEXT_EDITOR}`)
                if (element?.parentNode) {
                    try {
                        element.parentNode.removeChild(element)
                    } catch {
                        // ignore
                    }
                }
            },
            100,
            true
        )
    ).current

    const handleViewAreaChanged = () => {
        debouncedViewAreaChanged()
    }

    useEffect(() => {

        clearAnnotations();

        if (!isReady || !pdfViewer || !eventBus || !user) return

        const painterInstance = new Painter({
            primaryColor,
            defaultOptions,
            currentUser: user,
            PDFViewerApplication: pdfViewer,

            onTextSelected: (range) => {
                selectionBarRef.current?.open(range)
            },

            onAnnotationAdd: (annotation) => {
                onAnnotationAdd(annotation)
            },

            onAnnotationDelete: (id) => {
                onAnnotationDelete(id)
            },

            onAnnotationSelected: (annotation, isClick, selectorRect) => {
                if (isClick && annotation) {
                    menuBarRef.current?.open(annotation, selectorRect)
                }
                onAnnotationSelected(annotation ?? null, isClick)
            },

            onAnnotationChanging: () => {
                menuBarRef.current?.close()
            },

            onAnnotationChanged: (annotation, selectorRect) => {
                if (annotation && selectorRect) {
                    menuBarRef.current?.open(annotation, selectorRect)
                }
                if (annotation) {
                    onAnnotationChanged(annotation)
                }
            }
        })

        setPainter(painterInstance)

        const handlePageRendered = ({ source, cssTransform, pageNumber }: { source: PDFPageView; cssTransform: boolean; pageNumber: number }) => {
            painterInstance.initCanvas({
                pageView: source,
                cssTransform,
                pageNumber
            })
        }

        eventBus.on('pagerendered', handlePageRendered)

        // NOTE: private pdfjs event API, version-sensitive
        eventBus._on('updateviewarea', handleViewAreaChanged)

        painterInstance.initWebSelection(pdfViewer.viewer as HTMLDivElement)

        // 检查文档是否已经加载
        const handleDocumentLoaded = async () => {
            await painterInstance.initAnnotationsOnce(resolvedAnnotations, enableNativeAnnotations)
            setTimeout(() => {
                for (let i = 0; i < pdfViewer.pagesCount; i++) {
                    const pageView = pdfViewer.getPageView(i);
                    if (pageView && pageView.div && pageView.canvas) {
                        const konvaCanvasStore = painterInstance.getKonvaCanvasStore();
                        if (konvaCanvasStore && konvaCanvasStore.has(i + 1)) {
                            painterInstance.reRenderAnnotations(i + 1);
                        }
                    }
                }
            }, 0);
            onLoad?.()

        }

        if (pdfViewer.pdfDocument) {
            handleDocumentLoaded();
        } else {
            eventBus.on('documentloaded', handleDocumentLoaded);
        }

        return () => {
            eventBus.off('pagerendered', handlePageRendered);
            eventBus.off('updateviewarea', handleViewAreaChanged)
            eventBus.off('documentloaded', handleDocumentLoaded);

        };

    }, [isReady, pdfViewer, eventBus, user]);


    useEffect(() => {
        handleViewAreaChanged()
    }, [isSidebarCollapsed])

    return (
        <>
            <SelectionBar ref={selectionBarRef} />
            <MenuBar ref={menuBarRef} />
        </>
    )
}
