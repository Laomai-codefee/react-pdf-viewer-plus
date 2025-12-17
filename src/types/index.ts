export interface User {
    id: string
    name: string
    avatarUrl?: string
}

export type PdfScale = 'auto' | 'page-actual' | 'page-fit' | 'page-width' | string

export interface PdfBaseProps {
    /**
     * 主题色
     * @default: 'indigo'
     */
    theme?:
        | 'ruby'
        | 'indigo'
        | 'gray'
        | 'gold'
        | 'bronze'
        | 'brown'
        | 'yellow'
        | 'amber'
        | 'orange'
        | 'tomato'
        | 'red'
        | 'crimson'
        | 'pink'
        | 'plum'
        | 'purple'
        | 'violet'
        | 'iris'
        | 'blue'
        | 'cyan'
        | 'teal'
        | 'jade'
        | 'green'
        | 'grass'
        | 'lime'
        | 'mint'
        | 'sky'
        | undefined
    /**
     * 页面标题
     */
    title?: React.ReactNode
    /**
     * PDF 文件地址，支持字符串 URL 或 URL 对象
     * @example "https://example.com/doc.pdf"
     */
    url: string | URL
    /**
     * 语言区域，用于国际化
     * @default 'zh-CN'
     */
    locale?: 'zh-CN' | 'en-US'

    /**
     * 默认选项，用于初始化 PDF 阅读器 缩放
     * @default 'auto'
     */
    initialScale?: PdfScale
    /**
     * pdf viewer 容器的样式
     * @default { width: '100vw', height: '100vh' }
     */
    layoutStyle?: React.CSSProperties

    /**
     * 控制侧边栏是否折叠
     */
    isSidebarCollapsed?: boolean
}
