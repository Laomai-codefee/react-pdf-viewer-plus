export default {
    common: {
        save: '保存',
        export: '导出',
        author: '作者',
        type: '类型',
        loading: 'PDF 加载中...',
        error: 'PDF加载失败',
        success: '操作成功',
        default: '默认',
        custom: '自定义',
        upload: '上传',
        ok: '确定',
        cancel: '取消',
        clear: '清空',
        selectAll: '全选',
        draw: '绘制',
        enter: '输入',
        confirm: '确认',
        reply: '回复',
        edit: '编辑',
        delete: '删除',
        more: '更多',
        color: '颜色',
        strokeWidth: '笔触宽度',
        opacity: '透明度',
        transparent: '透明',
        fileSizeLimit: '文件大小超出 {{value}} 限制',
        comment: '评论',
        dateFormat: {
            full: '{{year}}-{{month}}-{{day}} {{hour}}:{{minute}}',
            dayMonth: '{{month}}-{{day}}',
            dayMonthYear: '{{year}}-{{month}}-{{day}}'
        }
    },

    viewer: {
        zoom: {
            auto: '自动',
            actual: '实际大小',
            fit: '适合页面',
            width: '适合宽度',
            zoomIn: '放大',
            zoomOut: '缩小',
        },
        sidebar: {
            toggle: '切换侧边栏'
        }
    },

    annotator: {
        tool: {
            select: '选择',
            highlight: '高亮',
            strikeout: '删除线',
            underline: '下划线',
            rectangle: '矩形',
            circle: '圆形',
            freehand: '自由绘制',
            freeHighlight: '自由高亮',
            freeText: '文字',
            signature: '签名',
            stamp: '盖章',
            note: '注解',
            arrow: '箭头',
            cloud: '云线'
        },
        sidebar: {
            toggle: '查看所有批注'
        },
        common: {
            createStamp: '创建印章',
            createSignature: '创建签名',
            loadError: '批注加载失败',
            errorCode: '错误代码',
            unknownError: '未知错误',
            loading: '批注加载中...',
            loadingHint: '批注加载时间较长，请稍候...'
        },
        editor: {
            text: {
                startTyping: '输入文字，回车确认...'
            },
            stamp: {
                stampText: '印章内容',
                fontStyle: '字体样式',
                fontFamily: '字体',
                textColor: '文字颜色',
                backgroundColor: '背景颜色',
                borderColor: '边框颜色',
                borderStyle: '边框样式',
                timestampText: '时间戳',
                customTimestamp: '自定义',
                username: '用户名',
                date: '日期',
                time: '时间',
                dateFormat: '日期格式',
                solid: '实线',
                dashed: '虚线',
                none: '无',
                defaultText: '草稿',
                defaultStampNotSet: '未设置默认签章',
                upload: '选择图像'
            },
            signature: {
                area: '签名处',
                upload: '图像',
                choose: '选择图像',
                uploadHint: '支持{{format}}格式, 最大 {{maxSize}}'
            }
        },
        comment: {
            total: ' {{value}} 条批注',
            page: '第{{value}}页',
            status: {
                accepted: '接受',
                rejected: '拒绝',
                cancelled: '取消',
                completed: '完成',
                none: '无',
                closed: '关闭'
            },
            statusText: '将状态设置为 “{{value}}”',
            nativeAnnotation: '原生批注'
        },
        export: {
            fields: {
                id: 'ID',
                page: '页码',
                author: '用户',
                date: '日期',
                content: '内容',
                status: '状态',
                annotationType: '批注类型',
                recordType: '类型'
            },
            recordType: {
                annotation: '批注',
                reply: '回复'
            }
        }
    }
}
