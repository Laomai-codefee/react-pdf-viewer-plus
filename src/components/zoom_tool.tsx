import React, { useState, useEffect } from 'react'
import { usePdfViewerContext } from '../context/pdf_viewer_context'
import { useTranslation } from 'react-i18next'
import { ToolbarButton } from './toolbar_button'
import { Button, DropdownMenu, Flex } from '@radix-ui/themes'

export const ZoomTool: React.FC = () => {
    const { t } = useTranslation('viewer', { useSuspense: false })
    const { pdfViewer } = usePdfViewerContext()
    const [currentScale, setCurrentScale] = useState<string>('auto')

    const zoomOptions = [
        { key: 'auto', label: t('viewer:zoom.auto'), value: 'auto' },
        { key: 'page-actual', label: t('viewer:zoom.actual'), value: 'page-actual' },
        { key: 'page-fit', label: t('viewer:zoom.fit'), value: 'page-fit' },
        { key: 'page-width', label: t('viewer:zoom.width'), value: 'page-width' },
        { key: '0.5', label: '50%', value: '0.5' },
        { key: '0.75', label: '75%', value: '0.75' },
        { key: '1', label: '100%', value: '1' },
        { key: '1.25', label: '125%', value: '1.25' },
        { key: '1.5', label: '150%', value: '1.5' },
        { key: '2', label: '200%', value: '2' },
        { key: '3', label: '300%', value: '3' },
        { key: '4', label: '400%', value: '4' }
    ]

    useEffect(() => {
        if (pdfViewer) {
            const scale = pdfViewer.currentScaleValue || 'auto'
            setCurrentScale(scale)
        }
    }, [pdfViewer])

    const getNumericScale = (scale: string): number | null => {
        if (['auto', 'page-actual', 'page-fit', 'page-width'].includes(scale)) {
            return null
        }
        const num = parseFloat(scale)
        return isNaN(num) ? null : num
    }

    const handleZoomChange = (newScale: string) => {
        setCurrentScale(newScale)
        if (pdfViewer) {
            pdfViewer.currentScaleValue = newScale
        }
    }

    const zoomIn = () => {
        let scale = getNumericScale(currentScale)
        if (scale === null) {
            scale = pdfViewer ? pdfViewer.currentScale : 1
        }
        const newScale = Math.min(scale + 0.1, 3)
        const rounded = Math.round(newScale * 100) / 100
        handleZoomChange(rounded.toString())
    }
    const zoomOut = () => {
        let scale = getNumericScale(currentScale)
        if (scale === null) {
            scale = pdfViewer ? pdfViewer.currentScale : 1
        }
        const newScale = Math.max(scale - 0.1, 0.2)
        const rounded = Math.round(newScale * 100) / 100
        handleZoomChange(rounded.toString())
    }

    const currentScaleLabel = (() => {
        const matchedOption = zoomOptions.find((opt) => opt.value === currentScale)
        if (matchedOption) {
            return matchedOption.label
        }
        const num = parseFloat(currentScale)
        if (!isNaN(num)) {
            return `${Math.round(num * 100)}%`
        }
        return t('viewer:zoom.auto')
    })()

    return (
        <Flex gap="3" align="center">
            <ToolbarButton
                buttonProps={{ size: '1' }}
                icon={
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M2.25 7.5C2.25 7.22386 2.47386 7 2.75 7H12.25C12.5261 7 12.75 7.22386 12.75 7.5C12.75 7.77614 12.5261 8 12.25 8H2.75C2.47386 8 2.25 7.77614 2.25 7.5Z"
                            fill="currentColor"
                            fillRule="evenodd"
                            clipRule="evenodd"
                        ></path>
                    </svg>
                }
                onClick={zoomOut}
            />
            <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    <Button variant="ghost" size="2" color="gray" style={{ width: 80 }}>
                        {currentScaleLabel}
                        <DropdownMenu.TriggerIcon />
                    </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                    {zoomOptions.map((option) => (
                        <DropdownMenu.Item key={option.key} onSelect={() => handleZoomChange(option.value)}>
                            {option.label}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Root>
            <ToolbarButton
                buttonProps={{ size: '1' }}
                icon={
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z"
                            fill="currentColor"
                            fillRule="evenodd"
                            clipRule="evenodd"
                        ></path>
                    </svg>
                }
                onClick={zoomIn}
            />
        </Flex>
    )
}
