import './index.scss' // 导入画笔样式文件

import Konva from 'konva'
import { annotationDefinitions, AnnotationType, IAnnotationStore, IAnnotationStyle, IAnnotationType } from '../const/definitions'
import { isElementInDOM, removeCssCustomProperty } from '../utils/utils'
import { CURSOR_CSS_PROPERTY, PAINTER_IS_PAINTING_STYLE, PAINTER_PAINTING_TYPE, PAINTER_WRAPPER_PREFIX } from './const'
import { Editor } from './editor/editor'
import { EditorCircle } from './editor/editor_circle'
import { EditorFreeHand } from './editor/editor_free_hand'
import { EditorFreeHighlight } from './editor/editor_free_highlight'
import { EditorFreeText } from './editor/editor_free_text'
import { EditorHighLight } from './editor/editor_highlight'
import { EditorRectangle } from './editor/editor_rectangle'
import { EditorSignature } from './editor/editor_signature'
import { EditorStamp } from './editor/editor_stamp'
import { EditorNote } from './editor/editor_note'
import { Selector } from './editor/selector'
import { SelectionSource, useAnnotationStore } from '../store'
import { WebSelection } from './webSelection'
import { Transform } from './transform/transform'
import { EditorArrow } from './editor/editor_arrow'
import { EditorCloud } from './editor/editor_cloud'
import { IRect } from 'konva/lib/types'
import { PdfAnnotatorOptions } from '../types/annotator'
import { PageViewport } from 'pdfjs-dist/types/web/interfaces'
import { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer'
import { PDFPageView } from 'pdfjs-dist/types/web/pdf_page_view'
import { User } from '@/types'

// KonvaCanvas 接口定义
export interface KonvaCanvas {
    pageNumber: number
    konvaStage: Konva.Stage
    wrapper: HTMLDivElement
    isActive: boolean
}

// Painter 类定义
export class Painter {
    private primaryColor: string
    private defaultOptions: PdfAnnotatorOptions
    private currentUser: User
    private konvaCanvasStore: Map<number, KonvaCanvas> = new Map() // 存储 KonvaCanvas 实例
    private editorStore: Map<string, Editor> = new Map() // 存储编辑器实例
    private pdfViewerApplication: PDFViewer // PDFViewerApplication 实例
    private webSelection: WebSelection // WebSelection 实例
    private currentAnnotation: IAnnotationType | null = null // 当前批注类型
    private selector: Selector // 选择器实例
    private transform: Transform // 转换器
    private tempDataTransfer: string | null = null // 临时数据传输
    public readonly onTextSelected: (range: Range | null) => void
    public readonly onAnnotationAdd: (annotationStore: IAnnotationStore, isOriginal: boolean, currentAnnotation: IAnnotationType | undefined) => void
    public readonly onAnnotationDelete: (id: string) => void
    public readonly onAnnotationSelected: (annotationStore: IAnnotationStore | undefined, isClick: boolean, selectorRect: IRect) => void
    public readonly onAnnotationChanging: () => void // 批注正在更改的回调函数
    public readonly onAnnotationChanged: (annotationStore: IAnnotationStore | undefined, selectorRect?: IRect) => void // 批注已更改的回调函数
    /**
     * 构造函数，初始化 PDFViewerApplication, EventBus, 和 WebSelection
     * @param params - 包含 PDFViewerApplication 和 EventBus 的对象
     */
    constructor({
        primaryColor,
        defaultOptions,
        currentUser,
        PDFViewerApplication,
        onTextSelected,
        onAnnotationAdd,
        onAnnotationDelete,
        onAnnotationSelected,
        onAnnotationChanging,
        onAnnotationChanged
    }: {
        primaryColor: string
        defaultOptions: PdfAnnotatorOptions
        currentUser: User
        PDFViewerApplication: PDFViewer
        onTextSelected: (range: Range | null) => void
        onAnnotationAdd: (annotationStore: IAnnotationStore, isOriginal: boolean, currentAnnotation: IAnnotationType | undefined) => void
        onAnnotationDelete: (id: string) => void
        onAnnotationSelected: (annotationStore: IAnnotationStore | undefined, isClick: boolean, selectorRect: IRect) => void
        onAnnotationChanging: () => void
        onAnnotationChanged: (annotationStore: IAnnotationStore | undefined, selectorRect?: IRect) => void
    }) {
        this.primaryColor = primaryColor
        this.defaultOptions = defaultOptions
        this.currentUser = currentUser
        this.pdfViewerApplication = PDFViewerApplication // 初始化 PDFViewerApplication
        this.onTextSelected = onTextSelected
        this.onAnnotationAdd = onAnnotationAdd
        this.onAnnotationDelete = onAnnotationDelete
        this.onAnnotationSelected = onAnnotationSelected
        this.onAnnotationChanging = onAnnotationChanging // 批注正在更改的回调函数
        this.onAnnotationChanged = onAnnotationChanged // 批注已更改的回调函数
        this.selector = new Selector({
            primaryColor: this.primaryColor,
            // 初始化选择器实例
            konvaCanvasStore: this.konvaCanvasStore,
            getAnnotationStore: (id: string) => {
                return useAnnotationStore.getState().getAnnotation(id)
            },
            onSelected: (id, isClick, transformerRect) => {
                const annotationStore = useAnnotationStore.getState().getAnnotation(id)
                if (annotationStore) {
                    useAnnotationStore.getState().setSelectedAnnotation(annotationStore, isClick ? SelectionSource.CANVAS : SelectionSource.SIDEBAR)
                    this.onAnnotationSelected(annotationStore, isClick, transformerRect)
                }
            },
            onChanged: async (id, groupString, _rawAnnotationStore, konvaClientRect, transformerRect) => {
                const editor = this.findEditorForGroupId(id)
                const currentAnnotation = useAnnotationStore.getState().getAnnotation(id)
                if (editor) {
                    this.updateStore(id, { konvaString: groupString, konvaClientRect }, false)
                }
                if (currentAnnotation) {
                    useAnnotationStore.getState().setSelectedAnnotation(currentAnnotation, SelectionSource.SIDEBAR)
                }

                this.onAnnotationChanged(currentAnnotation, transformerRect)
            },
            onCancel: () => {
                this.onAnnotationChanging() // 批注正在更改的回调
            },
            onDelete: (id) => {
                this.deleteAnnotation(id, true)
            }
        })
        this.webSelection = new WebSelection({
            // 初始化 WebSelection 实例
            onSelect: (range) => {
                this.onTextSelected(range)
            },
            onHighlight: (selection) => {
                Object.keys(selection).forEach((key) => {
                    const pageNumber = Number(key)
                    const elements = selection[key]
                    const canvas = this.konvaCanvasStore.get(pageNumber)
                    if (canvas) {
                        const { konvaStage, wrapper } = canvas
                        let storeEditor = this.findEditor(pageNumber, this.currentAnnotation!.type) as EditorHighLight
                        if (!storeEditor) {
                            storeEditor = new EditorHighLight(
                                {
                                    primaryColor: this.primaryColor,
                                    defaultOptions: this.defaultOptions,
                                    currentUser: this.currentUser,
                                    pdfViewerApplication: this.pdfViewerApplication,
                                    konvaStage,
                                    pageNumber,
                                    annotation: this.currentAnnotation,
                                    onAdd: (annotationStore) => {
                                        this.saveToStore(annotationStore)
                                    },
                                    onChange: (id, updates) => {
                                        this.updateStore(id, updates) // 更新存储
                                    }
                                },
                                this.currentAnnotation!.type
                            )
                            this.editorStore.set(storeEditor.id, storeEditor)
                        }
                        storeEditor.convertTextSelection(elements as HTMLSpanElement[], wrapper)
                    }
                })
            }
        })
        this.transform = new Transform(PDFViewerApplication)
        this.bindGlobalEvents() // 绑定全局事件
    }

    private setDefaultMode = () => {
        useAnnotationStore.getState().setCurrentAnnotationType(annotationDefinitions[0])
    }

    /**
     * 绑定全局事件。
     */
    private bindGlobalEvents(): void {
        window.addEventListener('keyup', this.globalKeyUpHandler) // 监听全局键盘事件
    }

    /**
     * 全局键盘抬起事件处理器。
     * @param e - 键盘事件。
     */
    private globalKeyUpHandler = (e: KeyboardEvent): void => {
        if (
            e.code === 'Escape' &&
            (this.currentAnnotation?.type === AnnotationType.SIGNATURE || this.currentAnnotation?.type === AnnotationType.STAMP)
        ) {
            removeCssCustomProperty(CURSOR_CSS_PROPERTY) // 移除自定义 CSS 属性
            this.setDefaultMode() // 设置默认模式
        }
    }

    /**
     * 创建绘图容器 (painterWrapper)
     * @param pageView - 当前 PDF 页面视图
     * @param pageNumber - 当前页码
     * @returns 绘图容器元素
     */
    private createPainterWrapper(pageView: PDFPageView, pageNumber: number): HTMLDivElement {
        const wrapper = document.createElement('div') // 创建 div 元素作为绘图容器
        wrapper.id = `${PAINTER_WRAPPER_PREFIX}_page_${pageNumber}` // 设置 id
        wrapper.classList.add(PAINTER_WRAPPER_PREFIX) // 添加类名
        pageView.div.appendChild(wrapper)
        return wrapper
    }

    /**
     * 创建 Konva Stage
     * @param container - 绘图容器元素
     * @param viewport - 当前 PDF 页面视口
     * @returns Konva Stage
     */
    private createKonvaStage(container: HTMLDivElement, viewport: PageViewport): Konva.Stage {
        const stage = new Konva.Stage({
            container,
            width: viewport.width,
            height: viewport.height,
            scale: { x: viewport.scale, y: viewport.scale }
        })

        const backgroundLayer = new Konva.Layer()
        stage.add(backgroundLayer)

        return stage
    }

    /**
     * 清理无效的 canvasStore
     */
    private cleanUpInvalidStore(): void {
        this.konvaCanvasStore.forEach((konvaCanvas) => {
            if (!isElementInDOM(konvaCanvas.wrapper)) {
                konvaCanvas.konvaStage.destroy()
                this.konvaCanvasStore.delete(konvaCanvas.pageNumber)
            }
        })
    }

    /**
     * 插入新的绘图容器和 Konva Stage
     * @param pageView - 当前 PDF 页面视图
     * @param pageNumber - 当前页码
     */
    private insertCanvas(pageView: PDFPageView, pageNumber: number): void {
        this.cleanUpInvalidStore()
        const painterWrapper = this.createPainterWrapper(pageView, pageNumber)
        const konvaStage = this.createKonvaStage(painterWrapper, pageView.viewport)

        this.konvaCanvasStore.set(pageNumber, { pageNumber, konvaStage, wrapper: painterWrapper, isActive: false })
        this.reDrawAnnotation(pageNumber) // 重绘批注
        this.enablePainting() // 启用绘画
    }

    /**
     * 调整现有 KonvaCanvas 的缩放
     * @param pageView - 当前 PDF 页面视图
     * @param pageNumber - 当前页码
     */
    private scaleCanvas(pageView: PDFPageView, pageNumber: number): void {
        const konvaCanvas = this.konvaCanvasStore.get(pageNumber)
        if (!konvaCanvas) return

        const { konvaStage } = konvaCanvas
        const { scale, width, height } = pageView.viewport

        konvaStage.scale({ x: scale, y: scale })
        konvaStage.width(width)
        konvaStage.height(height)
    }

    /**
     * 设置当前模式 (绘画模式、默认模式)
     * @param mode - 模式类型 ('painting', 'default')
     */
    private setMode(mode: 'painting' | 'default'): void {
        const isPainting = mode === 'painting' // 是否绘画模式
        document.body.classList.toggle(`${PAINTER_IS_PAINTING_STYLE}`, isPainting) // 添加或移除绘画模式样式
        const allAnnotationClasses = Object.values(AnnotationType)
            .filter((type) => typeof type === 'number')
            .map((type) => `${PAINTER_PAINTING_TYPE}_${type}`)
        // 移除所有可能存在的批注类型样式
        allAnnotationClasses.forEach((cls) => document.body.classList.remove(cls))
        // 移出签名鼠标指针变量
        removeCssCustomProperty(CURSOR_CSS_PROPERTY)

        if (this.currentAnnotation) {
            document.body.classList.add(`${PAINTER_PAINTING_TYPE}_${this.currentAnnotation?.type}`)
        }
    }

    /**
     * 保存到存储
     */
    private saveToStore(annotationStore: IAnnotationStore, isOriginal: boolean = false) {
        const currentAnnotation = annotationDefinitions.find((item) => item.pdfjsAnnotationType === annotationStore.pdfjsType)
        useAnnotationStore.getState().addAnnotation(annotationStore, isOriginal)
        if (isOriginal) return
        if (currentAnnotation) {
            if (currentAnnotation.isOnce) {
                this.selectAnnotation(annotationStore.id, true)
            } else {
                useAnnotationStore.getState().setSelectedAnnotation(annotationStore, SelectionSource.CANVAS)
            }
        }
        this.onAnnotationAdd(annotationStore, isOriginal, currentAnnotation)
    }

    /**
     * 更新存储
     */
    private updateStore(id: string, updates: Partial<IAnnotationStore>, emitChange: boolean = true) {
        const updatedAnnotationStore = useAnnotationStore.getState().updateAnnotation(id, updates)

        if (updatedAnnotationStore && emitChange) {
            this.onAnnotationChanged(updatedAnnotationStore)
        }
    }

    /**
     * 根据组 ID 查找编辑器
     * @param groupId - 组 ID
     * @returns 编辑器实例
     */
    private findEditorForGroupId(groupId: string): Editor | null {
        let editor: Editor | null = null
        this.editorStore.forEach((_editor) => {
            if (_editor.shapeGroupStore?.has(groupId)) {
                editor = _editor
                return
            }
        })
        return editor
    }

    /**
     * 根据页码和编辑器类型查找编辑器
     * @param pageNumber - 页码
     * @param editorType - 编辑器类型
     * @returns 编辑器实例
     */
    private findEditor(pageNumber: number, editorType: AnnotationType): Editor | undefined {
        return this.editorStore.get(`${pageNumber}_${editorType}`)
    }

    /**
     * 启用特定类型的编辑器
     * @param options - 包含 Konva Stage、页码和批注类型的对象
     */
    private enableEditor({ konvaStage, pageNumber, annotation }: { konvaStage: Konva.Stage; pageNumber: number; annotation: IAnnotationType }): void {
        const storeEditor = this.findEditor(pageNumber, annotation.type) // 查找存储中的编辑器实例
        if (storeEditor) {
            if (storeEditor instanceof EditorSignature) {
                storeEditor.activateWithSignature(konvaStage, annotation, this.tempDataTransfer) // 激活带有签名的编辑器
                return
            }
            if (storeEditor instanceof EditorStamp) {
                storeEditor.activateWithStamp(konvaStage, annotation, this.tempDataTransfer) // 激活带有图章的编辑器
                return
            }
            storeEditor.activate(konvaStage, annotation) // 激活编辑器
            return
        }
        let editor: Editor | null = null // 初始化编辑器为空
        switch (annotation.type) {
            case AnnotationType.FREETEXT:
                editor = new EditorFreeText({
                    primaryColor: this.primaryColor,
                    defaultOptions: this.defaultOptions,
                    currentUser: this.currentUser,
                    pdfViewerApplication: this.pdfViewerApplication,
                    konvaStage,
                    pageNumber,
                    annotation,
                    onAdd: (annotationStore) => {
                        this.saveToStore(annotationStore)
                    },
                    onChange: (id, updates) => {
                        this.updateStore(id, updates) // 更新存储
                    }
                })
                break
            case AnnotationType.RECTANGLE:
                editor = new EditorRectangle({
                    primaryColor: this.primaryColor,
                    defaultOptions: this.defaultOptions,
                    currentUser: this.currentUser,
                    pdfViewerApplication: this.pdfViewerApplication,
                    konvaStage,
                    pageNumber,
                    annotation,
                    onAdd: (annotationStore) => {
                        this.saveToStore(annotationStore)
                    },
                    onChange: (id, updates) => {
                        this.updateStore(id, updates) // 更新存储
                    }
                })
                break
            case AnnotationType.ARROW:
                editor = new EditorArrow({
                    primaryColor: this.primaryColor,
                    defaultOptions: this.defaultOptions,
                    currentUser: this.currentUser,
                    pdfViewerApplication: this.pdfViewerApplication,
                    konvaStage,
                    pageNumber,
                    annotation,
                    onAdd: (annotationStore) => {
                        this.saveToStore(annotationStore)
                    },
                    onChange: (id, updates) => {
                        this.updateStore(id, updates) // 更新存储
                    }
                })
                break
            case AnnotationType.CLOUD:
                editor = new EditorCloud({
                    primaryColor: this.primaryColor,
                    defaultOptions: this.defaultOptions,
                    currentUser: this.currentUser,
                    pdfViewerApplication: this.pdfViewerApplication,
                    konvaStage,
                    pageNumber,
                    annotation,
                    onAdd: (annotationStore) => {
                        this.saveToStore(annotationStore)
                    },
                    onChange: (id, updates) => {
                        this.updateStore(id, updates) // 更新存储
                    }
                })
                break
            case AnnotationType.CIRCLE:
                editor = new EditorCircle({
                    primaryColor: this.primaryColor,
                    defaultOptions: this.defaultOptions,
                    currentUser: this.currentUser,
                    pdfViewerApplication: this.pdfViewerApplication,
                    konvaStage,
                    pageNumber,
                    annotation,
                    onAdd: (annotationStore) => {
                        this.saveToStore(annotationStore)
                    },
                    onChange: (id, updates) => {
                        this.updateStore(id, updates) // 更新存储
                    }
                })
                break
            case AnnotationType.NOTE:
                editor = new EditorNote({
                    primaryColor: this.primaryColor,
                    defaultOptions: this.defaultOptions,
                    currentUser: this.currentUser,
                    pdfViewerApplication: this.pdfViewerApplication,
                    konvaStage,
                    pageNumber,
                    annotation,
                    onAdd: (annotationStore) => {
                        this.saveToStore(annotationStore)
                    },
                    onChange: () => {}
                })
                break
            case AnnotationType.FREEHAND:
                editor = new EditorFreeHand({
                    primaryColor: this.primaryColor,
                    defaultOptions: this.defaultOptions,
                    currentUser: this.currentUser,
                    pdfViewerApplication: this.pdfViewerApplication,
                    konvaStage,
                    pageNumber,
                    annotation,
                    onAdd: (annotationStore) => {
                        this.saveToStore(annotationStore)
                    },
                    onChange: (id, updates) => {
                        this.updateStore(id, updates) // 更新存储
                    }
                })
                break
            case AnnotationType.FREE_HIGHLIGHT:
                editor = new EditorFreeHighlight({
                    primaryColor: this.primaryColor,
                    defaultOptions: this.defaultOptions,
                    currentUser: this.currentUser,
                    pdfViewerApplication: this.pdfViewerApplication,
                    konvaStage,
                    pageNumber,
                    annotation,
                    onAdd: (annotationStore) => {
                        this.saveToStore(annotationStore)
                    },
                    onChange: (id, updates) => {
                        this.updateStore(id, updates) // 更新存储
                    }
                })
                break
            case AnnotationType.SIGNATURE:
                editor = new EditorSignature(
                    {
                        primaryColor: this.primaryColor,
                        defaultOptions: this.defaultOptions,
                        currentUser: this.currentUser,
                        pdfViewerApplication: this.pdfViewerApplication,
                        konvaStage,
                        pageNumber,
                        annotation,
                        onAdd: (annotationStore) => {
                            this.saveToStore(annotationStore)
                        },
                        onChange: () => {}
                    },
                    this.tempDataTransfer
                )
                break
            case AnnotationType.STAMP:
                editor = new EditorStamp(
                    {
                        primaryColor: this.primaryColor,
                        defaultOptions: this.defaultOptions,
                        currentUser: this.currentUser,
                        pdfViewerApplication: this.pdfViewerApplication,
                        konvaStage,
                        pageNumber,
                        annotation,
                        onAdd: (annotationStore) => {
                            this.saveToStore(annotationStore)
                        },
                        onChange: () => {}
                    },
                    this.tempDataTransfer
                )
                break
            case AnnotationType.HIGHLIGHT:
            case AnnotationType.UNDERLINE:
            case AnnotationType.STRIKEOUT:
                editor = new EditorHighLight(
                    {
                        primaryColor: this.primaryColor,
                        defaultOptions: this.defaultOptions,
                        currentUser: this.currentUser,
                        pdfViewerApplication: this.pdfViewerApplication,
                        konvaStage,
                        pageNumber,
                        annotation,
                        onAdd: (annotationStore) => {
                            this.saveToStore(annotationStore)
                        },
                        onChange: (id, updates) => {
                            this.updateStore(id, updates) // 更新存储
                        }
                    },
                    annotation.type
                )
                break
            case AnnotationType.SELECT:
                this.selector.activate(pageNumber) // 激活选择器
                break

            default:
                console.warn(`未实现的批注类型: ${annotation.type}`)
                return
        }

        if (editor) {
            this.editorStore.set(editor.id, editor) // 将编辑器实例存储到 editorStore
        }
    }

    /**
     * 启用绘画
     */
    private enablePainting(): void {
        this.konvaCanvasStore.forEach(({ konvaStage, pageNumber }) => {
            // 遍历 KonvaCanvas 实例
            if (this.currentAnnotation) {
                this.enableEditor({
                    konvaStage,
                    pageNumber,
                    annotation: this.currentAnnotation // 启用特定类型的编辑器
                })
            }
        })
    }

    /**
     * 重新绘制批注
     * @param pageNumber - 页码
     */
    private reDrawAnnotation(pageNumber: number): void {
        const konvaCanvasStore = this.konvaCanvasStore.get(pageNumber) // 获取 KonvaCanvas 实例
        const annotationStores = useAnnotationStore.getState().getByPage(pageNumber) // 获取指定页码的批注存储
        annotationStores.forEach((annotationStore) => {
            let storeEditor = this.findEditor(pageNumber, annotationStore.type) // 查找编辑器实例
            if (!storeEditor) {
                // 如果编辑器不存在，启用编辑器
                const annotationDefinition = annotationDefinitions.find((item) => item.type === annotationStore.type)
                this.enableEditor({ konvaStage: konvaCanvasStore!.konvaStage, pageNumber, annotation: annotationDefinition! })
                storeEditor = this.findEditor(pageNumber, annotationStore.type) // 重新查找编辑器
            }

            if (storeEditor) {
                // 添加序列化组到图层
                storeEditor.addSerializedGroupToLayer(konvaCanvasStore!.konvaStage, annotationStore.konvaString)
            }
        })
    }

    /**
     * 删除批注
     * @param id - 批注 ID
     */
    private deleteAnnotation(id: string, emit: boolean = false): void {
        const annotationStore = useAnnotationStore.getState().getAnnotation(id)
        if (!annotationStore) {
            return
        }
        useAnnotationStore.getState().removeAnnotation(id)
        const storeEditor = this.findEditor(annotationStore.pageNumber, annotationStore.type)
        const konvaCanvasStore = this.konvaCanvasStore.get(annotationStore.pageNumber) // 获取 KonvaCanvas 实例
        if (storeEditor && konvaCanvasStore) {
            storeEditor.deleteGroup(id, konvaCanvasStore.konvaStage)
        }
        if (emit) {
            this.onAnnotationDelete(id)
        }
    }

    /**
     * 关闭绘画
     */
    private disablePainting(): void {
        this.setMode('default') // 设置默认模式
        this.clearTempDataTransfer() // 清除临时数据传输
        this.selector.clear() // 清除选择器
    }

    /**
     * 保存临时数据传输
     * @param data - 数据
     * @returns 临时数据传输
     */
    private saveTempDataTransfer(data: string): string {
        this.tempDataTransfer = data
        return this.tempDataTransfer
    }

    /**
     * 清除临时数据传输
     * @returns 临时数据传输
     */
    private clearTempDataTransfer() {
        this.tempDataTransfer = null
        return this.tempDataTransfer
    }

    /**
     * 初始化或更新 KonvaCanvas
     * @param params - 包含当前 PDF 页面视图、是否需要 CSS 转换和页码的对象
     */
    public initCanvas({ pageView, cssTransform, pageNumber }: { pageView: PDFPageView; cssTransform: boolean; pageNumber: number }): void {
        if (cssTransform) {
            this.scaleCanvas(pageView, pageNumber)
        } else {
            this.insertCanvas(pageView, pageNumber)
        }
    }

    /**
     * 初始化 WebSelection
     * @param rootElement - 根 DOM 元素
     */
    public initWebSelection(rootElement: HTMLDivElement): void {
        this.webSelection.create(rootElement)
    }

    /**
     * 激活特定批注类型
     * @param annotation - 批注类型对象
     * @param dataTransfer - 数据传输
     */
    public activate(annotation: IAnnotationType | null, dataTransfer: string | null): void {
        this.currentAnnotation = annotation
        this.disablePainting()
        this.saveTempDataTransfer(dataTransfer || '')

        if (!annotation) {
            return
        }

        switch (annotation.type) {
            case AnnotationType.FREETEXT:
            case AnnotationType.RECTANGLE:
            case AnnotationType.CIRCLE:
            case AnnotationType.FREEHAND:
            case AnnotationType.FREE_HIGHLIGHT:
            case AnnotationType.SIGNATURE:
            case AnnotationType.STAMP:
            case AnnotationType.SELECT:
            case AnnotationType.NOTE:
            case AnnotationType.ARROW:
            case AnnotationType.CLOUD:
                this.setMode('painting') // 设置绘画模式
                break

            default:
                this.setMode('default') // 设置默认模式
                break
        }

        this.enablePainting()
    }

    /**
     * 重置 PDF.js 批注存储
     */
    public resetPdfjsAnnotationStorage(): void {}

    /**
     * @description 根据 range 加亮
     * @param range
     * @param annotation
     */
    public highlightRange(range: Range | null, annotation: IAnnotationType) {
        this.currentAnnotation = annotation
        this.webSelection.highlight(range)
    }

    /**
     * @description 选中对应 ID 批注
     * @param id
     */
    public selectAnnotation(id: string, isClick: boolean) {
        this.setDefaultMode()
        this.selector.select(id, isClick)
    }

    /**
     * @description 将annotation 存入 store, 包含外部 annotation 和 pdf 文件上的 annotation
     */
    public async initAnnotationsOnce(annotations: IAnnotationStore[], enableNativeAnnotations: boolean) {
        // 加载 pdf 文件批注
        if (enableNativeAnnotations) {
            // 先将 pdf 文件中的存入
            const annotationMap = await this.transform.decodePdfAnnotation()
            annotationMap.forEach((annotation) => {
                this.saveToStore(annotation, true)
            })
            // 再用外部数据覆盖
            annotations.forEach((annotation) => {
                if (annotationMap.has(annotation.id)) {
                    this.updateStore(annotation.id, annotation)
                } else {
                    this.saveToStore(annotation, true)
                }
            })
        } else {
            annotations.forEach((annotation) => {
                this.saveToStore(annotation, true)
            })
        }
    }

    /**
     * @description 更新 store
     * @param id
     * @param updates
     */
    public update(id: string, updates: Partial<IAnnotationStore>) {
        this.updateStore(id, updates, true)
    }

    /**
     * @description 删除 annotation
     * @param id
     */
    public delete(id: string, emit: boolean = false) {
        this.selector.delete()
        this.deleteAnnotation(id, emit)
    }

    /**
     * @description 高亮选中 annotation
     * @param annotation
     */
    public async highlight(annotation: IAnnotationStore) {
        // 跳转至对应页面位置
        const pageView = this.pdfViewerApplication!._pages![annotation.pageNumber - 1] || this.pdfViewerApplication.getPageView(annotation.pageNumber)
        const { x, y } = annotation.konvaClientRect
        // 把 Konva 的左上角坐标转换为 PDF 内部坐标（以页面左下角为原点）
        const [pdfX, pdfY] = pageView.viewport.convertToPdfPoint(x, y - 200)
        this.pdfViewerApplication.scrollPageIntoView({
            pageNumber: annotation.pageNumber,
            destArray: [null, { name: 'XYZ' }, pdfX, pdfY, null], // 可以加偏移
            allowNegativeOffset: true
        })

        const maxRetries = 5 // 最大重试次数
        const retryInterval = 200 // 每次重试间隔
        // 封装递归重试机制
        const attemptHighlight = (retries: number): void => {
            const storeEditor = this.findEditor(annotation.pageNumber, annotation.type)
            if (storeEditor) {
                this.setDefaultMode()
                this.selector.select(annotation.id)
                if (this.currentAnnotation && this.currentAnnotation.type === AnnotationType.SELECT) {
                    this.selector.activate(annotation.pageNumber)
                }
            } else if (retries > 0) {
                // 如果没有找到且还有重试次数，继续重试
                setTimeout(() => {
                    attemptHighlight(retries - 1)
                }, retryInterval)
            } else {
                console.error('Failed to find editor after maximum retries.')
            }
        }
        // 初次尝试执行
        attemptHighlight(maxRetries)
    }

    public getData() {
        return Array.from(useAnnotationStore.getState().annotations.values())
    }

    /**
     * @description 更新样式
     * @param annotationStore
     * @param styles
     */
    public updateAnnotationStyle(annotationStore: IAnnotationStore, style: IAnnotationStyle) {
        const editor = this.findEditorForGroupId(annotationStore.id)
        if (editor) {
            editor.updateStyle(annotationStore, style) // 更新编辑器样式
        }
    }

    public getKonvaCanvasStore() {
        return this.konvaCanvasStore
    }

    public reRenderAnnotations(pageNumber: number) {
        this.reDrawAnnotation(pageNumber)
    }
}

