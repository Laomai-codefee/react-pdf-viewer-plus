import { PdfBaseProps, User } from '@/types'
import { IAnnotationStore } from '../const/definitions'
import { DeepPartial } from '@/types/utils'

export type PdfAnnotatorUserOptions = DeepPartial<PdfAnnotatorOptions>


/**
 * PDF 注解器配置选项 / PDF Annotator Configuration Options
 * 定义PDF注解器的所有可配置参数 / Defines all configurable parameters for the PDF annotator
 */
export type PdfAnnotatorOptions = {
    /**
     * 颜色选项 / Color options
     * 用户在注解工具中可以选择的颜色列表 / List of colors users can select in annotation tools
     * @default: ['#ff0000', '#ffbe00', '#ffff00', '#83d33c', '#00b445', '#00b2f4', '#1677ff', '#001f63', '#7828a4', '#ff00ff']
     */
    colors?: string[]

    /**
     * 签名配置 / Signature configuration
     * 控制签名功能的相关设置 / Settings that control signature functionality
     */
    signature?: {
        /**
         * 签名颜色选项 / Signature color options
         * 签名工具可用的颜色 / Colors available for the signature tool
         * @default: ['#000000', '#ff0000', '#1677ff']
         */
        colors?: string[]

        /**
         * 默认签名类型 / Default signature type
         * Draw: 手绘签名 / Draw: Hand-drawn signature
         * Enter: 键入签名 / Enter: Typed signature
         * Upload: 上传签名 / Upload: Uploaded signature
         * @default: 'Draw'
         */
        type?: 'Draw' | 'Enter' | 'Upload'

        /**
         * 最大文件大小 / Maximum file size
         * 允许上传的签名文件最大字节数 / Maximum bytes allowed for uploaded signature files
         * @default: 1024 * 1024 * 5 (5MB)
         */
        maxSize?: number

        /**
         * 接受的文件类型 / Accepted file types
         * 签名上传功能接受的文件扩展名 / File extensions accepted by the signature upload feature
         * @default: '.png,.jpg,.jpeg,.bmp'
         */
        accept?: string

        /**
         * 默认的签名图片 base64 string / Default signature
         * @default: []
         */
        defaultSignature?: string[]

        /**
     * 手写字体列表 / Handwriting font list
     * 特殊的手写字体选项 / Special handwriting font options
     * @example [
                    {
                        label: '楷体',
                        value: 'STKaiti',
                        external: false,
                    },{
                        label: 'font name',
                        value: 'font value',
                        external: true,
                        url: 'font url'
                    }, 
                    {
                        label: '平方长安体',
                        value: 'PingFangChangAnTi-2',
                        external: true,
                        url: PingFangChangAnTiFont import url
                    }
                ]
     * @default: []
     */
        defaultFont?: {
            /**
             * 字体显示名称 / Font display name
             */
            label: string

            /**
             * 实际CSS字体值 / Actual CSS font value
             */
            value: string

            /**
             * 是否为外部字体 / Whether it's an external font
             * 如果为true，则从url加载字体 / If true, font is loaded from the url
             */
            external: boolean

            /**
             * 字体文件URL / Font file URL
             * 外部字体文件的位置 / Location of the external font file
             */
            url?: string
        }[]
    }

    /**
     * 盖章配置 / Stamp configuration
     * 控制盖章功能的相关设置 / Settings that control stamp functionality
     */
    stamp?: {
        /**
         * 最大文件大小 / Maximum file size
         * 允许上传的印章文件最大字节数 / Maximum bytes allowed for uploaded stamp files
         * @default: 1024 * 1024 * 5 (5MB)
         */
        maxSize?: number

        /**
         * 接受的文件类型 / Accepted file types
         * 盖章上传功能接受的文件扩展名 / File extensions accepted by the stamp upload feature
         * @default: '.png,.jpg,.jpeg,.bmp'
         */
        accept?: string

        /**
         * 默认印章 base64 string / Default stamp
         * @default: []
         */
        defaultStamp?: string[]

        /**
         * 印章编辑器配置 / Stamp editor configuration
         * 控制印章编辑器外观的设置 / Settings controlling the appearance of the stamp editor
         */
        editor?: {
            /**
             * 默认背景颜色 / Default background color
             * 印章的默认背景颜色 / Default background color for stamps
             * @default: #00b445
             */
            defaultBackgroundColor?: string

            /**
             * 默认边框颜色 / Default border color
             * 印章的默认边框颜色 / Default border color for stamps
             * @default: ''
             */
            defaultBorderColor?: string

            defaultBorderStyle?: 'none' | 'solid' | 'dashed'

            /**
             * 默认文字颜色 / Default text color
             * 印章文字的默认颜色 / Default color for stamp text
             * @default: '#fff'
             */
            defaultTextColor?: string
            /**
             * 默认字体列表 / Default font
             * 提供的默认字体选项，包含标签和实际CSS字体值 / Provided default font options with labels and actual CSS font values
             * @default [
                { label: 'Arial', value: 'Arial' },
                { label: 'Times New Roman', value: 'Times New Roman' },
                { label: 'Georgia', value: 'Georgia' },
                { label: 'Verdana', value: 'Verdana' },
                { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
                { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
                { label: 'Courier New', value: '"Courier New", Courier, monospace' },
                { label: 'Lucida Console', value: '"Lucida Console", Monaco, monospace' },
                { label: '宋体', value: 'SimSun, Songti SC, STSong, 宋体, "Noto Serif SC", serif' },
                { label: '黑体', value: 'Microsoft YaHei, PingFang SC, Heiti SC, SimHei, 黑体, sans-serif' },
                { label: '楷体', value: 'KaiTi, KaiTi_GB2312, STFangsong, 楷体, "AR PL UKai CN", serif' }
            ]
             */
            defaultFont?: {
                /**
                 * 字体显示名称 / Font display name
                 */
                label: string

                /**
                 * 实际CSS字体值 / Actual CSS font value
                 */
                value: string
            }[]
        }
    }
}

