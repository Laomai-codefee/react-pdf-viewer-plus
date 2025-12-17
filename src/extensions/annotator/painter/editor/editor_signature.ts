import Konva from 'konva'
import { KonvaEventObject } from 'konva/lib/Node'

import { AnnotationType, IAnnotationType } from '../../const/definitions'
import { resizeImage, setCssCustomProperty } from '../../utils/utils'
import { CURSOR_CSS_PROPERTY } from '../const'
import { Editor, IEditorOptions } from './editor'

/**
 * EditorSignature 是继承自 Editor 的签名编辑器类。
 */
export class EditorSignature extends Editor {
    private signatureUrl: string | null // 签名图片的 URL
    private signatureImage: Konva.Image | null // Konva.Image 对象用于显示签名图片

    /**
     * 创建一个 EditorSignature 实例。
     * @param EditorOptions 初始化编辑器的选项
     * @param defaultSignatureUrl 默认的签名图片 URL
     */
    constructor(EditorOptions: IEditorOptions, defaultSignatureUrl: string | null) {
        super({ ...EditorOptions, editorType: AnnotationType.SIGNATURE }) // 调用父类的构造函数
        this.signatureUrl = defaultSignatureUrl // 设置签名图片 URL
        this.signatureImage = null
        if (defaultSignatureUrl) {
            this.createCursorImg() // 如果有默认签名图片 URL，则创建光标图像
        }
    }

    /**
     * 创建光标图像，并设置 CSS 自定义属性。
     */
    private createCursorImg() {
        const cursorGroup = new Konva.Group({
            draggable: false
        })

        if (this.signatureUrl) {
            // 从 URL 加载签名图片并处理
            Konva.Image.fromURL(this.signatureUrl, (image) => {
                            const { width, height } = image.getClientRect()
                            const { newWidth, newHeight } = resizeImage(width, height, 96)
                            const crosshair = { x: newWidth / 2, y: newHeight / 2 }
                            const outerFrame = new Konva.Rect({
                                x: 0,
                                y: 0,
                                width: newWidth,
                                height: newHeight,
                                stroke: this.primaryColor,
                                strokeWidth: 2,
                                cornerRadius: 2,
                            })
                            const softGlow = new Konva.Rect({
                                x: 0,
                                y: 0,
                                width: newWidth,
                                height: newHeight,
                                cornerRadius: 6,
                                shadowColor: 'rgba(0,0,0,0.25)',
                                shadowBlur: 12,
                                shadowOffset: { x: 0, y: 2 },
                                shadowOpacity: 0.35,
                            })
                            image.setAttrs({
                                x: 0,
                                y: 0,
                                width: newWidth,
                                height: newHeight,
                                opacity: 0.92,
                            })
                            const centerRing = new Konva.Circle({
                                x: crosshair.x,
                                y: crosshair.y,
                                radius: 7,
                                strokeWidth: 0,
                                fill: 'rgba(255,255,255,0.8)',
                            })
            
                            const centerDot = new Konva.Circle({
                                x: crosshair.x,
                                y: crosshair.y,
                                radius: 4,
                                fill: this.primaryColor,
                                opacity: 0.9,
                            })
                            cursorGroup.add(softGlow)
                            cursorGroup.add(outerFrame)
                            cursorGroup.add(image)
                            cursorGroup.add(centerRing)
                            cursorGroup.add(centerDot)
                            const cursorImg = cursorGroup.toDataURL()
                            cursorGroup.destroy()
            
                            setCssCustomProperty(
                                CURSOR_CSS_PROPERTY,
                                `url(${cursorImg}) ${crosshair.x} ${crosshair.y}, default`
                            )
                        })
        }
    }

    /**
     * 处理鼠标按下事件的方法，创建新的形状组并添加签名图片。
     * @param e Konva 事件对象
     */
    protected mouseDownHandler(e: KonvaEventObject<MouseEvent | TouchEvent>) {
        if (e.currentTarget !== this.konvaStage) {
            return // 如果事件不是在舞台上发生的，则直接返回
        }
        this.signatureImage = null
        this.currentShapeGroup = this.createShapeGroup() // 创建新的形状组
        this.getBgLayer().add(this.currentShapeGroup.konvaGroup) // 将形状组添加到背景图层
        const pos = this.konvaStage.getRelativePointerPosition()

        if (!this.signatureUrl) {
            return
        }

        if (!pos) {
            return
        }

        // 从 URL 加载签名图片并处理
        Konva.Image.fromURL(this.signatureUrl, async (image) => {
            const { width: width_rec, height: height_rec } = image.getClientRect()
            const { newWidth, newHeight } = resizeImage(width_rec, height_rec, 120)
            const crosshair = { x: newWidth / 2, y: newHeight / 2 }

            this.signatureImage = image
            this.signatureImage.setAttrs({
                x: pos.x - crosshair.x,
                y: pos.y - crosshair.y,
                width: newWidth,
                height: newHeight,
                base64: this.signatureUrl
            })
            this.currentShapeGroup?.konvaGroup.add(this.signatureImage)
            this.konvaStage.draw()
            const id = this.currentShapeGroup?.konvaGroup.id()
            if (id) {
                this.setShapeGroupDone({
                    id,
                    contentsObj: {
                        text: '',
                        image: this.signatureUrl || undefined
                    }
                })
                this.signatureImage = null
            }
        })
    }

    /**
     * 激活编辑器并设置签名图片。
     * @param konvaStage Konva 舞台对象
     * @param annotation 新的注解对象
     * @param signatureUrl 签名图片的 URL
     */
    public activateWithSignature(konvaStage: Konva.Stage, annotation: IAnnotationType, signatureUrl: string | null) {
        super.activate(konvaStage, annotation) // 调用父类的激活方法
        this.signatureUrl = signatureUrl // 设置签名图片 URL
        if (signatureUrl) {
            this.createCursorImg() // 如果有签名图片 URL，则创建光标图像
        }
    }

    /**
     * 将序列化的 Konva.Group 添加到图层，并恢复其中的签名图片。
     * @param konvaStage Konva 舞台对象
     * @param konvaString 序列化的 Konva.Group 字符串表示
     */
    public addSerializedGroupToLayer(konvaStage: Konva.Stage, konvaString: string) {
        const ghostGroup = Konva.Node.create(konvaString)
        const oldImage = this.getGroupNodesByClassName(ghostGroup, 'Image')[0] as Konva.Image
        const imageUrl = oldImage.getAttr('base64')

        // 从 URL 加载签名图片并替换旧图片
        Konva.Image.fromURL(imageUrl, async (image) => {
            image.setAttrs(oldImage.getAttrs())
            oldImage.destroy()
            ghostGroup.add(image)
        })

        // 将恢复后的组添加到背景图层
        this.getBgLayer(konvaStage).add(ghostGroup)
    }

    // 下面是未实现的抽象方法的空实现
    protected mouseMoveHandler() {}
    protected mouseUpHandler() {}

    protected changeStyle(): void {}
}
