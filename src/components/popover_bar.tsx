import { computePosition, flip, Middleware, Placement } from '@floating-ui/dom'
import { Button, Flex } from '@radix-ui/themes'
import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
    useCallback,
    useMemo,
    useEffect
} from 'react'

/**
 * 工具栏按钮基础属性
 */
export interface ToolbarButton {
    /** 按钮唯一标识 */
    key: string | number
    /** 按钮图标 */
    icon: React.ReactNode
    /** 按钮点击事件 */
    onClick: (range: Range | null, rect: DOMRect | null) => void
    /** 按钮文字（可选） */
    title?: string
    /** 按钮是否禁用（可选） */
    disabled?: boolean
}

/**
 * 工具栏位置选项
 */
export interface PopoverPositionOptions {
    /** 主要位置 */
    placement?: Placement
    /** 中间件 */
    middleware?: Middleware[]
}

/**
 * 动态按钮渲染参数
 */
export interface ButtonRenderParams {
    /** 当前选区范围 */
    range: Range | null
    /** 当前矩形区域 */
    rect: DOMRect | null
    /** 关闭工具栏 */
    close: () => void
}

/**
 * PopoverBar 组件属性
 */
export interface PopoverBarProps {
    /** 静态按钮配置 */
    buttons?: ToolbarButton[]
    /** 动态按钮渲染函数 */
    renderButtons?: (params: ButtonRenderParams) => ToolbarButton[]
    /** 位置选项 */
    positionOptions?: PopoverPositionOptions
    /** 类名 */
    className?: string
    /** 是否可见（受控模式） */
    visible?: boolean
    /** 可见性变化回调 */
    onVisibleChange?: (visible: boolean) => void
    /** 子元素 */
    children?: React.ReactNode
}

/**
 * PopoverBar 组件暴露的方法
 */
export interface PopoverBarRef {
    /**
     * 打开工具栏
     * @param range 选区范围
     */
    open: (range: Range | null) => void
    /**
     * 打开工具栏（基于矩形区域）
     * @param rect 矩形区域
     */
    openWithRect: (rect: DOMRect) => void
    /**
     * 关闭工具栏
     */
    close: () => void
}

const DEFAULT_POSITION_OPTIONS: PopoverPositionOptions = {
    placement: 'bottom',
    middleware: [flip()]
}

/**
 * PopoverBar 浮动工具栏组件
 * 
 * @example
 * ```tsx
 * // 静态按钮
 * <PopoverBar 
 *   ref={popoverRef}
 *   buttons={[
 *     { key: 'comment', icon: <CommentIcon />, onClick: handleComment },
 *     { key: 'highlight', icon: <HighlightIcon />, onClick: handleHighlight }
 *   ]}
 * />
 * 
 * // 动态按钮
 * <PopoverBar 
 *   ref={popoverRef}
 *   renderButtons={({ range, close }) => [
 *     { key: 'comment', icon: <CommentIcon />, onClick: () => { handleComment(); close(); } },
 *     range && range.toString().length > 10 
 *       ? { key: 'highlight', icon: <HighlightIcon />, onClick: handleHighlight }
 *       : null
 *   ].filter(Boolean) as ToolbarButton[]}
 * />
 * ```
 */
