import React, { useEffect } from 'react'
import { usePdfViewerContext } from '../../context/pdf_viewer_context'
import { EventBus } from 'pdfjs-dist/types/web/event_utils'
import { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer'

interface ViewerExtensionProps {
    onDocumentLoaded?: (pdfViewer: PDFViewer | null) => void
    onEventBusReady?: (eventBus: EventBus | null) => void
}

export const ViewerExtension: React.FC<ViewerExtensionProps> = ({
    onDocumentLoaded,
    onEventBusReady
}) => {
    const { isReady, pdfViewer, eventBus, isSidebarCollapsed } = usePdfViewerContext()

    useEffect(() => {
        if (!isReady || !pdfViewer || !eventBus) return
        onEventBusReady?.(eventBus)

        const handleDocumentLoaded = async () => {
            onDocumentLoaded?.(pdfViewer)
        }

        if (pdfViewer.pdfDocument) {
            handleDocumentLoaded();
        } else {
            eventBus.on('documentloaded', handleDocumentLoaded);
        }

        return () => {
            eventBus.off('documentloaded', handleDocumentLoaded);
        };

    }, [isReady, pdfViewer, eventBus]);

    useEffect(() => {
        if (eventBus && pdfViewer) {
            eventBus.dispatch('updateviewarea', { pdfViewer });
        }
    }, [isSidebarCollapsed, eventBus, pdfViewer])

    return (
        <></>
    )
}