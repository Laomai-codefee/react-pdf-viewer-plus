export default {
    common: {
        save: 'Save',
        export: 'Export',
        author: 'Author',
        type: 'Type',
        loading: 'PDF Loading...',
        error: 'Load failed',
        success: 'Successfully',
        default: 'Default',
        custom: 'Custom',
        upload: 'Upload',
        ok: 'OK',
        cancel: 'Cancel',
        clear: 'Clear',
        selectAll: 'Select All',
        draw: 'Draw',
        enter: 'Enter',
        confirm: 'Confirm',
        reply: 'Reply',
        edit: 'Edit',
        delete: 'Delete',
        more: 'More',
        color: 'Color',
        strokeWidth: 'Stroke',
        opacity: 'Opacity',
        transparent: 'Transparent',
        comment: 'Comment',
        fileSizeLimit: 'The file size exceeds the {{value}} limit',
        dateFormat: {
            full: '{{month}}/{{day}}/{{year}} {{hour}}:{{minute}}',
            dayMonth: '{{month}}/{{day}}',
            dayMonthYear: '{{month}}/{{day}}/{{year}}'
        }
    },

    viewer: {
        zoom: {
            auto: 'auto',
            actual: 'actual',
            fit: 'page-fit',
            width: 'page-width',
            zoomIn: 'Zoom In',
            zoomOut: 'Zoom Out',
        },
        sidebar: {
            toggle: 'Toggle Sidebar'
        }
    },

    annotator: {
        tool: {
            select: 'Select',
            highlight: 'Highlight',
            strikeout: 'Strikeout',
            underline: 'Underline',
            rectangle: 'Rectangle',
            circle: 'Circle',
            freehand: 'Free Hand',
            freeHighlight: 'Free Highlight',
            freeText: 'Text',
            signature: 'Signature',
            stamp: 'Stamp',
            note: 'Note',
            arrow: 'Arrow',
            cloud: 'Cloud'
        },
        sidebar: {
            toggle: 'Show Annotations'
        },
        common: {
            createStamp: 'Create Stamp',
            createSignature: 'Create signature',
            loadError: 'Annotation load failed',
            errorCode: 'Error code',
            unknownError: 'Unknown error',
            loading: 'Annotation loading...',
            loadingHint: 'Annotation loading time is long, please wait...'
        },
        editor: {
            text: {
                startTyping: 'Start typing…'
            },
            stamp: {
                stampText: 'Stamp Text',
                fontStyle: 'Font Style',
                fontFamily: 'Font Family',
                textColor: 'Text Color',
                backgroundColor: 'Background Color',
                borderColor: 'Border Color',
                borderStyle: 'Border Style',
                timestampText: 'Timestamp Text',
                customTimestamp: 'Custom Text',
                username: 'Username',
                date: 'Date',
                time: 'Time',
                dateFormat: 'Date Format',
                solid: 'Solid',
                dashed: 'Dashed',
                none: 'None',
                defaultText: 'Draft',
                defaultStampNotSet: 'Default Stamp Not Set', 
                upload: 'Choose Image'
            },
            signature: {
                area: 'Signature',
                upload: 'Image',
                choose: 'Choose Image',
                uploadHint: '{{format}}, maxSize {{maxSize}}'
            }
        },
        comment: {
            total: 'Comment {{value}}',
            page: 'Page {{value}}',
            status: {
                accepted: 'Accepted',
                rejected: 'Rejected',
                cancelled: 'Cancelled',
                completed: 'Completed',
                none: 'None',
                closed: 'Closed'
            },
            statusText: 'Set Status: {{value}}',
            nativeAnnotation: 'Native Annotation'
        },
        export: {
            fields: {
                id: 'ID',
                page: 'Page',
                author: 'Author',
                date: 'Date',
                content: 'Content',
                status: 'Status',
                annotationType: 'Annotation Type',
                recordType: 'Type'
            },
            recordType: {
                annotation: 'Annotation',
                reply: 'Reply'
            }
        }
    }
}
