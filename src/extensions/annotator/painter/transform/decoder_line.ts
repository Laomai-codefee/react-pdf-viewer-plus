import { Annotation, LineAnnotation } from 'pdfjs'
import { Decoder, IDecoderOptions } from './decoder'
import Konva from 'konva'
import { SHAPE_GROUP_NAME } from '../const'
import { convertToRGB } from '../../utils/utils'
import { AnnotationType, IAnnotationStore } from '../../const/definitions'

export class LineDecoder extends Decoder {
    constructor(options: IDecoderOptions) {
        super(options)
    }

    public decodePdfAnnotation(annotation: LineAnnotation, allAnnotations: Annotation[]) {
        const color = convertToRGB(annotation.color || [0, 0, 0])
        const width = annotation.borderStyle.width === 1 ? annotation.borderStyle.width + 1 : annotation.borderStyle.width
        const ghostGroup = new Konva.Group({
            draggable: false,
            name: SHAPE_GROUP_NAME,
            id: annotation.id
        })
        const createLine = (points: number[], _lineEndings: [string, string]) => {     
            return new Konva.Line({
                strokeScaleEnabled: false,
                stroke: color,
                strokeWidth: width,
                hitStrokeWidth: 20,
                dash: annotation.borderStyle.style === 2 ? annotation.borderStyle.dashArray : [],
                globalCompositeOperation: 'source-over',
                points
            })
        }
        const { x, y, x1, y1 } = this.convertCoordinates(
            annotation.lineCoordinates,
            annotation.pageViewer.viewport.scale,
            annotation.pageViewer.viewport.height
        )
        const line = createLine([x, y, x1, y1], annotation.lineEndings)
        ghostGroup.add(line)
        const annotationStore: IAnnotationStore = {
            id: annotation.id,
            pageNumber: annotation.pageNumber,
            konvaString: ghostGroup.toJSON(),
            konvaClientRect: ghostGroup.getClientRect(),
            title: annotation.titleObj.str,
            type: AnnotationType.FREEHAND,
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