/**
 * PDF 批注组件的配置参数
 */
export interface PdfAnnotatorProps extends PdfBaseProps {

    /**
     * 当前用户信息，用于标注作者标识
     * @default: { id: 'null', name: 'unknown' }
     */
    user?: User

    /**
     * 是否加载PDF自带的批注
     * @default false
     */
    enableNativeAnnotations?: boolean

    /**
     * 默认选项配置
     * 如果不提供，则使用系统默认配置
     */
    defaultOptions?: DeepPartial<PdfAnnotatorUserOptions>

    /**
     * 已有的批注列表，用于在初始化时显示已存在的批注
     */
    initialAnnotations?: IAnnotationStore[]

    /**
     * 自定义额外按钮区域组件
     * 可以是一个 React 组件或者 React 元素
     * 组件会接收到以下属性:
     * - onSave: () => void 保存当前批注
     * - getData: () => IAnnotationStore[] 获取当前批注数据
     * - exportToExcel: () => void 导出到 Excel
     * - exportToPdf: () => void 导出到 PDF
     */
    actions?:
        | React.ReactNode
        | React.ComponentType<{
              save: () => void
              getAnnotations: () => IAnnotationStore[]
              exportToExcel: (fileName?: string) => void
              exportToPdf: (fileName?: string) => void
          }>

    /**
     * 保存回调
     * @param annotations IAnnotationStore
     */
    onSave?: (annotations: IAnnotationStore[]) => void

    /**
     * 加载完成回调
     */
    onLoad?: () => void

    /**
     * 添加批注回调
     * @param annotation
     * @returns
     */
    onAnnotationAdded?: (annotation: IAnnotationStore) => void

    /**
     * 删除批注回调
     * @param annotation
     * @returns
     */
    onAnnotationDeleted?: (id: string) => void
    /**
     * 选中批注回调
     * @param annotation
     * @param isClick
     * @returns
     */
    onAnnotationSelected?: (annotation: IAnnotationStore | null, isClick: boolean) => void
    /**
     * 修改批注回调
     * @param annotation
     * @returns
     */
    onAnnotationUpdated?: (annotation: IAnnotationStore) => void
}
