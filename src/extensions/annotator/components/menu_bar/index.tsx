
import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react'
import { IAnnotationStore, IAnnotationStyle, annotationDefinitions } from '../../const/definitions'
import { AnnoIcon, DeleteIcon, PaletteSingleColorIcon } from '../../const/icons'
import Konva from 'konva'
import { useTranslation } from 'react-i18next'
import { useOptionsContext } from '../../context/options_context'
import { PopoverBar, PopoverBarProps, PopoverBarRef } from '@/components/popover_bar'
import { IRect } from 'konva/lib/types'
import { PAINTER_WRAPPER_PREFIX } from '../../painter/const'
import { usePainter } from '../../context/painter_context'
import { usePdfViewerContext } from '@/context/pdf_viewer_context'
import { SelectionSource, useAnnotationStore } from '../../store'
import { Box, Flex, Separator, Slider, Text } from '@radix-ui/themes'
import { ColorPicker } from '@/components/color_picker';

interface MenuBarProps {
    popoverBarProps?: Omit<PopoverBarProps, 'renderButtons' | 'buttons'>
}

export interface MenuBarRef {
    open(annotation: IAnnotationStore, selectorRect: IRect): void
    close(): void
}

function getKonvaShapeForString(konvaString: string) {
    const ghostGroup = Konva.Node.create(konvaString) // 根据序列化字符串创建 Konva.Group 对象
    return ghostGroup.children[0]
}

/**
 * @description MenuBar
 */
