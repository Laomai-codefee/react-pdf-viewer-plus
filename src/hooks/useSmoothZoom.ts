import { useEffect, useRef } from 'react'
import type { PDFViewer } from 'pdfjs-dist/legacy/web/pdf_viewer.mjs'

interface UseSmoothZoomOptions {
    pdfViewer: PDFViewer | null
    containerRef: React.RefObject<HTMLElement>
    minScale?: number
    maxScale?: number
}

export function useSmoothZoom({ pdfViewer, containerRef, minScale = 0.1, maxScale = 5 }: UseSmoothZoomOptions) {
    const baseScaleRef = useRef(1)
    const visualScaleRef = useRef(1)
    const commitTimerRef = useRef<number | null>(null)
    const anchorRef = useRef<{ 
        x: number
        y: number
        containerX: number
        containerY: number
    } | null>(null)

    const clamp = (v: number) => Math.min(maxScale, Math.max(minScale, v))
    
    // 应用视觉缩放
    const applyVisualScale = (container: HTMLElement, viewerEl: HTMLElement, scale: number) => {
        visualScaleRef.current = scale

        // 应用CSS变换
        viewerEl.style.transformOrigin = '0 0'
        viewerEl.style.transform = `scale(${scale})`

        // 保持锚点位置不变
        if (anchorRef.current) {
            const targetScrollLeft = anchorRef.current.x * baseScaleRef.current * scale - anchorRef.current.containerX
            const targetScrollTop = anchorRef.current.y * baseScaleRef.current * scale - anchorRef.current.containerY
            
            container.scrollLeft = targetScrollLeft
            container.scrollTop = targetScrollTop
        }
    }

    // 提交缩放到 PDF.js
    const commitScale = (container: HTMLElement, viewerEl: HTMLElement) => {
        if (!pdfViewer) return

        // 计算最终缩放值
        const finalScale = clamp(baseScaleRef.current * visualScaleRef.current)
        
        // 清除视觉变换
        viewerEl.style.transform = ''
        viewerEl.style.transformOrigin = ''

        // 应用实际缩放
        pdfViewer.currentScale = finalScale
        baseScaleRef.current = finalScale
        visualScaleRef.current = 1

        // 保持锚点位置
        if (anchorRef.current) {
            const targetScrollLeft = anchorRef.current.x * finalScale - anchorRef.current.containerX
            const targetScrollTop = anchorRef.current.y * finalScale - anchorRef.current.containerY
            
            container.scrollLeft = targetScrollLeft
            container.scrollTop = targetScrollTop

            // 清除锚点
            anchorRef.current = null
        }
    }

    // 安排提交缩放
    const scheduleCommit = (container: HTMLElement, viewerEl: HTMLElement) => {
        if (commitTimerRef.current) {
            clearTimeout(commitTimerRef.current)
        }
        commitTimerRef.current = window.setTimeout(() => {
            commitScale(container, viewerEl)
        }, 120)
    }

    // 处理缩放操作
    const handleZoom = (container: HTMLElement, viewerEl: HTMLElement, containerX: number, containerY: number, scaleFactor: number) => {
        // 设置锚点（如果尚未设置）
        if (!anchorRef.current) {
            anchorRef.current = {
                x: (container.scrollLeft + containerX) / (baseScaleRef.current * visualScaleRef.current),
                y: (container.scrollTop + containerY) / (baseScaleRef.current * visualScaleRef.current),
                containerX,
                containerY
            }
        }
        
        // 计算新的视觉缩放值
        const newVisualScale = visualScaleRef.current * scaleFactor
        
        // 应用视觉缩放
        applyVisualScale(container, viewerEl, newVisualScale)
        
        // 安排提交
        scheduleCommit(container, viewerEl)
    }

    useEffect(() => {
        const container = containerRef.current
        if (!pdfViewer || !container) return

        const viewerEl = container.querySelector('.pdfViewer') as HTMLElement
        if (!viewerEl) return

        // 初始化当前缩放值
        baseScaleRef.current = pdfViewer.currentScale
        visualScaleRef.current = 1

        // 处理鼠标滚轮缩放
        const handleWheel = (e: WheelEvent) => {
            if (!e.ctrlKey && !e.metaKey) return

            e.preventDefault()
            e.stopPropagation()

            // 获取鼠标在容器中的坐标
            const rect = container.getBoundingClientRect()
            const containerX = e.clientX - rect.left
            const containerY = e.clientY - rect.top

            // 判断是触控板还是鼠标滚轮
            const isTrackpad = Math.abs(e.deltaY) < 50
            const step = isTrackpad ? 0.02 : 0.1
            const scaleFactor = e.deltaY < 0 ? 1 + step : 1 - step

            // 处理缩放
            handleZoom(container, viewerEl, containerX, containerY, scaleFactor)
        }

        // 处理触摸缩放
        let initialDistance = 0

        const getDistance = (touch1: Touch, touch2: Touch) => {
            return Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) + 
                Math.pow(touch2.clientY - touch1.clientY, 2)
            )
        }

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                initialDistance = getDistance(e.touches[0], e.touches[1])
                e.preventDefault()
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length !== 2 || initialDistance <= 0) return

            const currentDistance = getDistance(e.touches[0], e.touches[1])
            const scaleFactor = currentDistance / initialDistance
            
            // 使用双指中心作为锚点
            const containerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - container.getBoundingClientRect().left
            const containerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - container.getBoundingClientRect().top

            // 处理缩放
            handleZoom(container, viewerEl, containerX, containerY, scaleFactor)
            
            // 更新初始距离（用于连续缩放）
            initialDistance = currentDistance
            
            e.preventDefault()
        }

        const handleTouchEnd = () => {
            initialDistance = 0
            
            // 如果正在进行缩放，立即提交
            if (anchorRef.current && visualScaleRef.current !== 1) {
                setTimeout(() => {
                    if (container && viewerEl) {
                        commitScale(container, viewerEl)
                    }
                }, 50)
            }
        }

        // 添加事件监听器
        container.addEventListener('wheel', handleWheel, { passive: false })
        container.addEventListener('touchstart', handleTouchStart, { passive: false })
        container.addEventListener('touchmove', handleTouchMove, { passive: false })
        container.addEventListener('touchend', handleTouchEnd)
        container.addEventListener('touchcancel', handleTouchEnd)

        return () => {
            container.removeEventListener('wheel', handleWheel)
            container.removeEventListener('touchstart', handleTouchStart)
            container.removeEventListener('touchmove', handleTouchMove)
            container.removeEventListener('touchend', handleTouchEnd)
            container.removeEventListener('touchcancel', handleTouchEnd)

            if (commitTimerRef.current) {
                clearTimeout(commitTimerRef.current)
            }
        }
    }, [pdfViewer, containerRef, minScale, maxScale])

    // 提供手动更新基础缩放的方法
    const updateBaseScale = () => {
        if (pdfViewer) {
            baseScaleRef.current = pdfViewer.currentScale
            visualScaleRef.current = 1
        }
    }

    return { updateBaseScale }
}
