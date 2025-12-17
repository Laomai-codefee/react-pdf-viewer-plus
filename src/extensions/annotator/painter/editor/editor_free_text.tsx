import Konva from 'konva'
import { KonvaEventObject } from 'konva/lib/Node'

import { AnnotationType, IAnnotationStore, IAnnotationStyle } from '../../const/definitions'
import { Editor, IEditorOptions } from './editor'
import { computePosition, flip, Middleware, Placement } from '@floating-ui/dom'
import i18n from 'i18next'
import { FREE_TEXT_EDITOR } from '../const'

// 添加浮动元素容器的样式定义
interface FloatingElementPositionOptions {
    placement?: Placement
    middleware?: Middleware[]
}

const DEFAULT_POSITION_OPTIONS: FloatingElementPositionOptions = {
    placement: 'bottom-start',
    middleware: [flip()]
}

const MAX_WIDTH = 200

// 创建一个函数来创建和管理浮动输入框
class FreeTextFloatingManager {
    private resolveFunction: ((value: string) => void) | null = null
    private container: HTMLDivElement | null = null
    private inputElement: HTMLTextAreaElement | null = null
    private isActive: boolean = false
    private isCleaningUp: boolean = false
    show(position: { x: number; y: number }, fontSize: number, color: string, primaryColor: string): Promise<string> {
        if (this.isActive) {
            this.handleConfirm()
        }

        this.isActive = true
        this.isCleaningUp = false
        return new Promise((resolve) => {
            this.resolveFunction = resolve
            // 创建浮动容器
            this.container = document.createElement('div')
            this.container.id = FREE_TEXT_EDITOR
            // 应用基础样式
            Object.assign(this.container.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                zIndex: '1000'
            })

            document.body.appendChild(this.container)

            // 创建虚拟元素用于定位
            const virtualEl = {
                getBoundingClientRect: () => ({
                    x: position.x,
                    y: position.y,
                    top: position.y,
                    left: position.x,
                    bottom: position.y,
                    right: position.x,
                    width: 0,
                    height: 0,
                    toJSON: () => {}
                })
            }

            // 计算位置并渲染组件
            computePosition(virtualEl, this.container, DEFAULT_POSITION_OPTIONS).then(({ x, y }) => {
                Object.assign(this.container!.style, {
                    left: `${x}px`,
                    top: `${y}px`
                })

                // 渲染输入框组件
                this.renderInputComponent(fontSize, color, primaryColor)
            })
        })
    }

    private renderInputComponent(fontSize: number, color: string, primaryColor: string) {
        if (!this.container) return
        const wrapper = document.createElement('div')
        const textArea = document.createElement('textarea')
        textArea.placeholder = i18n.t('annotator:editor.text.startTyping')
        Object.assign(textArea.style, {
            minHeight: '40px',
            width: `${MAX_WIDTH}px`,
            padding: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: 'none !important',
            borderRadius: '4px',
            resize: 'vertical',
            fontFamily: 'inherit',
            fontSize: `${fontSize}px`,
            color
        })

        textArea.addEventListener('focus', () => {
            Object.assign(textArea.style, {
                outline: color,
                boxShadow: `0 0 0 1px ${primaryColor}`
            })
        })

        textArea.addEventListener('blur', () => {
            Object.assign(textArea.style, {
                boxShadow: 'none'
            })
        })

        textArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                this.handleConfirm()
            }
            else if (e.key === 'Escape') {
                e.preventDefault()
                this.handleCancel()
            }
        })

        // 失去焦点时根据内容决定是否确认或取消
        textArea.addEventListener('blur', () => {
            if (!this.isCleaningUp) {
                if (this.inputElement && this.inputElement.value.trim() !== '') {
                    this.handleConfirm()
                } else {
                    this.handleCancel()
                }
            }
        })

        this.inputElement = textArea

        wrapper.appendChild(textArea)
        this.container.appendChild(wrapper)

        // 自动聚焦到文本域
        setTimeout(() => {
            if (textArea) {
                textArea.focus()
            }
        }, 100)
    }

    private handleConfirm() {
        if (this.resolveFunction && this.inputElement) {
            const inputValue = this.inputElement.value
            this.resolveFunction(inputValue)
            this.cleanup()
        }
    }

    private handleCancel() {
        if (this.resolveFunction) {
            this.resolveFunction('')
            this.cleanup()
        }
    }

    private cleanup() {
        if (this.isCleaningUp) {
            return
        }

        this.isCleaningUp = true

        if (this.container && this.container.parentNode) {
            try {
                this.container.parentNode.removeChild(this.container)
            } catch (e) {
                // 忽略DOM异常，节点可能已被移除
            }
        }
        this.resolveFunction = null
        this.container = null
        this.inputElement = null
        this.isActive = false
    }
}

