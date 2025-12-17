import '@radix-ui/themes/styles.css'
import React, { useEffect, useMemo, useState } from 'react'
import { PdfViewerProvider } from '../../context/pdf_viewer_provider'
import { AnnotatorExtension } from '../../extensions/annotator'
import { SidebarToggle } from '@/components/sidebar_toggle'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { Toolbar } from '@/extensions/annotator/components/toolbar'
import { PdfAnnotatorProps } from '@/extensions/annotator/types/annotator'
import { defaultOptions as defaultAnnotatorOptions } from '@/extensions/annotator/const/default_options'
import { deepMerge, getThemeColor } from '@/utils'
import { OptionsContext } from '@/extensions/annotator/context/options_context'
import { PainterProvider, usePainter } from '@/extensions/annotator/context/painter_context'
import { Sidebar } from '@/extensions/annotator/components/sidebar'
import { exportAnnotationsToExcel, exportAnnotationsToPdf } from '@/extensions/annotator/painter/annot'
import { usePdfViewerContext } from '@/context/pdf_viewer_context'
import { Button, DropdownMenu, Separator, Theme } from '@radix-ui/themes'
import { AnnoIcon } from '@/extensions/annotator/const/icons'
import { AiOutlineSave } from 'react-icons/ai'

export const PdfAnnotator: React.FC<PdfAnnotatorProps> = ({
    theme = 'violet',
    title = 'PDF ANNOTATOR',
    url,
    locale = 'zh-CN',
    user = { id: 'null', name: 'unknown' },
    defaultOptions,
    initialScale,
    isSidebarCollapsed = false,
    enableNativeAnnotations = false,
    initialAnnotations = [],
    onSave,
    onLoad,
    onAnnotationAdded,
    onAnnotationDeleted,
    onAnnotationSelected,
    onAnnotationUpdated,
    layoutStyle,
    actions
}) => {
    const viewerOptions = useMemo(() => ({ textLayerMode: 1, annotationMode: 0, externalLinkTarget: 0 }), [])

    const { t } = useTranslation(['annotator', 'common'], { useSuspense: false })

    const mergedOptions = useMemo(() => {
        const result = deepMerge(defaultAnnotatorOptions, defaultOptions || {})
        return result
    }, [defaultOptions])

    const [getPrimaryColor, setGetPrimaryColor] = useState<string>(() => getThemeColor())

    useEffect(() => {
        const timer = setTimeout(() => {
            const color = getThemeColor()
            setGetPrimaryColor(color)
        }, 0)

        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        i18n.changeLanguage(locale)
    }, [locale])

    const SidebarTrigger: React.FC = () => {
        return <SidebarToggle title={t('annotator:sidebar.toggle')} icon={<AnnoIcon style={{ width: 18, height: 18 }} />} />
    }

    const ActionsButtons: React.FC = () => {
        const { painter } = usePainter()
        const { pdfViewer } = usePdfViewerContext()
        const handleSave = () => {
            if (painter) {
                const annotations = painter.getData()
                onSave?.(annotations)
            }
        }

        const handleExportToPdf = async (fileName?: string) => {
            if (painter && pdfViewer) {
                const annotations = painter.getData()
                await exportAnnotationsToPdf(pdfViewer, annotations, fileName)
            }
        }

        const handleExportToExcel = async (fileName?: string) => {
            if (painter && pdfViewer) {
                const annotations = painter.getData()
                await exportAnnotationsToExcel(pdfViewer, annotations, fileName)
            }
        }
        if (actions) {
            if (typeof actions === 'function') {
                const ExtraComponent = actions as React.ComponentType<any>
                return (
                    <ExtraComponent
                        save={handleSave}
                        getAnnotations={() => painter?.getData() || []}
                        exportToExcel={(fileName?: string) => {
                            handleExportToExcel(fileName)
                        }}
                        exportToPdf={(fileName?: string) => {
                            handleExportToPdf(fileName)
                        }}
                    />
                )
            }
            return React.cloneElement(actions as React.ReactElement, {
                save: handleSave,
                getAnnotations: () => painter?.getData() || [],
                exportToExcel: (fileName?: string) => {
                    handleExportToExcel(fileName)
                },
                exportToPdf: (fileName?: string) => {
                    handleExportToPdf(fileName)
                }
            })
        }

        // 默认的保存按钮
        return (
            <>
                <Separator orientation="vertical" />
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        <Button variant="soft">
                            {t('common:export')}
                            <DropdownMenu.TriggerIcon />
                        </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                        <DropdownMenu.Item onClick={() => handleExportToPdf()}>{t('common:export')} PDF</DropdownMenu.Item>
                        <DropdownMenu.Item onClick={() => handleExportToExcel()}>{t('common:export')} Excel</DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
                <Button onClick={handleSave}>
                    <AiOutlineSave />
                    {t('common:save')}
                </Button>
            </>
        )
    }

    return (
        <Theme accentColor={theme}>
            <PainterProvider>
                <OptionsContext.Provider
                    value={{
                        defaultOptions: mergedOptions,
                        primaryColor: getPrimaryColor
                    }}
                >
                    <PdfViewerProvider
                        title={title}
                        isSidebarCollapsed={isSidebarCollapsed}
                        url={url}
                        initialScale={initialScale}
                        user={user}
                        {...viewerOptions}
                        toolbar={<Toolbar defaultAnnotationName="" />}
                        sidebar={<Sidebar />}
                        sidebarTrigger={<SidebarTrigger />}
                        actions={<ActionsButtons />}
                        style={layoutStyle}
                    >
                        <AnnotatorExtension
                            onLoad={() => {
                                onLoad?.()
                            }}
                            onAnnotationAdd={(annotation) => {
                                onAnnotationAdded?.(annotation)
                            }}
                            onAnnotationDelete={(id) => {
                                onAnnotationDeleted?.(id)
                            }}
                            onAnnotationSelected={(annotation, isClick) => {
                                onAnnotationSelected?.(annotation, isClick)
                            }}
                            onAnnotationChanged={(annotation) => {
                                onAnnotationUpdated?.(annotation)
                            }}
                            enableNativeAnnotations={enableNativeAnnotations}
                            annotations={initialAnnotations}
                        />
                    </PdfViewerProvider>
                </OptionsContext.Provider>
            </PainterProvider>
        </Theme>
    )
}
