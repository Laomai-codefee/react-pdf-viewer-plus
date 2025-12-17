import '@radix-ui/themes/styles.css'
import { Box, Tabs, Theme } from '@radix-ui/themes';
import React from 'react';
import ReactDOM from 'react-dom/client';
import PdfAnnotatorBasic from './pdf_annotator_basic';
import PdfViewerBasic from './pdf_viewer_basic';
import PdfViewerCustom from './pdf_viewer_custom';
import PdfAnnotatorFull from './pdf_annotator_full';
import PdfAnnotatorCustom from './pdf_annotator_custom';


const App = () => {
    const [activeTab, setActiveTab] = React.useState('PdfViewerBasic');
    return (
        <Theme>
            <Tabs.Root defaultValue="PdfViewerBasic" onValueChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Trigger value="PdfViewerBasic">PdfViewer Basic</Tabs.Trigger>
                    <Tabs.Trigger value="PdfViewerCustom">PdfViewer Custom</Tabs.Trigger>
                    <Tabs.Trigger value="PdfAnnotatorBasic">PdfAnnotator Basic</Tabs.Trigger>                    
                    <Tabs.Trigger value="PdfAnnotatorCustom">PdfAnnotator Custom</Tabs.Trigger>
                    <Tabs.Trigger value="PdfAnnotatorFull">PdfAnnotator Full</Tabs.Trigger>
                </Tabs.List>
                <Box pt="0">
                    <Tabs.Content value="PdfViewerBasic">
                        <PdfViewerBasic key={activeTab} />
                    </Tabs.Content>
                    <Tabs.Content value="PdfViewerCustom">
                        <PdfViewerCustom  key={activeTab}/>
                    </Tabs.Content>
                    <Tabs.Content value="PdfAnnotatorBasic">
                        <PdfAnnotatorBasic key={activeTab} />
                    </Tabs.Content>
                    <Tabs.Content value="PdfAnnotatorFull">
                        <PdfAnnotatorFull key={activeTab} />
                    </Tabs.Content>
                    <Tabs.Content value="PdfAnnotatorCustom">
                        <PdfAnnotatorCustom key={activeTab} />
                    </Tabs.Content>
                </Box>
            </Tabs.Root>
        </Theme>
    );
};

App.displayName = 'App';

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);