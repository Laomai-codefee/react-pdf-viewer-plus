import { Annotation, CircleAnnotation } from 'pdfjs'
import { Decoder, IDecoderOptions } from './decoder'
import Konva from 'konva'
import { SHAPE_GROUP_NAME } from '../const'
import { convertToRGB } from '../../utils/utils'
import { AnnotationType, IAnnotationStore } from '../../const/definitions'

export class CircleDecoder extends Decoder {
    constructor(options: IDecoderOptions) {
        super(options)
    }

    public decodePdfAnnotation(annotation: CircleAnnotation, allAnnotations: Annotation[]) {        
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
        const circle = new Konva.Ellipse({
            radiusX: width / 2,
            radiusY: height / 2,
            x: x + width /2,
            y: y + height /2,
            strokeScaleEnabled: false,
            strokeWidth: borderWidth,
            stroke: color,
            dash: annotation.borderStyle.style === 2 ? annotation.borderStyle.dashArray : [],
        })
        ghostGroup.add(circle)
        const annotationStore: IAnnotationStore = {
            id: annotation.id,
            pageNumber: annotation.pageNumber,
            konvaString: ghostGroup.toJSON(),
            konvaClientRect: ghostGroup.getClientRect(),
            title: annotation.titleObj.str,
            type: AnnotationType.CIRCLE,
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
