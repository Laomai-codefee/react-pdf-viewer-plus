import React, { forwardRef, useImperativeHandle } from 'react';
import { PopoverBar, PopoverBarProps, PopoverBarRef } from '@/components/popover_bar';
import { HighlightIcon, StrikeoutIcon, UnderlineIcon } from '../../const/icons';
import { usePainter } from '../../context/painter_context';
import { annotationDefinitions, IAnnotationType } from '../../const/definitions';
import { useTranslation } from 'react-i18next';

export interface SelectionBarRef {
    open: (range: Range | null) => void;
    close: () => void;
}


export interface SelectionBarProps {
    popoverBarProps?: Omit<PopoverBarProps, 'renderButtons' | 'buttons'>;
}

/**
 * SelectionBar 文本选择工具栏组件
 */
const SelectionBar = forwardRef<SelectionBarRef, SelectionBarProps>(function SelectionBar(props, ref) {

    const { t } = useTranslation(['annotator'], { useSuspense: false })
    
    const {
        popoverBarProps = {}
    } = props;

    const popoverBarRef = React.useRef<PopoverBarRef>(null);

    const { painter } = usePainter();

    useImperativeHandle(ref, () => ({
        open: (range: Range | null) => {
            popoverBarRef.current?.open(range);
        },
        close: () => {
            popoverBarRef.current?.close();
        }
    }), []);

    return (
        <PopoverBar
            ref={popoverBarRef}
            renderButtons={() => [
                {
                    key: 'highlight',
                    icon: <HighlightIcon style={{ color: '#000000d6'}} />,
                    onClick: (range) => {
                        const annotation = annotationDefinitions.find(a => a.name === 'highlight') as IAnnotationType
                        painter?.highlightRange(range, annotation)
                        popoverBarRef.current?.close();
                    },
                    title: t('annotator:tool.highlight')
                },
                {
                    key: 'underline',
                    icon: <UnderlineIcon style={{ color: '#000000d6'}} />,
                    onClick: (range) => {
                        const annotation = annotationDefinitions.find(a => a.name === 'underline') as IAnnotationType
                        painter?.highlightRange(range, annotation)
                        popoverBarRef.current?.close();
                    },
                    title: t('annotator:tool.underline')
                },
                {
                    key: 'strikeout',
                    icon: <StrikeoutIcon style={{ color: '#000000d6'}} />,
                    onClick: (range) => {
                        const annotation = annotationDefinitions.find(a => a.name === 'strikeout') as IAnnotationType
                        painter?.highlightRange(range, annotation)
                        popoverBarRef.current?.close();
                    },
                    title: t('annotator:tool.strikeout')
                }
            ]}
            {...popoverBarProps}
        />
    );
});

export { SelectionBar };