import { PdfAnnotatorOptions } from '../types/annotator'

/**
 * PDF 注解器默认配置项 / Default configuration options for PDF annotator
 * 包含颜色、字体、签名、盖章等设置 / Contains settings for colors, fonts, signatures, stamps, etc.
 */
const defaultOptions: PdfAnnotatorOptions = {
    // 可选颜色列表 / Available color options
    colors: [
        '#ff6b6b',
        '#ffa94d',
        '#ffe066',
        '#b4fa56',
        '#51cf66',
        '#4dabf7',
        '#228be6',
        '#364fc7',
        '#9c36b5',
        '#e64980',
        '#1272e8',
        '#04861b',
        '#da3324',
        '#000000',
        '#fefefe'
    ],

    // 签名默认配置 / Signature default configuration
    signature: {
        colors: ['#000000', '#ff0000', '#1677ff'], // 签名可用颜色 / Available signature colors
        type: 'Enter', // 默认签名模式: Draw 绘制，Enter 输入，Upload 上传 / Default signature mode: Draw, Enter, Upload
        maxSize: 1024 * 1024 * 5, // 最大文件大小为 5MB / Maximum file size is 5MB
        accept: '.png,.jpg,.jpeg,.bmp', // 签名文件允许的格式 / Allowed signature file formats
        defaultSignature: [], // 默认签名图片 / Default signature image
        defaultFont: [
            {
                label: '楷体',
                value: 'STKaiti',
                external: false
            }
        ] // 默认字体列表 / Default font list
    },

    // 盖章默认配置 / Stamp default configuration
    stamp: {
        maxSize: 1024 * 1024 * 5, // 最大文件大小为 5MB / Maximum file size is 5MB
        accept: '.png,.jpg,.jpeg,.bmp', // 盖章文件允许的格式 / Allowed stamp file formats
        defaultStamp: [], // 默认印章内容 / Default stamp content
        editor: {
            // 编辑器默认配置 / Editor default configuration
            defaultBackgroundColor: '#2f9e44', // 默认背景颜色 / Default background color
            defaultBorderColor: '#2b8a3e', // 默认边框颜色 / Default border color
            defaultBorderStyle: 'none', // 默认边框样式 / Default border style
            defaultTextColor: '#fff', // 默认文字颜色 / Default text color
            defaultFont: [
                // 默认字体列表 / Default font list
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
        }
    }
}

export { defaultOptions }