const PopoverBar = forwardRef<PopoverBarRef, PopoverBarProps>(function PopoverBar(props, ref) {
    const {
        buttons,
        renderButtons,
        positionOptions = DEFAULT_POSITION_OPTIONS,
        visible: controlledVisible,
        onVisibleChange,
        children
    } = props

    const isControlled = controlledVisible !== undefined
    const [uncontrolledVisible, setUncontrolledVisible] = useState(false)

    const isVisible = isControlled ? controlledVisible : uncontrolledVisible
    const setVisible = useCallback((visible: boolean) => {
        if (isControlled) {
            onVisibleChange?.(visible)
        } else {
            setUncontrolledVisible(visible)
        }
    }, [isControlled, onVisibleChange])

    const [pendingRect, setPendingRect] = useState<DOMRect | null>(null)


    const containerRef = useRef<HTMLDivElement | null>(null)
    const rangeRef = useRef<Range | null>(null)
    const rectRef = useRef<DOMRect | null>(null)

    const close = useCallback(() => {
        setVisible(false)
        rangeRef.current = null
        rectRef.current = null
    }, [setVisible])

    const open = useCallback((range: Range | null) => {
        rangeRef.current = range
        rectRef.current = null

        // 如果 range 为空，则关闭工具栏
        if (!range) {
            close()
            return
        }

        setVisible(true)

        // 根据 range 获取边界矩形
        const rect = range.getBoundingClientRect()

        // 处理跨页选择的情况，确保坐标不会出现负值
        let normalizedRect = rect
        if (rect.top < 0 || rect.left < 0) {
            // 如果是跨页选择，使用 Selection API 获取更准确的边界框
            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0) {
                // 获取选区中最顶端和底端的点
                const focusNode = selection.focusNode
                const anchorNode = selection.anchorNode

                if (focusNode && anchorNode) {
                    // 创建一个新的范围，只包含第一个字符，用来定位顶部
                    const startRange = document.createRange()
                    const endRange = document.createRange()

                    // 根据选择方向设置起始和结束范围
                    if (selection.anchorOffset <= selection.focusOffset) {
                        startRange.setStart(selection.anchorNode!, selection.anchorOffset)
                        startRange.setEnd(selection.anchorNode!, Math.min(selection.anchorOffset + 1, selection.anchorNode!.textContent?.length || 0))
                        endRange.setStart(selection.focusNode!, Math.max(selection.focusOffset - 1, 0))
                        endRange.setEnd(selection.focusNode!, selection.focusOffset)
                    } else {
                        startRange.setStart(selection.focusNode!, selection.focusOffset)
                        startRange.setEnd(selection.focusNode!, Math.min(selection.focusOffset + 1, selection.focusNode!.textContent?.length || 0))
                        endRange.setStart(selection.anchorNode!, Math.max(selection.anchorOffset - 1, 0))
                        endRange.setEnd(selection.anchorNode!, selection.anchorOffset)
                    }

                    // 获取起点和终点的边界框
                    const startRect = startRange.getBoundingClientRect()
                    const endRect = endRange.getBoundingClientRect()

                    // 合成一个新的边界框，确保它在视口内
                    normalizedRect = {
                        top: Math.max(0, Math.min(startRect.top, endRect.top)),
                        left: Math.max(0, Math.min(startRect.left, endRect.left)),
                        bottom: Math.max(startRect.bottom, endRect.bottom),
                        right: Math.max(startRect.right, endRect.right),
                        width: Math.abs(endRect.right - startRect.left),
                        height: Math.max(startRect.height, endRect.height),
                        x: Math.max(0, Math.min(startRect.x, endRect.x)),
                        y: Math.max(0, Math.min(startRect.y, endRect.y)),
                        toJSON: rect.toJSON
                    } as DOMRect
                }
            }
        }

        // 创建虚拟元素用于计算位置
        const virtualEl = {
            getBoundingClientRect: () => normalizedRect
        }

        // 等待下一帧确保 DOM 更新后再计算位置
        requestAnimationFrame(() => {
            if (containerRef.current) {
                computePosition(virtualEl, containerRef.current, positionOptions)
                    .then(({ x, y }) => {
                        if (containerRef.current) {
                            Object.assign(containerRef.current.style, {
                                left: `${x}px`,
                                top: `${y}px`
                            })
                        }
                    })
                    .catch((error) => {
                        console.warn('Failed to compute popover position:', error)
                    })
            }
        })
    }, [close, positionOptions, setVisible])

    useEffect(() => {
        if (isVisible && containerRef.current && pendingRect) {
            const virtualEl = {
                getBoundingClientRect: () => pendingRect
            }

            computePosition(virtualEl, containerRef.current, positionOptions)
                .then(({ x, y }) => {
                    if (containerRef.current) {
                        Object.assign(containerRef.current.style, {
                            left: `${x}px`,
                            top: `${y}px`
                        })
                    }
                })
                .catch((error) => {
                    console.warn('Failed to compute popover position:', error)
                })

            setPendingRect(null)
        }
    }, [isVisible, pendingRect, positionOptions])

    const openWithRect = useCallback((rect: DOMRect) => {
        rangeRef.current = null
        rectRef.current = rect

        // 如果组件还未挂载，先保存rect并在useEffect中处理
        if (!containerRef.current) {
            setPendingRect(rect)
        }

        setVisible(true)

        // 如果组件已挂载，直接计算位置
        if (containerRef.current) {
            const virtualEl = {
                getBoundingClientRect: () => rect
            }

            requestAnimationFrame(() => {
                if (containerRef.current) {
                    computePosition(virtualEl, containerRef.current, positionOptions)
                        .then(({ x, y }) => {
                            if (containerRef.current) {
                                Object.assign(containerRef.current.style, {
                                    left: `${x}px`,
                                    top: `${y}px`
                                })
                            }
                        })
                        .catch((error) => {
                            console.warn('Failed to compute popover position:', error)
                        })
                }
            })
        }
    }, [positionOptions, setVisible])

    useImperativeHandle(ref, () => ({
        open,
        openWithRect,
        close
    }), [open, openWithRect, close])

    // 渲染按钮
    const renderedButtons = useMemo(() => {
        const buttonList = renderButtons
            ? renderButtons({ range: rangeRef.current, rect: rectRef.current, close })
            : buttons || []

        return buttonList.map((button) => (
            <Button
                key={button.key}
                size="2"
                variant='ghost'
                color='gray'
                style={{
                    opacity: button.disabled ? 0.5 : 1,
                    boxShadow: 'none',
                    margin: '0'
                }}
                onMouseDown={() => {
                    button.onClick(rangeRef.current, rectRef.current)
                }}
                disabled={button.disabled}
            >
                {button.icon}
                {button.title}
            </Button>
        ))
    }, [buttons, close, renderButtons])

    const baseStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 999,
        display: isVisible ? 'block' : 'none',
        width: 'max-content',
        backgroundColor: '#fff',
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: 4,
        padding: '2px'
    };

    // 如果没有按钮且没有子元素，则不渲染
    if (renderedButtons.length === 0 && !children) {
        return null
    }

    return (
        <div
            ref={containerRef}
            style={baseStyle}
        >
            {children ? (
                children
            ) : (
                <Flex gap="1" align="center">
                    {renderedButtons}
                </Flex>
            )}
        </div>
    )
})

export { PopoverBar }