import styles from './signature.module.scss';
import Konva from 'konva'
import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { IAnnotationType } from '../../const/definitions'
import { useTranslation } from 'react-i18next'
import { formatFileSize } from '../../utils/utils'
import { loadFontWithFontFace } from '../../utils/fontLoader'
import { ToolbarButton } from '@/components/toolbar_button'
import { useOptionsContext } from '../../context/options_context'
import { Button, Callout, Dialog, Flex, Popover, SegmentedControl, Select, Text } from '@radix-ui/themes'
import { AiOutlineImport, AiOutlinePlusCircle } from 'react-icons/ai';

interface SignatureToolProps {
    annotation: IAnnotationType
    default_signatures?: string[]
    onAdd: (signatureDataUrl: string) => void
}

const BASE_FONT_SIZE = 80

const SignatureTool: React.FC<SignatureToolProps> = ({ annotation, onAdd, default_signatures }) => {
    const { defaultOptions } = useOptionsContext()

    const signatureColors = defaultOptions.signature!.colors!
    const signatureWidth = 420
    const signatureHeight = 200
    const signatureTypeDefault = defaultOptions.signature!.type!
    const signatureMaxSize = defaultOptions.signature!.maxSize!
    const signatureAccept = defaultOptions.signature!.accept!
    const maxUploadImageSize = 600
    const handwritingFontList = defaultOptions.signature!.defaultFont!

    const { t } = useTranslation(['common', 'annotator'], { useSuspense: false })
    const containerRef = useRef<HTMLDivElement>(null)
    const konvaStageRef = useRef<Konva.Stage | null>(null)
    const colorRef = useRef(signatureColors[0])

    const fileRef = useRef<HTMLInputElement>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentColor, setCurrentColor] = useState(colorRef.current)
    const [isOKButtonDisabled, setIsOKButtonDisabled] = useState(true)
    const [signatures, setSignatures] = useState<string[]>([])
    const [signatureType, setSignatureType] = useState<string | null>(null)
    const [typedSignature, setTypedSignature] = useState('')
    const [fontFamily, setFontFamily] = useState<string>(handwritingFontList[0]?.value || 'Arial')

    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
    const [showFileSizeWarning, setShowFileSizeWarning] = useState(false)

    const defaultSignatures = useMemo(() => {
        if (default_signatures) {
            return default_signatures
        }
        return defaultOptions.signature!.defaultSignature!
    }, [default_signatures])

    const maxSize: number = signatureMaxSize

    useEffect(() => {
        colorRef.current = currentColor
    }, [currentColor])

    const handleAdd = (signature: string) => {
        onAdd(signature)
    }

    const loadFont = async (fontValue: string) => {
        const fontItem = handwritingFontList.find(item => item.value === fontValue);
        if (fontItem && fontItem.external) {
            await loadFontWithFontFace(fontItem)
        }
        setFontFamily(fontValue)
    }

    const generateTypedSignatureImage = (): string | null => {
        if (!typedSignature.trim()) return null

        const canvas = document.createElement('canvas')
        canvas.width = signatureWidth / 1.1
        canvas.height = signatureHeight
        const ctx = canvas.getContext('2d')

        if (!ctx) return null

        const padding = 20
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.font = `${BASE_FONT_SIZE}px "${fontFamily}", cursive, sans-serif`

        let textWidth = ctx.measureText(typedSignature).width
        const scale = textWidth + padding * 2 > canvas.width ? (canvas.width - padding * 2) / textWidth : 1
        ctx.font = `${BASE_FONT_SIZE * scale}px "${fontFamily}", cursive, sans-serif`

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.imageSmoothingEnabled = true
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
        ctx.shadowBlur = 2
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1
        ctx.fillStyle = currentColor
        ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2)

        return canvas.toDataURL('image/png')
    }

    const handleOk = () => {
        if (signatureType === 'Upload') {
            if (uploadedImageUrl) {
                setSignatures(prev => [...prev, uploadedImageUrl])
                handleAdd(uploadedImageUrl)
                setIsModalOpen(false)
            }
            return
        }
        if (signatureType === 'Enter') {
            const dataUrl = generateTypedSignatureImage()
            if (dataUrl) {
                setSignatures(prev => [...prev, dataUrl])
                handleAdd(dataUrl)
                setIsModalOpen(false)
            }
            return
        }
        if (signatureType === 'Draw') {
            const dataUrl = konvaStageRef.current?.toDataURL()
            if (dataUrl) {
                setSignatures(prev => [...prev, dataUrl])
                handleAdd(dataUrl)
                setIsModalOpen(false)
            }
            return
        }
    }

    const handleClear = () => {
        const stage = konvaStageRef.current
        if (stage) {
            stage.clear()
            stage.getLayers().forEach(layer => layer.destroyChildren())
            setIsOKButtonDisabled(true)
        }
        setTypedSignature('')
        setUploadedImageUrl(null)
    }

    const initializeKonvaStage = () => {
        if (!containerRef.current) return

        const stage = new Konva.Stage({
            container: containerRef.current,
            width: signatureWidth,
            height: signatureHeight,
        })

        const layer = new Konva.Layer()
        stage.add(layer)
        konvaStageRef.current = stage

        let isPainting = false
        let lastLine: Konva.Line | null = null

        const start = () => {
            isPainting = true
            const pos = stage.getPointerPosition()
            if (!pos) return

            lastLine = new Konva.Line({
                stroke: colorRef.current,
                strokeWidth: 3,
                globalCompositeOperation: 'source-over',
                lineCap: 'round',
                lineJoin: 'round',
                points: [pos.x, pos.y],
            })
            layer.add(lastLine)
        }

        const draw = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
            if (!isPainting || !lastLine) return
            e.evt.preventDefault()
            const pos = stage.getPointerPosition()
            if (!pos) return

            const newPoints = lastLine.points().concat([pos.x, pos.y])
            lastLine.points(newPoints)
            setIsOKButtonDisabled(false)
        }

        const end = () => {
            isPainting = false
            lastLine = null
        }

        stage.on('mousedown touchstart', start)
        stage.on('mouseup touchend', end)
        stage.on('mousemove touchmove', draw)
    }

    const changeColor = (color: string) => {
        setCurrentColor(color)
        const allLines = konvaStageRef.current?.getLayers()[0]
            .getChildren(node => node.getClassName() === 'Line') || []

        allLines.forEach(line => (line as Konva.Line).stroke(color))
    }

    const onInputFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const target = event.target as HTMLInputElement;
        const files = target.files;

        if (!files?.length) return;
        const _file = files[0];

        // 检查文件大小
        if (_file.size > maxSize) {
            setShowFileSizeWarning(true);
            setTimeout(() => setShowFileSizeWarning(false), 3000); // 3秒后自动隐藏
            if (target) {
                target.value = '';
            }
            return;
        }

        const reader = new FileReader();

        reader.onload = async (e) => {
            const imageUrl = e.target?.result as string;
            const img = new Image();
            img.src = imageUrl;

            img.onload = () => {
                // 设置最大宽高
                const MAX_WIDTH = maxUploadImageSize;
                const MAX_HEIGHT = maxUploadImageSize;

                let { width, height } = img;

                // 等比缩放
                if (width > height && width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                } else if (height > MAX_HEIGHT) {
                    width = Math.round((width * MAX_HEIGHT) / height);
                    height = MAX_HEIGHT;
                }

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = width;
                canvas.height = height;

                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);

                    // 转换为 PNG Data URL
                    const pngDataUrl = canvas.toDataURL('image/png');

                    // 清空 input 的值，以便重复上传同一文件
                    target.value = '';

                    // 调用回调并更新状态
                    setUploadedImageUrl(pngDataUrl);
                    setIsOKButtonDisabled(false);
                }
            };
        };

        reader.readAsDataURL(_file);
    };

    useEffect(() => {
        setTypedSignature('')
        setUploadedImageUrl(null)
        if (signatureType === 'Enter') {
            setIsOKButtonDisabled(true) // 直到用户输入
        } else if (signatureType === 'Draw') {
            setIsOKButtonDisabled(true) // 直到用户绘制
        } else if (signatureType === 'Upload') {
            setIsOKButtonDisabled(true) // 直到上传成功
        }
    }, [signatureType])


    useEffect(() => {
        setIsOKButtonDisabled(typedSignature.trim().length === 0)
    }, [typedSignature])


    useEffect(() => {
        if (isModalOpen) {
            loadFont(fontFamily)
            setTypedSignature('')
            setUploadedImageUrl(null)
            setSignatureType(signatureTypeDefault)
        }
    }, [isModalOpen])

    useEffect(() => {
        if (isModalOpen && signatureType === 'Draw') {
            setTimeout(() => {
                initializeKonvaStage()
            }, 300)
        } else {
            konvaStageRef.current?.destroy()
            konvaStageRef.current = null
        }
    }, [signatureType, isModalOpen])

    return (
        <>
            <Popover.Root>
                <Popover.Trigger>
                    <ToolbarButton title={t(`annotator:tool.${annotation.name}`)} icon={annotation.icon} />
                </Popover.Trigger>
                <Popover.Content size="1" style={{ width: 180 }} onCloseAutoFocus={(event) => event.preventDefault()}>
                    <div className={styles.SignaturePop}>
                        <ul className={styles.container}>
                            {defaultSignatures.map((s, idx) => (
                                <Popover.Close key={idx}>
                                    <li key={idx} onClick={() => handleAdd(s)}>
                                        <img src={s} />
                                    </li>
                                </Popover.Close>
                            ))}
                            {signatures.map((s, idx) => (
                                <Popover.Close key={idx}>
                                    <li key={idx} onClick={() => handleAdd(s)}>
                                        <img src={s} />
                                    </li>
                                </Popover.Close>
                            ))}
                        </ul>
                        <Popover.Close>
                            <Button style={{ width: '100%' }} variant="soft" onClick={() => { setIsModalOpen(true) }}>
                                <AiOutlinePlusCircle /> {t('annotator:common.createSignature')}
                            </Button>
                        </Popover.Close>
                    </div>
                </Popover.Content>
            </Popover.Root>
            <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
                <Dialog.Description></Dialog.Description>
                <Dialog.Content style={{ width: '550px' }}>
                    <Dialog.Title>{t('annotator:common.createSignature')}</Dialog.Title>
                    <Flex as="span" justify="center" mb="4">
                        <SegmentedControl.Root size="3" defaultValue={signatureTypeDefault} onValueChange={e => setSignatureType(e)} radius="full">
                            <SegmentedControl.Item value="Enter">{t('enter')}</SegmentedControl.Item>
                            <SegmentedControl.Item value="Draw">{t('draw')}</SegmentedControl.Item>
                            <SegmentedControl.Item value="Upload">{t('annotator:editor.signature.upload')}</SegmentedControl.Item>
                        </SegmentedControl.Root>
                    </Flex>
                    <div className={styles.SignatureTool}>
                        <div className={styles.container} style={{ width: signatureWidth }}>
                            {signatureType === 'Enter' && (
                                <input
                                    autoFocus
                                    type="text"
                                    value={typedSignature}
                                    onChange={e => setTypedSignature(e.target.value)}
                                    placeholder={t('annotator:editor.signature.area')}
                                    style={{
                                        height: signatureHeight - 2,
                                        width: signatureWidth / 1.1,
                                        color: currentColor,
                                        fontFamily: `${fontFamily}`,
                                        fontSize: BASE_FONT_SIZE,
                                        lineHeight: `${BASE_FONT_SIZE}px`,
                                    }}
                                />
                            )}
                            {signatureType === 'Draw' && (
                                <>
                                    <div className={styles.info}>{t('annotator:editor.signature.area')}</div>
                                    <div
                                        ref={containerRef}
                                        style={{
                                            height: signatureHeight,
                                            width: signatureWidth,
                                        }}
                                    />
                                </>
                            )}
                            {signatureType === 'Upload' && (
                                <div style={{
                                    height: signatureHeight,
                                    width: signatureWidth,
                                }}>
                                    {uploadedImageUrl ? (
                                        <div className={styles.imagePreview} style={{
                                            height: signatureHeight,
                                            width: signatureWidth,
                                        }}>
                                            <img src={uploadedImageUrl} alt="preview" />
                                        </div>
                                    ) : (
                                        <div style={{
                                            height: signatureHeight,
                                            width: signatureWidth,
                                        }}>
                                            <input style={{ display: 'none' }} type="file" ref={fileRef} accept={signatureAccept} onChange={onInputFileChange} />
                                            <Flex height={`${signatureHeight}px`} direction="column" gap="3" justify="center" align="center">
                                                <Button size="3" onClick={() => {
                                                    fileRef.current?.click()
                                                }}>
                                                    <AiOutlineImport /> {t('annotator:editor.signature.choose')}
                                                </Button>
                                                <Text color="gray" size="2" style={{ textAlign: 'center' }}>
                                                    {t('annotator:editor.signature.uploadHint', { format: signatureAccept, maxSize: formatFileSize(signatureMaxSize) })}
                                                </Text>
                                                {showFileSizeWarning && (
                                                    <Callout.Root color="red" mt="3">
                                                        <Callout.Text>
                                                            {t('fileSizeLimit', { value: formatFileSize(maxSize) })}
                                                        </Callout.Text>
                                                    </Callout.Root>
                                                )}
                                            </Flex>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={styles.toolbar} style={{ width: signatureWidth }}>
                            <Flex justify="between" align="center" gap="2">
                                <div className={styles.colorPalette}>
                                    {
                                        signatureType !== 'Upload' &&
                                        <>
                                            {
                                                signatureColors.map(color => (
                                                    <div key={color} onClick={() => changeColor(color)} className={`${styles.cell} ${color === currentColor ? styles.active : ''}`}>
                                                        <span style={{ backgroundColor: color }} />
                                                    </div>
                                                ))
                                            }
                                        </>
                                    }
                                    {
                                        signatureType === 'Enter' && <>
                                            <Select.Root onValueChange={async (value) => {
                                                await loadFont(value)
                                            }} defaultValue={fontFamily} size="1">
                                                <Select.Trigger />
                                                <Select.Content>
                                                    {
                                                        handwritingFontList.map((font) => (
                                                            <Select.Item key={font.value} value={font.value}>
                                                                {font.label}
                                                            </Select.Item>
                                                        ))
                                                    }
                                                </Select.Content>
                                            </Select.Root>
                                        </>
                                    }

                                </div>
                                <Button variant="ghost" mr="3" onClick={handleClear}>
                                    {t('clear')}
                                </Button>
                            </Flex>
                        </div>
                        <Flex gap="3" mt="4" justify="end">
                            <Dialog.Close>
                                <Button style={{ width: 100 }} variant="soft" color="gray">
                                    {t('cancel')}
                                </Button>
                            </Dialog.Close>
                            <Dialog.Close>
                                <Button disabled={isOKButtonDisabled} style={{ width: 100 }} onClick={handleOk}>{t('ok')}</Button>
                            </Dialog.Close>
                        </Flex>
                    </div>
                </Dialog.Content>
            </Dialog.Root>
        </>
    )
}

export { SignatureTool }