const MenuBar = forwardRef<MenuBarRef, MenuBarProps>(function MenuBar(props, ref) {
    const { t } = useTranslation(['common', 'annotator'], { useSuspense: false })
    const { setSidebarCollapsed, isSidebarCollapsed } = usePdfViewerContext()

    const { painter } = usePainter()
    const { defaultOptions } = useOptionsContext()
    const { popoverBarProps = {} } = props

    const popoverBarRef = useRef<PopoverBarRef>(null)
    const [currentAnnotation, setCurrentAnnotation] = useState<IAnnotationStore | null>(null)
    const [strokeWidth, setStrokeWidth] = useState<number | null>(2)
    const [opacity, setOpacity] = useState<number | null>(1)
    const [showStyle, setShowStyle] = useState(false)

    // 保存当前的 selectorRect 以便重新定位
    const selectorRectRef = useRef<IRect | null>(null)

    // 计算 PopoverBar 的位置
    const calculateAndSetPosition = (annotation: IAnnotationStore, selectorRect: IRect) => {
        const wrapperId = `${PAINTER_WRAPPER_PREFIX}_page_${annotation.pageNumber}`
        const konvaContainer = document.querySelector(`#${wrapperId} .konvajs-content`) as HTMLElement
        if (konvaContainer) {
            const containerRect = konvaContainer.getBoundingClientRect()
            const realX = selectorRect.x + containerRect.left
            const realY = selectorRect.y + containerRect.top

            const domRect = {
                x: realX,
                y: realY,
                width: selectorRect.width,
                height: selectorRect.height,
                top: realY,
                left: realX,
                right: realX + selectorRect.width,
                bottom: realY + selectorRect.height,
                toJSON: () => ({})
            } as DOMRect

            popoverBarRef.current?.openWithRect(domRect)
        }
    }

    // 当 showStyle 改变时，重新计算 PopoverBar 的位置
    useEffect(() => {
        if (showStyle && currentAnnotation && selectorRectRef.current) {
            // 延迟一小段时间确保 DOM 已经更新后再重新定位
            setTimeout(() => {
                calculateAndSetPosition(currentAnnotation, selectorRectRef.current!)
            }, 0)
        }
    }, [showStyle, currentAnnotation])

    useImperativeHandle(ref, () => ({
        open: (annotation: IAnnotationStore, selectorRect: IRect) => {
            setCurrentAnnotation(annotation)
            selectorRectRef.current = selectorRect
            const currentShape = getKonvaShapeForString(annotation.konvaString)
            setStrokeWidth(currentShape.strokeWidth())
            setOpacity(currentShape.opacity() * 100)
            // 计算实际位置
            calculateAndSetPosition(annotation, selectorRect)
        },
        close: () => {
            popoverBarRef.current?.close()
            setCurrentAnnotation(null)
            setShowStyle(false)
            selectorRectRef.current = null
        }
    }))

    const isStyleSupported = currentAnnotation && annotationDefinitions.find((item) => item.type === currentAnnotation.type)?.styleEditable

    const handleAnnotationStyleChange = (style: IAnnotationStyle) => {
        if (!currentAnnotation) return
        painter?.updateAnnotationStyle(currentAnnotation, style)
    }

    const handleAnnotationDelete = () => {
        if (!currentAnnotation) return
        painter?.delete(currentAnnotation.id, true)
    }

    const handleOpenComment = (annotation: IAnnotationStore) => {
        setSidebarCollapsed(false)
        useAnnotationStore.getState().setSelectedAnnotation(null)
        setTimeout(() => {
            useAnnotationStore.getState().setSelectedAnnotation(annotation, SelectionSource.CANVAS)
        }, 100)
    }

    return (
        <PopoverBar
            ref={popoverBarRef}
            renderButtons={() => {
                if (currentAnnotation) {
                    return [
                        ...(isSidebarCollapsed
                            ? [
                                  {
                                      key: 'comment',
                                      icon: <AnnoIcon style={{ color: '#000000d6' }} />,
                                      onClick: () => {
                                          handleOpenComment(currentAnnotation)
                                          popoverBarRef.current?.close()
                                      },
                                      title: t('comment')
                                  }
                              ]
                            : []),
                        ...(isStyleSupported
                            ? [
                                  {
                                      key: 'palette',
                                      icon: <PaletteSingleColorIcon style={{ color: '#000000d6' }} />,
                                      onClick: () => {
                                          setShowStyle(!showStyle)
                                      },
                                      title: t('color')
                                  }
                              ]
                            : []),
                        {
                            key: 'delete',
                            icon: <DeleteIcon style={{ color: '#000000d6' }} />,
                            onClick: () => {
                                handleAnnotationDelete()
                                popoverBarRef.current?.close()
                            },
                            title: t('delete')
                        }
                    ]
                }

                return []
            }}
            {...popoverBarProps}
        >
            {showStyle && currentAnnotation && isStyleSupported && (
                <div style={{margin: 8}}>
                    {isStyleSupported?.color && (
                        <ColorPicker
                            value={currentAnnotation!.color!}
                            onChange={(color) => { 
                                handleAnnotationStyleChange({ color })
                            }}
                            popover={false}
                            custom={false}
                            presets={defaultOptions!.colors!}
                        />
                    )}
                    {(isStyleSupported?.opacity || isStyleSupported?.strokeWidth) && (
                        <>
                            <Separator my="3" size="4" />
                            <Box style={{ margin: 8 }}>
                                <Flex gap="3" direction="column">
                                    {isStyleSupported.strokeWidth && (
                                        <>
                                            <Text as="div" size="2" weight="bold">
                                                {t('strokeWidth')} ({strokeWidth})
                                            </Text>
                                            <Slider
                                                variant="soft"
                                                size="1"
                                                min={1}
                                                max={20}
                                                defaultValue={[strokeWidth || 1]}
                                                onValueChange={(value) => {
                                                    handleAnnotationStyleChange({ strokeWidth: value[0] })
                                                    setStrokeWidth(value[0])
                                                }}
                                            />
                                        </>
                                    )}
                                    {isStyleSupported.opacity && (
                                        <>
                                            <Text as="div" size="2" weight="bold">
                                                {t('opacity')} ({opacity}%)
                                            </Text>
                                            <Slider
                                                variant="soft"
                                                size="1"
                                                min={1}
                                                max={100}
                                                defaultValue={[opacity || 100]}
                                                onValueChange={(value) => {
                                                    handleAnnotationStyleChange({ opacity: value[0] / 100 })
                                                    setOpacity(value[0])
                                                }}
                                            />
                                        </>
                                    )}
                                </Flex>
                            </Box>
                        </>
                    )}
                </div>
            )}
        </PopoverBar>
    )
})

export { MenuBar }
