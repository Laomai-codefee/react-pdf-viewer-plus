import { Annotation, SquareAnnotation } from 'pdfjs'
import { Decoder, IDecoderOptions } from './decoder'
import Konva from 'konva'
import { SHAPE_GROUP_NAME } from '../const'
import { convertToRGB } from '../../utils/utils'
import { AnnotationType, IAnnotationStore } from '../../const/definitions'

export class SquareDecoder extends Decoder {
    constructor(options: IDecoderOptions) {
        super(options)
    }

    public decodePdfAnnotation(annotation: SquareAnnotation, allAnnotations: Annotation[]) {
        const color = convertToRGB(annotation.color || [0, 0, 0])
        const borderWidth = annotation.borderStyle.width === 1 ? annotation.borderStyle.width + 1 : annotation.borderStyle.width
        const { x, y, width, height } = this.convertRect(
            annotation.rect,
            annotation.pageViewer.viewport.scale,
            annotation.pageViewer.viewport.height
        )
        const ghostGroup = new Konva.Group({
            draggable: false,
            name: SHAPE_GROUP_NAME,
            id: annotation.id
        })
        const rect = new Konva.Rect({
            x,
            y,
            width,
            height,
            strokeScaleEnabled: false,
            stroke: color,
            strokeWidth: borderWidth,
            fill: annotation.borderStyle.width === 0 ? color : '',
            opacity: annotation.borderStyle.width === 0 ? 0.5 : 1
        })
        ghostGroup.add(rect)
        const annotationStore: IAnnotationStore = {
            id: annotation.id,
            pageNumber: annotation.pageNumber,
            konvaString: ghostGroup.toJSON(),
            konvaClientRect: ghostGroup.getClientRect(),
            title: annotation.titleObj.str,
            type: AnnotationType.RECTANGLE,
            color,
            pdfjsType: annotation.annotationType,
            subtype: annotation.subtype,
            date: annotation.modificationDate,
            contentsObj: {
                text: annotation.contentsObj.str
            },
            comments: this.getComments(annotation, allAnnotations),
            user: {
                id: annotation.titleObj.str,
                name: annotation.titleObj.str
            },
            native: true
        }

        ghostGroup.destroy()

        return annotationStore
    }
}
