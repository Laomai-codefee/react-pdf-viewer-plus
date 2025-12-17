import styles from './stamp.module.scss'
import Konva from 'konva'
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { IAnnotationType } from '../../const/definitions'
import { useTranslation } from 'react-i18next'
import { formatFileSize } from '../../utils/utils'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { useUserContext } from '@/context/user_context'
import { ToolbarButton } from '@/components/toolbar_button'
import { useOptionsContext } from '../../context/options_context'
import {
    Button,
    Callout,
    Dialog,
    Flex,
    Text,
    Popover,
    SegmentedControl,
    Separator,
    TextField,
    Grid,
    CheckboxGroup,
    Select
} from '@radix-ui/themes'
import { AiOutlineBold, AiOutlineExclamationCircle, AiOutlineImport, AiOutlineItalic, AiOutlinePlusCircle, AiOutlineStrikethrough, AiOutlineUnderline } from 'react-icons/ai'
import { ColorPicker } from '@/components/color_picker'
dayjs.extend(customParseFormat)

interface SignatureToolProps {
    annotation: IAnnotationType
    default_stamps?: string[]
    onAdd: (signatureDataUrl: string) => void
}

type FieldType = {
    stampText: string
    fontStyle: string[]
    fontFamily: string
    textColor: string
    backgroundColor: string
    borderColor: string
    borderStyle: 'solid' | 'dashed' | 'none'
    timestamp: string[]
    customTimestampText: string
    dateFormat: string
}

const SHAPE_NAME = 'StampGroup'
const STAMP_WIDTH = 470
const STAMP_HEIGHT = 120

