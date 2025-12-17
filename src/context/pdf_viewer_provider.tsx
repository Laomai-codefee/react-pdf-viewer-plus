import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { usePdfViewer, type UseViewerOptions } from '../hooks/usePdfViewer'
import { PdfViewerContext, type PdfViewerContextValue } from './pdf_viewer_context'
import 'pdfjs-dist/legacy/web/pdf_viewer.css'
import { useTranslation } from 'react-i18next'
import { UserContext, UserContextValue } from './user_context'
import { PdfScale, User } from '@/types'
import styles from './styles.module.scss';
import { SidebarToggle } from '@/components/sidebar_toggle'
import { Flex, Box } from '@radix-ui/themes'
import { LoadingIndicator } from '@/components/loading_indicator'
import { ErrorDisplay } from '@/components/error_display'

export interface PdfViewerProviderProps extends Omit<UseViewerOptions, 'eventBus'> {
    children: React.ReactNode
    toolbar?: React.ReactNode
    title?: React.ReactNode
    actions?: React.ReactNode
    sidebar?: React.ReactNode
    sidebarTrigger?: React.ReactNode | null
    style?: React.CSSProperties
    initialScale?: PdfScale
    user?: User
    isSidebarCollapsed?: boolean
}

export const PdfViewerProvider: React.FC<PdfViewerProviderProps> = ({
    children,
    toolbar,
    sidebar,
    sidebarTrigger,
    title,
    actions,
    style = { width: '100vw', height: '100vh' },
    initialScale = 'auto',
    user,
    isSidebarCollapsed = false,
    ...viewerOptions
}) => {
    const { t } = useTranslation(['viewer', 'common'])
    const viewerContainerRef = useRef<HTMLDivElement>(null)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(isSidebarCollapsed)
    const { loading, progress, pdfDocument, pdfViewer, eventBus, loadError } = usePdfViewer(viewerContainerRef, viewerOptions)

    // useSmoothZoom({
    //     pdfViewer,
    //     containerRef: viewerContainerRef,
    // })

    useEffect(() => {
        if (!pdfViewer || !eventBus) return

        const handlePagesLoaded = () => {
            pdfViewer.currentScaleValue = initialScale
        }

        eventBus.on('pagesloaded', handlePagesLoaded)

        return () => {
            eventBus.off('pagesloaded', handlePagesLoaded)
        }
    }, [pdfViewer, eventBus, initialScale])

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed((prev) => !prev)
    }, [])

    const isReady = !!(pdfViewer && eventBus && viewerContainerRef.current && !loading)

    const contextValue = useMemo<PdfViewerContextValue>(
        () => ({
            pdfDocument,
            pdfViewer,
            eventBus,
            loading,
            progress,
            loadError,
            viewerContainerRef,
            url: viewerOptions.url,
            viewerOptions,
            isReady,
            registerExtensionCleanup: () => { },
            toggleSidebar,
            setSidebarCollapsed,
            isSidebarCollapsed: sidebarCollapsed
        }),
        [pdfDocument, pdfViewer, eventBus, loading, progress, viewerOptions.url, viewerOptions, isReady, toggleSidebar, sidebarCollapsed]
    )

    const userContextValue = useMemo<UserContextValue>(() => ({
        user: user || null
    }), [user]);





    useEffect(() => {
        if (!pdfViewer || !eventBus) {
            return
        }
        const handleResize = () => {
            const currentScaleValue = pdfViewer.currentScaleValue
            if (currentScaleValue === 'auto' || currentScaleValue === 'page-fit' || currentScaleValue === 'page-width') {
                pdfViewer.currentScaleValue = currentScaleValue
            }
            pdfViewer.update()
        }

        window.addEventListener('resize', handleResize)
        handleResize()
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [pdfViewer, eventBus, sidebarCollapsed])

    const sidebarTriggerElement =
        sidebar && sidebarTrigger !== null
            ? sidebarTrigger || (
                <SidebarToggle title={t('sidebar.toggle')} />
            )
            : null

    return (
        <UserContext.Provider value={userContextValue}>
            <PdfViewerContext.Provider value={contextValue}>
                <Flex
                    id="PdfjsExtension"
                    className={styles.PdfjsExtensionViewer}
                    style={style}
                    direction="column"
                    width="100%"
                    position="relative"
                >
                    <LoadingIndicator progress={progress} loading={loading} />
                    {loadError && <ErrorDisplay error={loadError} />}
                    <Flex pl="2" pr="2" className={styles.viewerHeader}>
                        <div className={styles['viewerHeader-title']}>
                            <div className={styles['viewerHeader-title-name']}>
                                {title || 'PDF Viewer'}
                            </div>
                            <div>
                                <Flex direction="row" gap="3" justify="between" align="center">
                                    {sidebarTriggerElement}
                                    {actions}
                                </Flex>
                            </div>
                        </div>
                    </Flex>
                    <Flex flexGrow="1" minHeight="0">
                        <Flex className={styles.viewerContainer} direction="column" flexGrow="1">
                            {toolbar && (
                                <Flex align="center" justify="center" className={styles['viewerContainer-header']}>
                                    {toolbar}
                                </Flex>
                            )}
                            <Box position="relative" flexGrow="1" className={styles['viewerContainer-content']}>
                                <div ref={viewerContainerRef} className={styles.pdfjsViewerContainer}>
                                    <div className="pdfViewer"></div>
                                </div>
                            </Box>
                        </Flex>
                        {sidebar && (
                            <Box
                                className={styles.viewerSidebar}
                                pl="1"
                                pr="1"
                                style={{
                                    display: sidebarCollapsed ? 'none' : 'flex',
                                }}
                            >
                                <div className={styles['viewerSidebar-container']}>{sidebar}</div>
                            </Box>
                        )}
                    </Flex>
                    {children}
                </Flex>
            </PdfViewerContext.Provider>
        </UserContext.Provider >
    )
}