import Konva from 'konva'

export function createDocumentIcon({
    x,
    y,
    fill = 'rgba(255, 221, 31, 1)',
    stroke = '#C0A042',
    strokeWidth = 0.8,
    cornerSize = 4,
}: {
    x: number
    y: number
    fill?: string
    stroke?: string
    strokeWidth?: number
    cornerSize?: number
}) {
    const width = 18
    const height = 20
    const foldSize = 5

    const elements: Konva.Shape[] = []

    // 主矩形：柔和渐变 + 更自然的阴影
    const rect = new Konva.Rect({
        x,
        y,
        width,
        height,
        cornerRadius: cornerSize,
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: 0, y: height },
        fillLinearGradientColorStops: [
            0, fill,
            1, '#FFFFFF'
        ],
        shadowColor: 'rgba(0,0,0,0.25)',
        shadowBlur: 4,
        shadowOffset: { x: 1, y: 2 },
        shadowOpacity: 0.5,
        stroke,
        strokeWidth,
    })
    elements.push(rect)

    // 折角
    const fold = new Konva.Line({
        points: [
            x + width - foldSize, y,
            x + width, y + foldSize,
            x + width - foldSize, y + foldSize
        ],
        fill: 'rgba(255,255,255,0.85)',
        closed: true,
        stroke: 'rgba(0,0,0,0.12)',
        strokeWidth: 0.6,
    })
    elements.push(fold)

    // 折角阴影
    const foldShadow = new Konva.Line({
        points: [
            x + width - foldSize, y + foldSize,
            x + width, y + foldSize,
            x + width - foldSize, y
        ],
        stroke: 'rgba(0,0,0,0.10)',
        strokeWidth: 0.4,
    })
    elements.push(foldShadow)

    // 文字模拟线条（更柔和、更现代）
    const padding = 4
    const textLines = 4
    const spacing = (height - padding * 2) / (textLines + 1)

    for (let i = 1; i <= textLines; i++) {
        const yPos = y + padding + i * spacing
        const line = new Konva.Line({
            points: [
                x + 3,
                yPos,
                x + width - (i === 1 ? 7 : 4),
                yPos
            ],
            stroke: 'rgba(0,0,0,0.45)',
            strokeWidth: 0.7,
            lineCap: 'round'
        })
        elements.push(line)
    }

    return elements
}
