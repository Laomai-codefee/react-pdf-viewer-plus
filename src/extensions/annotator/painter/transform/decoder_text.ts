import { Annotation, TextAnnotation } from 'pdfjs'
import { Decoder, IDecoderOptions } from './decoder'
import Konva from 'konva'
import { SHAPE_GROUP_NAME } from '../const'
import { convertToRGB } from '../../utils/utils'
import { AnnotationType, IAnnotationStore } from '../../const/definitions'
import { createDocumentIcon } from '../../const/documentIcon'

export class TextDecoder extends Decoder {
    constructor(options: IDecoderOptions) {
        super(options)
    }

    public decodePdfAnnotation(annotation: TextAnnotation, allAnnotations: Annotation[]) {
        if (annotation.inReplyTo) return null
        const color = convertToRGB(annotation.color || [0, 0, 0])
        const { x, y } = this.convertRect(annotation.rect, annotation.pageViewer.viewport.scale, annotation.pageViewer.viewport.height)
        const ghostGroup = new Konva.Group({
            draggable: false,
            name: SHAPE_GROUP_NAME,
            id: annotation.id
        })
        const docIcon = createDocumentIcon({x, y, fill: color})
        ghostGroup.add(...docIcon)
        const annotationStore: IAnnotationStore = {
            id: annotation.id,
            pageNumber: annotation.pageNumber,
            konvaString: ghostGroup.toJSON(),
            konvaClientRect: ghostGroup.getClientRect(),
            title: annotation.titleObj.str,
            type: AnnotationType.NOTE,
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
