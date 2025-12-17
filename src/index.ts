import '@radix-ui/themes/styles.css'
import './extensions/annotator/painter/index.scss';

// import './extensions/annotator/components/sidebar/styles.module.scss';
// import './extensions/annotator/components/toolbar/signature.module.scss';
// import './extensions/annotator/components/toolbar/stamp.module.scss';
// import './context/styles.module.scss';
// import './components/color_picker/styles.module.scss';

export { PdfAnnotator } from './features/annotator';
export type { PdfAnnotatorProps , PdfAnnotatorOptions } from './extensions/annotator/types/annotator';
export { PdfViewer } from './features/viewer';
export type { PdfViewerProps } from './features/viewer';
export type {IAnnotationStore} from './extensions/annotator/const/definitions';
export type {User, PdfBaseProps} from './types';