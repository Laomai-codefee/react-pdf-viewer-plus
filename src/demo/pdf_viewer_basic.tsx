import React from 'react';
import { PdfViewer } from '../features/viewer';
const PdfViewerBasic: React.FC = () => {
    const pdfUrl = './compressed.tracemonkey-pldi-09.pdf';
    return (
        <PdfViewer
            title="PDF Viewer"
            url={pdfUrl}
            locale="en-US"
            layoutStyle={{ width: '100vw', height: '100vh' }}
        />
    );
}
export default PdfViewerBasic;