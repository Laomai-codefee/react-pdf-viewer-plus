import React from 'react';
import { PdfAnnotator } from '../features/annotator';


const PdfAnnotatorBasic: React.FC = () => {
    const pdfUrl = './compressed.tracemonkey-pldi-09.pdf';

    return (
        <PdfAnnotator
            title="PDF Annotator"
            layoutStyle={{ height: '96vh' }}
            url={pdfUrl}
            user={{ id: 'u1', name: 'Alice' }}
            locale="en-US"
            onSave={(annotations) => {
                console.log('Saved annotations:', annotations)
            }}
        />
    );
}
export default PdfAnnotatorBasic;