const DATE_FORMAT_OPTIONS = [
    {
        label: '📅',
        options: [
            { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
            { label: 'YYYY/MM/DD', value: 'YYYY/MM/DD' },
            { label: 'YYYY年MM月DD日', value: 'YYYY年MM月DD日' },
            { label: 'DD-MM-YYYY', value: 'DD-MM-YYYY' },
            { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
            { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
            { label: 'dddd, MMMM D, YYYY', value: 'dddd, MMMM D, YYYY' }, // 星期几 + 全月份
            { label: 'MMM D, YYYY', value: 'MMM D, YYYY' }, // Jan 1, 2025
            { label: 'D MMMM YYYY', value: 'D MMMM YYYY' } // 1 January 2025
        ]
    },
    {
        label: '⏰',
        options: [
            { label: 'HH:mm:ss', value: 'HH:mm:ss' },
            { label: 'HH:mm', value: 'HH:mm' },
            { label: 'hh:mm A', value: 'hh:mm A' }, // 12小时制带AM/PM
            { label: 'h:mm A', value: 'h:mm A' },
            { label: 'HH:mm:ss.SSS', value: 'HH:mm:ss.SSS' }
        ]
    },
    {
        label: '🗓️ ',
        options: [
            { label: 'YYYY-MM-DD HH:mm:ss', value: 'YYYY-MM-DD HH:mm:ss' },
            { label: 'YYYY-MM-DD HH:mm', value: 'YYYY-MM-DD HH:mm' },
            { label: 'DD/MM/YYYY HH:mm', value: 'DD/MM/YYYY HH:mm' },
            { label: 'MM/DD/YYYY hh:mm A', value: 'MM/DD/YYYY hh:mm A' },
            { label: 'YYYY年MM月DD日 HH:mm', value: 'YYYY年MM月DD日 HH:mm' },
            { label: 'dddd, MMMM D, YYYY HH:mm', value: 'dddd, MMMM D, YYYY HH:mm' },
            { label: 'D MMMM YYYY HH:mm', value: 'D MMMM YYYY HH:mm' }
        ]
    }
]

const StampTool: React.FC<SignatureToolProps> = ({ annotation, default_stamps, onAdd }) => {
    const { defaultOptions } = useOptionsContext()

    const maxSize = defaultOptions.stamp!.maxSize!
    const stampAccept = defaultOptions.stamp!.accept!
    const maxUploadImageSize = 600
    const defaultFontList = defaultOptions.stamp!.editor!.defaultFont!
    const defaultTextColor = defaultOptions.stamp!.editor!.defaultTextColor!
    const defaultBorderStyle = defaultOptions.stamp!.editor!.defaultBorderStyle!
    const defaultBackgroundColor = defaultOptions.stamp!.editor!.defaultBackgroundColor!
    const defaultBorderColor = defaultOptions.stamp!.editor!.defaultBorderColor!
    const colors = defaultOptions.colors!

    const { t } = useTranslation(['common', 'annotator'])
    const containerRef = useRef<HTMLDivElement>(null)
    const konvaStageRef = useRef<Konva.Stage | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)
    const { user } = useUserContext()

    const [customStamps, setCustomStamps] = useState<string[]>([])

    const defaultStamps = useMemo(() => {
        if (default_stamps) {
            return default_stamps
        }
        return defaultOptions.stamp!.defaultStamp!
    }, [default_stamps])

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [stampType, setStampType] = useState<string>(defaultStamps.length === 0 ? "custom" : "default")

    // 创建表单状态
    const [formValues, setFormValues] = useState<FieldType>({
        stampText: t('annotator:editor.stamp.defaultText'),
        fontStyle: [],
        fontFamily: defaultFontList[0].value,
        textColor: defaultTextColor,
        backgroundColor: defaultBackgroundColor,
        borderColor: defaultBorderColor,
        borderStyle: defaultBorderStyle,
        timestamp: ['username', 'date'],
        customTimestampText: '',
        dateFormat: 'YYYY-MM-DD'
    })

    useLayoutEffect(() => {
        setFormValues((prev) => ({
            ...prev,
            stampText: t('annotator:editor.stamp.defaultText')
        }))
    }, [t])

    const [lastFormValues, setLastFormValues] = useState<FieldType | null>(null)

    const handleAdd = (dataUrl: string) => {
        onAdd(dataUrl)
    }

    const handleOk = () => {
        const layer = konvaStageRef.current?.getLayers()[0]
        if (!layer) return

        const shape = layer.getChildren((node) => node.name() === SHAPE_NAME)[0]
        if (!shape) return

        const dataUrl = konvaStageRef.current?.toDataURL({
            x: shape.x(),
            y: shape.y(),
            width: shape.width(),
            height: shape.height()
        })

        if (dataUrl) {
            setCustomStamps((prev) => [...prev, dataUrl])
            handleAdd(dataUrl)
            setIsModalOpen(false)
        }
    }

    // 文件输入变化的事件处理函数
    const onInputFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const target = event.target as HTMLInputElement
        const files = target.files

        if (!files?.length) return
        const _file = files[0]

        // 检查文件大小
        if (_file.size > maxSize) {
            // message.warning(t('fileSizeLimit', { value: formatFileSize(maxSize) }))
            alert(t('fileSizeLimit', { value: formatFileSize(maxSize) }))
            if (target) {
                target.value = ''
            }
            return
        }

        const reader = new FileReader()

        reader.onload = async (e) => {
            const imageUrl = e.target?.result as string
            const img = new Image()
            img.src = imageUrl

            img.onload = () => {
                // 设置最大宽高
                const MAX_WIDTH = maxUploadImageSize
                const MAX_HEIGHT = maxUploadImageSize

                let { width, height } = img

                // 等比缩放
                if (width > height && width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width)
                    width = MAX_WIDTH
                } else if (height > MAX_HEIGHT) {
                    width = Math.round((width * MAX_HEIGHT) / height)
                    height = MAX_HEIGHT
                }

                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')

                canvas.width = width
                canvas.height = height

                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height)

                    // 转换为 PNG Data URL
                    const pngDataUrl = canvas.toDataURL('image/png')

                    // 清空 input 的值，以便重复上传同一文件
                    target.value = ''

                    // 调用回调并更新状态
                    // onAdd(pngDataUrl)
                    setCustomStamps((prev) => [...prev, pngDataUrl])
                }
            }
        }

        reader.readAsDataURL(_file)
    }

    // 处理表单字段变化
    const handleFieldChange = (field: keyof FieldType, value: any) => {
        const newFormValues = {
            ...formValues,
            [field]: value
        }

        setFormValues(newFormValues)
        setLastFormValues(newFormValues)
        initializeKonvaStage(newFormValues)
    }

    const initializeKonvaStage = (values: FieldType) => {
        if (!containerRef.current) return

        const { stampText, fontStyle, textColor, backgroundColor, borderColor, borderStyle, timestamp, dateFormat, fontFamily } = values

        // 清除旧 stage
        konvaStageRef.current?.destroy()

        const stage = new Konva.Stage({
            container: containerRef.current,
            width: STAMP_WIDTH,
            height: STAMP_HEIGHT
        })

        const layer = new Konva.Layer()

        const fontStyleParts: string[] = []
        if (fontStyle.includes('italic')) fontStyleParts.push('italic')
        if (fontStyle.includes('bold')) fontStyleParts.push('bold')
        const fontStyleValue = fontStyleParts.join(' ') || 'normal'
        const isUnderline = fontStyle.includes('underline')
        const isStrikeout = fontStyle.includes('strikeout')
        const now = dayjs()
        const username = user?.name
        // 使用用户选择的格式来格式化日期
        const formattedDate = dateFormat ? now.format(dateFormat) : ''
        const customText = values.customTimestampText?.trim()
        const timestampParts = [
            timestamp.includes('username') ? username : null,
            timestamp.includes('date') ? formattedDate : null,
            customText || null
        ].filter(Boolean)
        const timestampText = timestampParts.join(' · ')
        let textFontSize = 30
        const timeFontSize = 16
        const spacing = 10

        // 用临时文本节点计算宽度
        const tempTextNode = new Konva.Text({
            text: stampText,
            fontSize: textFontSize,
            fontStyle: fontStyleValue,
            fontFamily: fontFamily
        })

        const tempTimestampNode = new Konva.Text({
            text: timestampText,
            fontSize: timeFontSize,
            fontFamily: fontFamily
        })

        const contentWidth = Math.max(tempTextNode.width(), tempTimestampNode.width()) + 60
        const contentHeight = textFontSize + spacing + timeFontSize + 25

        const shapeWidth = Math.max(contentWidth, 180)
        const shapeHeight = Math.max(contentHeight, 60)

        const shape = new Konva.Rect({
            name: SHAPE_NAME,
            width: shapeWidth,
            height: shapeHeight,
            x: (STAMP_WIDTH - shapeWidth) / 2,
            y: (STAMP_HEIGHT - shapeHeight) / 2,
            fill: backgroundColor,
            strokeWidth: borderStyle === 'none' ? 0 : 5,
            stroke: borderColor,
            dash: borderStyle === 'dashed' ? [5, 5] : undefined,
            cornerRadius: 10
        })
        layer.add(shape)
        if (!timestampText) {
            textFontSize = textFontSize * 1.2 // 没有时间戳时字体更大
        }

        // 计算 stampText 的 Y 位置
        let textY: number

        if (timestampText) {
            // 有时间戳：保持原来的位置，靠近顶部
            textY = (STAMP_HEIGHT - shapeHeight) / 2 + 15
        } else {
            // 没有时间戳：stampText 居中显示在 shape 中
            textY = (STAMP_HEIGHT - shapeHeight) / 2 + shapeHeight / 2 - textFontSize / 2
        }

        const stampTextNode = new Konva.Text({
            text: stampText,
            x: 0,
            y: textY,
            width: STAMP_WIDTH,
            align: 'center',
            fontSize: textFontSize,
            fontStyle: fontStyleValue,
            fontFamily: fontFamily,
            fill: textColor
        })

        layer.add(stampTextNode)

        if (isUnderline) {
            const underlineY = stampTextNode.y() + textFontSize + 4
            const underline = new Konva.Line({
                points: [shape.x(), underlineY, shape.x() + shape.width(), underlineY],
                stroke: textColor,
                strokeWidth: 2
            })
            layer.add(underline)
        }

        if (isStrikeout) {
            const strikeoutLineY = stampTextNode.y() + textFontSize / 2
            const strikeoutLine = new Konva.Line({
                points: [shape.x(), strikeoutLineY, shape.x() + shape.width(), strikeoutLineY],
                stroke: textColor,
                strokeWidth: 2
            })
            layer.add(strikeoutLine)
        }

        const timestampNode = new Konva.Text({
            text: timestampText,
            x: 0,
            y: textY + textFontSize + spacing,
            width: STAMP_WIDTH,
            align: 'center',
            fontSize: timeFontSize,
            fontFamily: fontFamily,
            fill: textColor
        })
        if (timestampText) {
            layer.add(timestampNode)
        }
        stage.add(layer)
        konvaStageRef.current = stage
    }

    const destroyKonvaStage = () => {
        const stage = konvaStageRef.current
        if (stage) {
            stage.destroy()
            konvaStageRef.current = null
        }
    }

    useLayoutEffect(() => {
        if (isModalOpen) {
            const rafId = requestAnimationFrame(() => {
                if (containerRef.current) {
                    const initialValues = lastFormValues || formValues
                    initializeKonvaStage(initialValues)
                }
            })
            return () => cancelAnimationFrame(rafId)
        } else {
            destroyKonvaStage()
        }
    }, [isModalOpen])

    return (
        <>
            <Popover.Root>
                <Popover.Trigger>
                    <ToolbarButton title={t(`annotator:tool.${annotation.name}`)} icon={annotation.icon} />
                </Popover.Trigger>
                <Popover.Content
                    size="1"
                    onCloseAutoFocus={(event) => {
                        event.preventDefault()
                        setStampType(defaultStamps.length === 0 ? "custom" : "default")
                    }}
                >
                    <div className={styles.StampPop}>
                        <Flex align="center" justify="center" mb="4">
                            <SegmentedControl.Root
                                radius="full"
                                defaultValue={defaultStamps.length === 0 ? "custom" : "default"}
                                onValueChange={(e) => setStampType(e)}
                            >
                                {defaultStamps.length === 0 ? (
                                    <>
                                        <SegmentedControl.Item value="custom">{t('custom')}</SegmentedControl.Item>
                                        <SegmentedControl.Item value="default">{t('default')}</SegmentedControl.Item>
                                    </>
                                ) : (
                                    <>
                                        <SegmentedControl.Item value="default">{t('default')}</SegmentedControl.Item>
                                        <SegmentedControl.Item value="custom">{t('custom')}</SegmentedControl.Item>
                                    </>
                                )}
                            </SegmentedControl.Root>
                        </Flex>
                        {stampType === 'default' && (
                            <>
                                {defaultStamps.length === 0 && (
                                    <Flex align="center" justify="center" gap="2">
                                        <Callout.Root variant="soft" color="gray" size="1" style={{ width: '100%' }}>
                                            <Callout.Icon>
                                                <AiOutlineExclamationCircle />
                                            </Callout.Icon>
                                            <Callout.Text>{t('annotator:editor.stamp.defaultStampNotSet')}</Callout.Text>
                                        </Callout.Root>
                                    </Flex>
                                )}
                                <ul className={styles.container}>
                                    {defaultStamps.map((s, idx) => (
                                        <Popover.Close key={idx}>
                                            <li key={idx} onClick={() => handleAdd(s)}>
                                                <img src={s} />
                                            </li>
                                        </Popover.Close>
                                    ))}
                                </ul>
                            </>
                        )}
                        <div>
                            {stampType === 'custom' && (
                                <>
                                    <ul className={styles.container}>
                                        {customStamps.map((s, idx) => (
                                            <Popover.Close key={idx}>
                                                <li key={idx} onClick={() => handleAdd(s)}>
                                                    <img src={s} />
                                                </li>
                                            </Popover.Close>
                                        ))}
                                    </ul>
                                    <Flex gap="4" p="1">
                                        <Popover.Close>
                                            <Button
                                                variant="soft"
                                                style={{ width: '100%' }}
                                                onClick={() => {
                                                    setIsModalOpen(true)
                                                }}
                                            >
                                                <AiOutlinePlusCircle /> {t('annotator:common.createStamp')}
                                            </Button>
                                        </Popover.Close>
                                    </Flex>

                                    <Separator my="3" size="4" />
                                    <input style={{ display: 'none' }} type="file" ref={fileRef} accept={stampAccept} onChange={onInputFileChange} />
                                    <Flex gap="2" justify="end">
                                        <Button
                                            variant="ghost"
                                            mr="3"
                                            onClick={() => {
                                                fileRef.current?.click()
                                            }}
                                        >
                                            <AiOutlineImport />
                                            {t('annotator:editor.stamp.upload')}
                                        </Button>
                                    </Flex>
                                </>
                            )}
                        </div>
                    </div>
                </Popover.Content>
            </Popover.Root>

            <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
                <Dialog.Description></Dialog.Description>
                <Dialog.Content style={{ width: '550px' }}>
                    <Dialog.Title>{t('annotator:common.createStamp')}</Dialog.Title>
                    <div className={styles.StampTool}>
                        <div className={styles.container}>
                            <div
                                className={styles.imagePreview}
                                ref={containerRef}
                                style={{
                                    height: STAMP_HEIGHT
                                }}
                            />

                            <Grid align="center" columns="22" gap="5" mt="3">
                                <Flex direction="column" gridColumn="span 22">
                                    <Text as="label" size="2">
                                        {t('annotator:editor.stamp.stampText')}
                                        <TextField.Root value={formValues.stampText} onChange={(e) => handleFieldChange('stampText', e.target.value)} />
                                    </Text>
                                </Flex>
                                <Flex direction="column" gridColumn="span 9">
                                    <Text size="2">{t('annotator:editor.stamp.textColor')}</Text>
                                    <div className={styles.formItem}>
                                        <ColorPicker
                                            transparent={true}
                                            value={formValues.textColor}
                                            onChange={(color) => handleFieldChange('textColor', color)}
                                            presets={colors}
                                            popover={true}
                                        />
                                    </div>
                                </Flex>

                                <Flex direction="column" gridColumn="span 8">
                                    <Text size="2">{t('annotator:editor.stamp.backgroundColor')}</Text>
                                    <div className={styles.formItem}>
                                        <ColorPicker
                                            value={formValues.backgroundColor}
                                            onChange={(color) => handleFieldChange('backgroundColor', color)}
                                            presets={colors}
                                            popover={true}
                                            transparent={true}
                                        />
                                    </div>
                                </Flex>

                                <Flex direction="column" gridColumn="span 5">
                                    <Text size="2">{t('annotator:editor.stamp.borderColor')}</Text>
                                    <div className={styles.formItem}>
                                        <ColorPicker
                                            value={formValues.borderColor}
                                            onChange={(color) => handleFieldChange('borderColor', color)}
                                            presets={colors}
                                            transparent={true}
                                            popover={true}
                                        />
                                    </div>
                                </Flex>

                                <Flex direction="column" gridColumn="span 9">
                                    <Text size="2">{t('annotator:editor.stamp.fontStyle')}</Text>
                                    <div className={styles.formItem}>
                                        <CheckboxGroup.Root
                                            value={formValues.fontStyle}
                                            onValueChange={(values) => handleFieldChange('fontStyle', values)}
                                        >
                                            <Flex direction="row" gap="2">
                                                <CheckboxGroup.Item value="bold">
                                                    <AiOutlineBold />
                                                </CheckboxGroup.Item>
                                                <CheckboxGroup.Item value="italic">
                                                    <AiOutlineItalic />
                                                </CheckboxGroup.Item>
                                                <CheckboxGroup.Item value="underline">
                                                    <AiOutlineUnderline />
                                                </CheckboxGroup.Item>
                                                <CheckboxGroup.Item value="strikeout">
                                                    <AiOutlineStrikethrough />
                                                </CheckboxGroup.Item>
                                            </Flex>
                                        </CheckboxGroup.Root>
                                    </div>
                                </Flex>

                                <Flex direction="column" gridColumn="span 8">
                                    <Text size="2">{t('annotator:editor.stamp.fontFamily')}</Text>
                                    <div className={styles.formItem}>
                                        <Select.Root value={formValues.fontFamily} onValueChange={(value) => handleFieldChange('fontFamily', value)}>
                                            <Select.Trigger />
                                            <Select.Content>
                                                {defaultFontList.map((item) => (
                                                    <Select.Item key={item.value} value={item.value}>
                                                        {item.label}
                                                    </Select.Item>
                                                ))}
                                            </Select.Content>
                                        </Select.Root>
                                    </div>
                                </Flex>
                                <Flex direction="column" gridColumn="span 5">
                                    <Text size="2">{t('annotator:editor.stamp.borderStyle')}</Text>
                                    <div className={styles.formItem}>
                                        <Select.Root
                                            value={formValues.borderStyle}
                                            onValueChange={(value) => handleFieldChange('borderStyle', value)}
                                        >
                                            <Select.Trigger />
                                            <Select.Content>
                                                <Select.Item value="none">{t('annotator:editor.stamp.none')}</Select.Item>
                                                <Select.Item value="solid">{t('annotator:editor.stamp.solid')}</Select.Item>
                                                <Select.Item value="dashed">{t('annotator:editor.stamp.dashed')}</Select.Item>
                                            </Select.Content>
                                        </Select.Root>
                                    </div>
                                </Flex>
                            </Grid>
                            <Separator my="3" size="4" />
                            <Grid align="center" columns="2" gap="3">
                                <Flex direction="column">
                                    <Text size="2">{t('annotator:editor.stamp.timestampText')}</Text>
                                    <div className={styles.formItem}>
                                        <CheckboxGroup.Root
                                            value={formValues.timestamp}
                                            onValueChange={(values) => handleFieldChange('timestamp', values)}
                                        >
                                            <Flex direction="row" gap="2">
                                                <CheckboxGroup.Item value="username">{t('annotator:editor.stamp.username')}</CheckboxGroup.Item>
                                                <CheckboxGroup.Item value="date">{t('annotator:editor.stamp.date')}</CheckboxGroup.Item>
                                            </Flex>
                                        </CheckboxGroup.Root>
                                    </div>
                                </Flex>
                                <Flex direction="column">
                                    <Text size="2">{t('annotator:editor.stamp.dateFormat')}</Text>
                                    <div className={styles.formItem}>
                                        <Select.Root value={formValues.dateFormat} onValueChange={(value) => handleFieldChange('dateFormat', value)}>
                                            <Select.Trigger />
                                            <Select.Content>
                                                {DATE_FORMAT_OPTIONS?.map((item) => (
                                                    <Select.Group key={item.label}>
                                                        <Select.Label>{item.label}</Select.Label>
                                                        {item.options.map((option) => (
                                                            <Select.Item key={option.value} value={option.value}>
                                                                {option.label}
                                                            </Select.Item>
                                                        ))}
                                                    </Select.Group>
                                                ))}
                                            </Select.Content>
                                        </Select.Root>
                                    </div>
                                </Flex>
                            </Grid>
                            <Grid align="center" columns="1" gap="3" mt="3">
                                <Text as="label" size="2">
                                    {t('annotator:editor.stamp.customTimestamp')}
                                    <TextField.Root
                                        value={formValues.customTimestampText}
                                        onChange={(e) => handleFieldChange('customTimestampText', e.target.value)}
                                    />
                                </Text>
                            </Grid>
                            <Flex gap="3" mt="4" justify="end">
                                <Dialog.Close>
                                    <Button style={{ width: 100 }} variant="soft" color="gray">
                                        {t('cancel')}
                                    </Button>
                                </Dialog.Close>
                                <Dialog.Close>
                                    <Button style={{ width: 100 }} onClick={handleOk}>
                                        {t('ok')}
                                    </Button>
                                </Dialog.Close>
                            </Flex>
                        </div>
                        <div className="StampTool-Toolbar"></div>
                    </div>
                </Dialog.Content>
            </Dialog.Root>
        </>
    )
}

export { StampTool }