// 创建全局单例管理器
const freeTextFloatingManager = new FreeTextFloatingManager()

export async function setInputText(position: { x: number; y: number }, fontSize: number, color: string, primaryColor: string): Promise<string> {
    return freeTextFloatingManager.show(position, fontSize, color, primaryColor)
}

/**
 * EditorFreeText 是继承自 Editor 的自由文本编辑器类。
 */
export class EditorFreeText extends Editor {
    /**
     * 创建一个 EditorFreeText 实例。
     * @param EditorOptions 初始化编辑器的选项
     */
    constructor(EditorOptions: IEditorOptions) {
        super({ ...EditorOptions, editorType: AnnotationType.FREETEXT })
    }

    protected mouseDownHandler() {}
    protected mouseMoveHandler() {}

    /**
     * 处理鼠标抬起事件，创建输入区域。
     * @param e Konva 事件对象
     */
    protected async mouseUpHandler(e: KonvaEventObject<PointerEvent>) {
        const pos = this.konvaStage.getRelativePointerPosition()

        if (!pos) {
            return
        }

        const scale = this.konvaStage.scale()
        const container = this.konvaStage.container()

        if (e.currentTarget !== this.konvaStage) {
            return
        }
        this.isPainting = true
        this.currentShapeGroup = this.createShapeGroup()
        this.getBgLayer().add(this.currentShapeGroup.konvaGroup)

        // 计算相对于容器的绝对位置
        const containerRect = container.getBoundingClientRect()
        const absoluteX = containerRect.left + pos.x * scale.x
        const absoluteY = containerRect.top + pos.y * scale.y
        const inputValue = await setInputText(
            { x: absoluteX, y: absoluteY },
            this.currentAnnotation!.style!.fontSize!,
            this.currentAnnotation!.style!.color!,
            this.primaryColor
        )
        this.inputDoneHandler(inputValue, scale, pos, this.currentAnnotation!.style!.color!, this.currentAnnotation!.style!.fontSize!)
    }

    /**
     * 处理输入完成后的操作。
     * @param inputValue string 输入值
     * @param scale 缩放比例
     * @param pos 相对位置坐标
     */
    private async inputDoneHandler(
        inputValue: string,
        _scale: { x: number; y: number },
        pos: { x: number; y: number },
        color: string,
        fontSize: number
    ) {
        const value = inputValue.trim()
        if (value === '') {
            this.delShapeGroup(this.currentShapeGroup!.id)
            this.currentShapeGroup = null
            return
        }
        const tempText = new Konva.Text({
            text: value,
            fontSize: fontSize,
            padding: 2
        })
        const textWidth = tempText.width()
        const finalWidth = textWidth > MAX_WIDTH ? MAX_WIDTH : textWidth

        const text = new Konva.Text({
            x: pos.x,
            y: pos.y + 2,
            text: value,
            width: finalWidth,
            fontSize,
            fill: color,
            wrap: 'word'
        })

        this.currentShapeGroup?.konvaGroup.add(text)

        const id = this.currentShapeGroup?.konvaGroup.id()

        if (!id) {
            return
        }

        this.setShapeGroupDone({
            id,
            contentsObj: {
                text: value
            },
            color,
        })
    }

    /**
     * @description 更改注释样式
     * @param annotationStore
     * @param styles
     */
    protected changeStyle(annotationStore: IAnnotationStore, styles: IAnnotationStyle): void {
        const id = annotationStore.id
        const group = this.getShapeGroupById(id)
        if (group) {
            group.getChildren().forEach((shape) => {
                if (shape instanceof Konva.Text) {
                    if (styles.color !== undefined) {
                        shape.fill(styles.color)
                    }
                    if (styles.opacity !== undefined) {
                        shape.opacity(styles.opacity)
                    }
                }
            })

            const changedPayload: { konvaString: string; color?: string } = {
                konvaString: group.toJSON()
            }

            if (styles.color !== undefined) {
                changedPayload.color = styles.color
            }

            this.setChanged(id, changedPayload)
        }
    }
}
