import React from 'react';
import { PdfViewer } from '../features/viewer';
import { PDFPageView } from 'pdfjs-dist/types/web/pdf_page_view';

const PdfViewerCustom: React.FC = () => {
    const pdfUrl = './compressed.tracemonkey-pldi-09.pdf';
    return (
        <div>
            <PdfViewer
                enableRange={false}
                title={<strong>PDF VIEWER CUSTOM</strong>}
                url={pdfUrl}
                layoutStyle={{ width: '100vw', height: '100vh' }}
                locale='en-US'
                showTextLayer={false}
                actions={(context) => (
                    <>
                        <button onClick={() => console.log(context.pdfViewer)}>
                            PDF Viewer
                        </button>
                        <button onClick={context.toggleSidebar}>
                            Toggle Sidebar
                        </button>
                        <button onClick={() => context.setSidebarCollapsed(false)}>
                            Open Sidebar
                        </button>
                        <button onClick={() => context.setSidebarCollapsed(true)}>
                            Close Sidebar
                        </button>

                    </>
                )}
                sidebar={(context) => (
                    <div style={{display:'flex', gap: 10, flexDirection: 'column'}}>
                        <button onClick={() => console.log(context.pdfViewer)}>
                            Get PDF Viewer
                        </button>
                        <button onClick={() => {
                            context.pdfViewer?.scrollPageIntoView({
                                pageNumber: 1
                            })
                        }}>
                            goto page1
                        </button>
                        <button onClick={() => {
                            context.pdfViewer?.scrollPageIntoView({
                                pageNumber: 10
                            })
                        }}>
                            goto page 10
                        </button>
                    </div>
                )}
                toolbar={(context) => (
                    <div style={{display:'flex', gap: 10}}>
                        <button onClick={() => console.log(context.pdfViewer)}>
                            Get PDF Viewer
                        </button>
                        <button onClick={context.toggleSidebar}>
                            Toggle Sidebar
                        </button>
                        <button onClick={() => {
                            context.pdfViewer?.scrollPageIntoView({
                                pageNumber: 1
                            })
                        }}>
                            goto page1
                        </button>
                        <button onClick={() => {
                            context.pdfViewer?.scrollPageIntoView({
                                pageNumber: 10
                            })
                        }}>
                            goto page 10
                        </button>
                    </div>
                )}
                isSidebarCollapsed={false}
                showSidebarTrigger={true}
                onEventBusReady={(eventBus) => {
                    console.log("eventBus", eventBus)
                    eventBus?.on("pagerendered", ({ source, pageNumber, cssTransform }: { source: PDFPageView, pageNumber: number, cssTransform: boolean }) => {
                        console.log('Page rendered', source, pageNumber, cssTransform);
                    })
                    eventBus?.on("updateviewarea", (data: any) => {
                        console.log('updateviewarea', data)
                    })
                    eventBus?.on("scalechanging", (data: any) => {
                        console.log('scalechanging', data)
                    })
                    eventBus?.on("pagechanging", (data: any) => {
                        console.log('pagechanging', data)
                    })
                }}
                onDocumentLoaded={(pdf) => {
                    console.log("document loaded", pdf)
                }}
            />
        </div>
    );
}
export default PdfViewerCustom;